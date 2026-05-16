import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { HACKATHON_SEARCH_PROMPT } from "@/lib/prompts";
import { HackathonSearchResult } from "@/lib/types";
import { PINNED_HACKATHON_SEARCH_RESULTS } from "@/lib/pinnedHackathons";

function getStartOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function parseHackathonDate(dateText: string | null) {
  if (!dateText) return null;

  const normalized = dateText
    .replace(/\b(\d{1,2})(st|nd|rd|th)\b/gi, "$1")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  const directParse = Date.parse(normalized);
  if (!Number.isNaN(directParse)) {
    return new Date(directParse);
  }

  const monthRangeMatch = normalized.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:\s*-\s*\d{1,2})?,?\s+(\d{4})\b/i,
  );

  if (monthRangeMatch) {
    const [, month, day, year] = monthRangeMatch;
    const parsed = Date.parse(`${month} ${day}, ${year}`);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed);
    }
  }

  return null;
}

function isUpcomingHackathon(dateText: string | null) {
  const parsedDate = parseHackathonDate(dateText);
  if (!parsedDate) return true;
  return parsedDate >= getStartOfToday();
}

function isSearchResultCandidate(value: unknown): value is Partial<HackathonSearchResult> & { title: string } {
  return typeof value === "object" && value !== null && typeof (value as { title?: unknown }).title === "string";
}

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { query, userProfile, githubSignals } = await req.json();
  const todayIso = getStartOfToday().toISOString().slice(0, 10);

  if (!query || typeof query !== "string") {
    return NextResponse.json({ error: "Search query is required." }, { status: 400 });
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: HACKATHON_SEARCH_PROMPT },
      {
        role: "user",
        content: `Today's date is ${todayIso}.

Find hackathons matching this search query: "${query}".
Only include events that are upcoming on or after ${todayIso}. Exclude events that have already ended.

User profile:
${JSON.stringify(userProfile ?? {}, null, 2)}

GitHub signals:
${JSON.stringify(githubSignals ?? {}, null, 2)}

Return as JSON with key "results" containing the array.`,
      },
    ],
  });

  const parsed = JSON.parse(completion.choices[0].message.content!);
  const results: unknown[] = Array.isArray(parsed.results) ? parsed.results : [];
  const filteredResults = results
    .filter(isSearchResultCandidate)
    .filter((result) => isUpcomingHackathon(result.date ?? null))
    .map((result) => ({
      title: result.title,
      date: result.date ?? null,
      location: result.location ?? null,
      url: result.url ?? null,
      description: result.description ?? null,
      fitSummary: result.fitSummary ?? null,
    }));

  // Pinned hackathons always appear first; deduplicate by title.
  const pinnedTitles = new Set(PINNED_HACKATHON_SEARCH_RESULTS.map((h) => h.title.toLowerCase()));
  const dedupedResults = filteredResults.filter(
    (r) => !pinnedTitles.has(r.title.toLowerCase())
  );

  return NextResponse.json([...PINNED_HACKATHON_SEARCH_RESULTS, ...dedupedResults]);
}
