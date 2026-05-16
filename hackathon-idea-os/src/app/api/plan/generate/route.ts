import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { PLAN_PROMPT } from "@/lib/prompts";

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { selectedIdea, userProfile, hackathon } = await req.json();

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: PLAN_PROMPT },
      {
        role: "user",
        content: `Create a complete build plan for:\n\nSelected Idea:\n${JSON.stringify(selectedIdea, null, 2)}\n\nUser Profile:\n${JSON.stringify(userProfile, null, 2)}\n\nHackathon:\n${JSON.stringify(hackathon, null, 2)}`,
      },
    ],
  });

  const plan = JSON.parse(completion.choices[0].message.content!);
  return NextResponse.json(plan);
}
