"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { ProgressBar } from "@/components/ProgressBar";
import { PageShell } from "@/components/PageShell";
import { IdeaCard } from "@/components/IdeaCard";
import { Idea } from "@/lib/types";

export default function IdeasPage() {
  const router = useRouter();
  const { state, update } = useSession();
  const [ideas, setIdeas] = useState<Idea[]>(state.generatedIdeas || []);
  const [loading, setLoading] = useState(ideas.length === 0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ideas.length > 0) return;
    if (!state.userProfile || !state.selectedHackathon) { router.push("/onboarding"); return; }
    fetch("/api/ideas/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userProfile: state.userProfile, githubSignals: state.githubSignals, hackathon: state.selectedHackathon, answers: state.lifeAnswers }) })
      .then((r) => r.json())
      .then((generated: Idea[]) => { setIdeas(generated); update({ generatedIdeas: generated }); setLoading(false); })
      .catch(() => { setError("Failed to generate ideas. Please try again."); setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelect(id: string) { update({ selectedIdeaId: id, step: 5 }); router.push("/final-plan"); }

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
            Ranked by win score. Top idea scores <span className="font-bold text-[#f97316]">{topScore}/100</span>. Click one to generate your full build plan.
          </p>
        </div>

        <div className="grid gap-3">
          {ideas.map((idea, i) => <IdeaCard key={idea.id} idea={idea} rank={i + 1} onSelect={handleSelect} />)}
        </div>

        <button onClick={() => { setIdeas([]); update({ generatedIdeas: [] }); setLoading(true); }}
          className="mt-6 text-sm text-zinc-400 hover:text-[#f97316] transition-colors">
          Regenerate ideas
        </button>
      </div>
    </PageShell>
  );
}
