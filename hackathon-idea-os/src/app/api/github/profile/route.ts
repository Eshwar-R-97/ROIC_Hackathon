import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { GITHUB_PROFILE_PROMPT } from "@/lib/prompts";

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { githubUsername } = await req.json();

  const reposRes = await fetch(
    `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=20`,
    { headers: { Accept: "application/vnd.github+json" } }
  );

  if (!reposRes.ok) {
    return NextResponse.json({ error: "GitHub user not found" }, { status: 404 });
  }

  const repos = await reposRes.json();
  const repoSummary = repos
    .slice(0, 15)
    .map((r: { name: string; description: string | null; language: string | null; topics: string[] }) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      topics: r.topics,
    }));

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: GITHUB_PROFILE_PROMPT },
      {
        role: "user",
        content: `Analyze these GitHub repositories for user "${githubUsername}":\n${JSON.stringify(repoSummary, null, 2)}`,
      },
    ],
  });

  const signals = JSON.parse(completion.choices[0].message.content!);
  return NextResponse.json(signals);
}
