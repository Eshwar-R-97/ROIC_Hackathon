"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { ProgressBar } from "@/components/ProgressBar";
import { IdeaCard } from "@/components/IdeaCard";
import { Idea, SessionState } from "@/lib/types";

export default function IdeasPage() {
  const router = useRouter();
  const { state, update, hydrated } = useSession();

  if (!hydrated) {
    return <LoadingScreen label="Loading ideas..." />;
  }

  return <IdeasContent state={state} update={update} router={router} />;
}

function LoadingScreen({ label, subLabel }: { label: string; subLabel?: string }) {
  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <ProgressBar currentStep={4} />
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">{label}</p>
          {subLabel && <p className="text-gray-400 text-xs mt-2">{subLabel}</p>}
        </div>
      </div>
    </main>
  );
}

type Update = (patch: Partial<SessionState>) => void;
type Router = ReturnType<typeof useRouter>;

function IdeasContent({
  state,
  update,
  router,
}: {
  state: SessionState;
  update: Update;
  router: Router;
}) {
  const [ideas, setIdeas] = useState<Idea[]>(state.generatedIdeas || []);
  const [loading, setLoading] = useState(ideas.length === 0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (ideas.length > 0) return;
    if (!state.userProfile || !state.selectedHackathon) {
      router.push("/onboarding");
      return;
    }

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
      .then((generated: Idea[]) => {
        setIdeas(generated);
        update({ generatedIdeas: generated });
        setLoading(false);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("Failed to generate ideas. Please try again.");
        setLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ideas.length]);

  function handleSelect(id: string) {
    update({ selectedIdeaId: id, finalPlan: null, step: 5 });
    router.push("/final-plan");
  }

  if (loading) {
    return <LoadingScreen label="Generating 10 personalized ideas..." subLabel="This may take 20-30 seconds" />;
  }

  if (error) {
    return (
      <main className="min-h-screen py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <ProgressBar currentStep={4} />
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
          <button onClick={() => router.push("/questions")} className="mt-4 text-sm text-gray-600 hover:underline">
            ← Go back
          </button>
        </div>
      </main>
    );
  }

  const topScore = ideas[0]?.winScore || 0;

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <ProgressBar currentStep={4} />

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Your 10 Ideas</h1>
          <p className="text-gray-500 text-sm">
            Ranked by win score. Top idea scores {topScore}/100. Click one to generate your full build plan.
          </p>
        </div>

        <div className="grid gap-3">
          {ideas.map((idea, i) => (
            <IdeaCard key={idea.id} idea={idea} rank={i + 1} onSelect={handleSelect} />
          ))}
        </div>

        <button
          onClick={() => {
            setIdeas([]);
            update({ generatedIdeas: [], selectedIdeaId: null, finalPlan: null });
            setLoading(true);
          }}
          className="mt-6 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Regenerate ideas
        </button>
      </div>
    </main>
  );
}
