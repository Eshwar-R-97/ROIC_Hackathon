"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { ProgressBar } from "@/components/ProgressBar";
import { PageShell } from "@/components/PageShell";
import { AdaptiveQuestion, SessionState } from "@/lib/types";

export default function QuestionsPage() {
  const router = useRouter();
  const { state, update, hydrated } = useSession();

  if (!hydrated) return <LoadingScreen label="Loading questions..." />;
  return <QuestionsContent state={state} update={update} router={router} />;
}

function LoadingScreen({ label }: { label: string }) {
  return (
    <PageShell>
      <div className="max-w-2xl mx-auto">
        <ProgressBar currentStep={3} />
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 text-sm">{label}</p>
        </div>
      </div>
    </PageShell>
  );
}

type Update = (patch: Partial<SessionState>) => void;
type Router = ReturnType<typeof useRouter>;

function QuestionsContent({ state, update, router }: { state: SessionState; update: Update; router: Router }) {
  const [questions, setQuestions] = useState<AdaptiveQuestion[]>(state.adaptiveQuestions || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(state.lifeAnswers || {});
  const [currentAnswer, setCurrentAnswer] = useState(
    state.adaptiveQuestions[0] ? state.lifeAnswers[state.adaptiveQuestions[0].id] || "" : ""
  );
  const [loading, setLoading] = useState(questions.length === 0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (questions.length > 0) return;
    if (!state.userProfile || !state.selectedHackathon) { router.push("/onboarding"); return; }
    const controller = new AbortController();
    fetch("/api/questions/life", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userProfile: state.userProfile, hackathon: state.selectedHackathon }), signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error("Failed to generate questions."); return r.json(); })
      .then((qs: AdaptiveQuestion[]) => { setQuestions(qs); update({ adaptiveQuestions: qs }); setLoading(false); })
      .catch((err) => { if (err instanceof DOMException && err.name === "AbortError") return; setError("Failed to generate questions. Please try again."); setLoading(false); });
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleNext() {
    const question = questions[currentIndex];
    const updatedAnswers = { ...answers, [question.id]: currentAnswer };
    setAnswers(updatedAnswers);
    if (currentIndex < questions.length - 1) {
      update({ lifeAnswers: updatedAnswers });
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setCurrentAnswer(updatedAnswers[questions[nextIndex]?.id] || "");
    } else {
      update({
        lifeAnswers: updatedAnswers,
        generatedIdeas: [],
        fitGraph: null,
        selectedIdeaId: null,
        finalPlan: null,
        step: 4,
      });
      router.push("/ideas");
    }
  }

  function handleBack() {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setCurrentAnswer(answers[questions[prevIndex]?.id] || "");
    }
  }

  if (loading) return <LoadingScreen label="Generating personalized questions..." />;

  if (error) {
    return (
      <PageShell>
        <div className="max-w-2xl mx-auto">
          <ProgressBar currentStep={3} />
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error}</div>
          <button onClick={() => router.push("/hackathon")} className="mt-4 text-sm text-zinc-600 hover:underline">← Go back</button>
        </div>
      </PageShell>
    );
  }

  const question = questions[currentIndex];
  if (!question) return null;
  const progress = (currentIndex / questions.length) * 100;

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto">
        <ProgressBar currentStep={3} />

        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-1.5 bg-zinc-100 rounded-full">
            <div className="h-full bg-[#f97316] rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-8 mb-6">
          <h2 className="text-xl font-bold text-[#18181b] mb-6">{question.text}</h2>
          {question.type === "choice" && question.options ? (
            <div className="space-y-2">
              {question.options.map((option) => (
                <button key={option} onClick={() => setCurrentAnswer(option)}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    currentAnswer === option
                      ? "bg-[#f97316] text-white border-[#f97316]"
                      : "bg-white text-zinc-700 border-zinc-200 hover:border-[#f97316] hover:text-[#f97316]"
                  }`}>
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <textarea value={currentAnswer} onChange={(e) => setCurrentAnswer(e.target.value)} placeholder="Your answer..." rows={4}
              className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316] resize-none" />
          )}
        </div>

        <div className="flex gap-3">
          {currentIndex > 0 && (
            <button onClick={handleBack} className="px-4 py-2.5 text-sm text-zinc-600 border border-zinc-200 rounded-lg hover:border-zinc-400 font-medium">
              ← Back
            </button>
          )}
          <button onClick={handleNext} disabled={!currentAnswer.trim()}
            className="flex-1 bg-[#f97316] text-white py-2.5 rounded-lg font-bold text-sm hover:bg-orange-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {currentIndex < questions.length - 1 ? "Next →" : "Generate Ideas →"}
          </button>
        </div>
      </div>
    </PageShell>
  );
}
