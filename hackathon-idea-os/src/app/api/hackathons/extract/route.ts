import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { HACKATHON_EXTRACT_PROMPT } from "@/lib/prompts";
import { buildHackathonFallback, mergeHackathonDetails, normalizeHackathon } from "@/lib/hackathons";
import { Hackathon } from "@/lib/types";

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const {
    url,
    lumaUrl,
    rawText,
    fallbackHackathon,
  }: {
    url?: string;
    lumaUrl?: string;
    rawText?: string;
    fallbackHackathon?: Partial<Hackathon>;
  } = await req.json();
  const sourceUrl = url ?? lumaUrl ?? fallbackHackathon?.sourceUrl ?? null;
  const fallback = buildHackathonFallback(fallbackHackathon, sourceUrl);

  let content = rawText || "";

  if (sourceUrl && !rawText) {
    try {
      const res = await fetch(sourceUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; HackathonIdeaOS/1.0)" },
      });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      content = await res.text();
      // Strip HTML tags for cleaner input
      content = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 8000);
    } catch {
      if (fallback) {
        return NextResponse.json(fallback);
      }
      return NextResponse.json({ error: "Could not fetch hackathon page" }, { status: 400 });
    }
  }

  if (!content.trim()) {
    if (fallback) {
      return NextResponse.json(fallback);
    }
    return NextResponse.json({ error: "No hackathon content available" }, { status: 400 });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: HACKATHON_EXTRACT_PROMPT },
        {
          role: "user",
          content: `Extract hackathon details from this content${sourceUrl ? ` (from ${sourceUrl})` : ""}:\n\n${content}`,
        },
      ],
    });

    const extracted = normalizeHackathon(JSON.parse(completion.choices[0].message.content!), "full");
    const merged = fallback ? mergeHackathonDetails(fallback, { ...extracted, extractionStatus: "full" }) : extracted;
    return NextResponse.json(merged);
  } catch {
    if (fallback) {
      return NextResponse.json(fallback);
    }
    return NextResponse.json({ error: "Could not extract hackathon details" }, { status: 400 });
  }
}
