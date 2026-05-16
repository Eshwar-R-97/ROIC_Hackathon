import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { HACKATHON_SEARCH_PROMPT } from "@/lib/prompts";

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { query } = await req.json();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: HACKATHON_SEARCH_PROMPT },
      {
        role: "user",
        content: `Find hackathons matching: "${query}". Return as JSON with key "results" containing an array.`,
      },
    ],
  });

  const parsed = JSON.parse(completion.choices[0].message.content!);
  const results = parsed.results || parsed;
  return NextResponse.json(Array.isArray(results) ? results : []);
}
