"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { ProgressBar } from "@/components/ProgressBar";
import { PageShell } from "@/components/PageShell";
import { IdeaCard } from "@/components/IdeaCard";
import { Idea, IdeasResponse } from "@/lib/types";

export default function IdeasPage() {
  const router = useRouter();
  const { state, update } = useSession();
  const [ideas, setIdeas] = useState<Idea[]>(state.generatedIdeas || []);
  const [loading, setLoading] = useState(ideas.length === 0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ideas.length > 0) return;
    if (!state.userProfile || !state.selectedHackathon) { router.push("/onboarding"); return; }
    const controller = new AbortController();
    fetch("/api/ideas/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userProfile: state.userProfile,
        githubSignals: state.githubSignals,
        hackathon: state.selectedHackathon,
        answers: state.lifeAnswers,
      }),
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to generate ideas.");
        return r.json();
      })
      .then((generated: IdeasResponse) => {
        setIdeas(generated.ideas);
        update({ generatedIdeas: generated.ideas, fitGraph: generated.fitGraph });
        setLoading(false);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setError("Failed to generate ideas. Please try again.");
        setLoading(false);
      });
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelect(id: string) {
    update({ selectedIdeaId: id, finalPlan: null, step: 6 });
    router.push("/final-plan");
  }

  function handleGraphContinue() {
    update({ selectedIdeaId: state.fitGraph?.topIdeaIds[0] ?? ideas[0]?.id ?? null, finalPlan: null, step: 5 });
    router.push("/fit-graph");
  }

  if (loading) {
    return (
      <PageShell>
        <div className="max-w-3xl mx-auto">
          <ProgressBar currentStep={4} />
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-500 text-sm">Generating 10 personalized ideas...</p>
            <p className="text-zinc-400 text-xs mt-2">This may take 20–30 seconds</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <div className="max-w-3xl mx-auto">
          <ProgressBar currentStep={4} />
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
          <button onClick={() => router.push("/questions")} className="mt-4 text-sm text-zinc-600 hover:underline">← Go back</button>
        </div>
      </PageShell>
    );
  }

  const topScore = ideas[0]?.winScore || 0;

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto">
        <ProgressBar currentStep={4} />
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#18181b] mb-1">Your 10 Ideas</h1>
          <p className="text-zinc-500 text-sm">
            Ranked by win score. Top idea scores <span className="font-bold text-[#f97316]">{topScore}/100</span>. The fit graph compares the strongest top-3 paths before you commit to a plan.
          </p>
        </div>

        {state.fitGraph ? (
          <div className="mb-6 rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 via-white to-amber-50 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-orange-600 mb-2">Killer demo moment</p>
                <h2 className="text-xl font-bold text-[#18181b]">See the Hackathon Fit Graph</h2>
                <p className="text-sm text-zinc-600 mt-1 max-w-2xl">
                  We assembled a visual proof graph connecting your signals, this hackathon, and the top 3 ideas.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGraphContinue}
                className="shrink-0 rounded-xl bg-[#f97316] px-5 py-3 text-sm font-bold text-white hover:bg-orange-500 transition-colors"
              >
                See Why These Ideas Fit →
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-dashed border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
            We couldn&apos;t assemble the fit graph for this run, but your 10 ideas are ready and you can still jump straight into a build plan.
          </div>
        )}

        <div className="grid gap-3">
          {ideas.map((idea, i) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              rank={i + 1}
              featured={i < 3}
              actionLabel="Build plan anyway"
              onSelect={handleSelect}
            />
          ))}
        </div>

        <button onClick={() => { setIdeas([]); update({ generatedIdeas: [], fitGraph: null, selectedIdeaId: null, finalPlan: null }); setLoading(true); }}
          className="mt-6 text-sm text-zinc-400 hover:text-[#f97316] transition-colors">
          Regenerate ideas
        </button>
      </div>
    </PageShell>
  );
}
