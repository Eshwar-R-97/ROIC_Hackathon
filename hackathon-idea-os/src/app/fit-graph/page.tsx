"use client";

import { useRouter } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { ProgressBar } from "@/components/ProgressBar";
import { FitGraphExplorer } from "@/components/fit-graph/FitGraphExplorer";
import { IdeaCard } from "@/components/IdeaCard";
import { useSession } from "@/lib/session";

function LoadingScreen() {
  return (
    <PageShell>
      <div className="max-w-6xl mx-auto">
        <ProgressBar currentStep={5} />
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 text-sm">Loading the fit graph...</p>
        </div>
      </div>
    </PageShell>
  );
}

export default function FitGraphPage() {
  const router = useRouter();
  const { state, update, hydrated } = useSession();

  if (!hydrated) return <LoadingScreen />;
  if (!state.generatedIdeas.length || !state.selectedHackathon) {
    router.push("/ideas");
    return null;
  }

  const ideas = state.generatedIdeas;
  const selectedIdeaId = state.selectedIdeaId ?? state.fitGraph?.topIdeaIds[0] ?? ideas[0]?.id ?? null;

  function selectIdea(ideaId: string) {
    update({ selectedIdeaId: ideaId, finalPlan: null, step: 5 });
  }

  function buildPlan(ideaId: string) {
    update({ selectedIdeaId: ideaId, finalPlan: null, step: 6 });
    router.push("/final-plan");
  }

  return (
    <PageShell className="pb-16">
      <div className="max-w-6xl mx-auto">
        <ProgressBar currentStep={5} />

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#18181b] mb-2">The Hackathon Fit Graph</h1>
          <p className="text-zinc-500 text-sm max-w-3xl">
            This is the visual proof layer: your strongest GitHub and profile signals on the left, the hackathon anchors in the middle, and the top 3 ideas on the right.
          </p>
        </div>

        {state.fitGraph ? (
          <FitGraphExplorer
            graph={state.fitGraph}
            ideas={ideas}
            initialIdeaId={selectedIdeaId}
            onSelectIdea={selectIdea}
            onBuildPlan={buildPlan}
          />
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50 p-5 text-sm text-orange-800">
              We couldn&apos;t assemble the visual fit graph for this run, but the top ideas are still ready and you can continue straight into plan generation.
            </div>

            <div className="grid gap-3">
              {ideas.map((idea, index) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  rank={index + 1}
                  featured={index < 3}
                  actionLabel="Generate plan"
                  onSelect={buildPlan}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <button
            type="button"
            onClick={() => router.push("/ideas")}
            className="text-sm font-medium text-zinc-500 hover:text-[#f97316] transition-colors"
          >
            ← Back to idea ranking
          </button>
        </div>
      </div>
    </PageShell>
  );
}
