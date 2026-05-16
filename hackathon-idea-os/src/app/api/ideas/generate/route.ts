import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { IDEAS_PROMPT } from "@/lib/prompts";

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { userProfile, githubSignals, hackathon, answers } = await req.json();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: IDEAS_PROMPT },
      {
        role: "user",
        content: `Generate 10 ranked hackathon ideas for:\n\nUser Profile:\n${JSON.stringify(userProfile, null, 2)}\n\nGitHub Signals:\n${JSON.stringify(githubSignals, null, 2)}\n\nHackathon:\n${JSON.stringify(hackathon, null, 2)}\n\nLife Answers:\n${JSON.stringify(answers, null, 2)}\n\nReturn JSON with key "ideas" containing the array of exactly 10 ideas.`,
      },
    ],
  });

  const parsed = JSON.parse(completion.choices[0].message.content!);
  const ideas = parsed.ideas || parsed;
  const list = Array.isArray(ideas) ? ideas : [];
  // Ensure IDs
  const withIds = list.map((idea: { id?: string }, i: number) => ({
    ...idea,
    id: idea.id || `idea-${i + 1}`,
  }));
  return NextResponse.json(withIds);
}
