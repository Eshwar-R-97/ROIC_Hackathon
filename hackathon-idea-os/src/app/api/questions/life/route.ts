import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { QUESTIONS_PROMPT } from "@/lib/prompts";

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { userProfile, hackathon } = await req.json();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: QUESTIONS_PROMPT },
      {
        role: "user",
        content: `Generate adaptive questions for this user and hackathon:\n\nUser Profile:\n${JSON.stringify(userProfile, null, 2)}\n\nHackathon:\n${JSON.stringify(hackathon, null, 2)}\n\nReturn JSON with key "questions" containing the array.`,
      },
    ],
  });

  const parsed = JSON.parse(completion.choices[0].message.content!);
  const questions = parsed.questions || parsed;
  return NextResponse.json(Array.isArray(questions) ? questions : []);
}
