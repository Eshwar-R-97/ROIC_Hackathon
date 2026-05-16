import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { buildHackathonAnchorNodes, buildSignalNodes, sanitizeFitGraph } from "@/lib/fit-graph";
import { IDEAS_PROMPT } from "@/lib/prompts";
import { IdeasResponse } from "@/lib/types";

function normalizeIdeas(rawIdeas: unknown) {
  const list = Array.isArray(rawIdeas) ? rawIdeas : [];

  return list.map((idea, index) => {
    const record = (idea && typeof idea === "object" ? idea : {}) as Record<string, unknown>;
    const title =
      typeof record.title === "string" && record.title.trim().length > 0
        ? record.title.trim()
        : `Idea ${index + 1}`;

    return {
      id:
        typeof record.id === "string" && record.id.trim().length > 0
          ? record.id.trim()
          : `idea-${index + 1}`,
      title,
      problem: typeof record.problem === "string" ? record.problem : "",
      personalConnection:
        typeof record.personalConnection === "string" ? record.personalConnection : "",
      trackFit: typeof record.trackFit === "string" ? record.trackFit : "",
      sponsorFit: typeof record.sponsorFit === "string" ? record.sponsorFit : "",
      demoMoment: typeof record.demoMoment === "string" ? record.demoMoment : "",
      mvpFeatures: Array.isArray(record.mvpFeatures)
        ? record.mvpFeatures.filter((value): value is string => typeof value === "string")
        : [],
      stretchFeatures: Array.isArray(record.stretchFeatures)
        ? record.stretchFeatures.filter((value): value is string => typeof value === "string")
        : [],
      stack: Array.isArray(record.stack)
        ? record.stack.filter((value): value is string => typeof value === "string")
        : [],
      winScore: Number.isFinite(record.winScore) ? Number(record.winScore) : 0,
      feasibilityScore: Number.isFinite(record.feasibilityScore)
        ? Number(record.feasibilityScore)
        : 0,
      noveltyScore: Number.isFinite(record.noveltyScore) ? Number(record.noveltyScore) : 0,
      sponsorScore: Number.isFinite(record.sponsorScore) ? Number(record.sponsorScore) : 0,
    };
  });
}

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { userProfile, githubSignals, hackathon, answers } = await req.json();
  const signalNodes = buildSignalNodes(userProfile, githubSignals);
  const hackathonNodes = buildHackathonAnchorNodes(hackathon);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: IDEAS_PROMPT },
      {
        role: "user",
        content: `Generate 10 ranked hackathon ideas for:

User Profile:
${JSON.stringify(userProfile, null, 2)}

GitHub Signals:
${JSON.stringify(githubSignals, null, 2)}

Hackathon:
${JSON.stringify(hackathon, null, 2)}

Life Answers:
${JSON.stringify(answers, null, 2)}

Allowed signal nodes for the fit graph:
${JSON.stringify(signalNodes, null, 2)}

Allowed hackathon nodes for the fit graph:
${JSON.stringify(hackathonNodes, null, 2)}

Return JSON with keys "ideas" and "fitGraph".`,
      },
    ],
  });

  const parsed = JSON.parse(completion.choices[0].message.content!);
  const ideas = normalizeIdeas(parsed.ideas ?? parsed);
  const fitGraph = sanitizeFitGraph(parsed.fitGraph, ideas.slice(0, 3), signalNodes, hackathonNodes);

  const response: IdeasResponse = {
    ideas,
    fitGraph,
  };

  return NextResponse.json(response);
}
