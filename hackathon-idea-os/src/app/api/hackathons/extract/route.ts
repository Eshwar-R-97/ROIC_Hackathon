import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { HACKATHON_EXTRACT_PROMPT } from "@/lib/prompts";
import { PINNED_HACKATHON_DETAILS } from "@/lib/pinnedHackathons";

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { lumaUrl, rawText } = await req.json();

  if (lumaUrl && PINNED_HACKATHON_DETAILS[lumaUrl]) {
    return NextResponse.json(PINNED_HACKATHON_DETAILS[lumaUrl]);
  }

  let content = rawText || "";

  if (lumaUrl && !rawText) {
    try {
      const res = await fetch(lumaUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; HackathonIdeaOS/1.0)" },
      });
      content = await res.text();
      // Strip HTML tags for cleaner input
      content = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 8000);
    } catch {
      return NextResponse.json({ error: "Could not fetch hackathon page" }, { status: 400 });
    }
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: HACKATHON_EXTRACT_PROMPT },
      {
        role: "user",
        content: `Extract hackathon details from this content${lumaUrl ? ` (from ${lumaUrl})` : ""}:\n\n${content}`,
      },
    ],
  });

  const hackathon = JSON.parse(completion.choices[0].message.content!);
  return NextResponse.json(hackathon);
}
