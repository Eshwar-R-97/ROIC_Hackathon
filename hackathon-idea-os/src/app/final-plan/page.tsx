"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { ProgressBar } from "@/components/ProgressBar";
import { ScoreBadge } from "@/components/ScoreBadge";
import { FinalPlan, Idea } from "@/lib/types";
import { generateMarkdown, downloadMarkdown } from "@/lib/markdown";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        <span className="text-gray-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="px-5 pb-5 border-t border-gray-100">{children}</div>}
    </div>
  );
}

export default function FinalPlanPage() {
  const router = useRouter();
  const { state, update } = useSession();
  const [plan, setPlan] = useState<FinalPlan | null>(state.finalPlan);
  const [loading, setLoading] = useState(!state.finalPlan);
  const [error, setError] = useState("");

  const selectedIdea = state.generatedIdeas.find((i) => i.id === state.selectedIdeaId) || null;

  useEffect(() => {
    if (plan) return;
    if (!selectedIdea || !state.userProfile || !state.selectedHackathon) {
      router.push("/ideas");
      return;
    }

    fetch("/api/plan/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedIdea,
        userProfile: state.userProfile,
        hackathon: state.selectedHackathon,
      }),
    })
      .then((r) => r.json())
      .then((p: FinalPlan) => {
        setPlan(p);
        update({ finalPlan: p });
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to generate plan. Please try again.");
        setLoading(false);
      });
  }, []);

  function handleDownload() {
    if (!plan || !selectedIdea) return;
    const md = generateMarkdown(plan, selectedIdea);
    downloadMarkdown(md, `${plan.projectName.replace(/\s+/g, "-").toLowerCase()}-plan.md`);
  }

  if (loading) {
    return (
      <main className="min-h-screen py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <ProgressBar currentStep={5} />
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Generating your complete build plan...</p>
            <p className="text-gray-400 text-xs mt-2">This may take 30-60 seconds</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !plan) {
    return (
      <main className="min-h-screen py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <ProgressBar currentStep={5} />
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            {error || "Plan not found."}
          </div>
          <button onClick={() => router.push("/ideas")} className="mt-4 text-sm text-gray-600 hover:underline">
            ← Go back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <ProgressBar currentStep={5} />

        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{plan.projectName}</h1>
            <p className="text-gray-500 text-sm">{plan.oneLiner}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {selectedIdea && <ScoreBadge score={selectedIdea.winScore} size="lg" />}
            <button
              onClick={handleDownload}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors flex items-center gap-1.5"
            >
              ↓ Download .md
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <Section title="Problem & Hackathon Fit">
            <div className="space-y-3 pt-4 text-sm text-gray-700">
              <p>{plan.problem}</p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Why this hackathon</p>
                <p>{plan.hackathonFit}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Track</p>
                  <p>{plan.trackAlignment}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">Sponsor</p>
                  <p>{plan.sponsorAlignment}</p>
                </div>
              </div>
            </div>
          </Section>

          <Section title="User Flow">
            <ol className="pt-4 space-y-2">
              {plan.userFlow.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Features">
            <div className="pt-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium text-green-700 mb-2">MVP (build this)</p>
                <ul className="space-y-1">
                  {plan.mvpFeatures.map((f, i) => <li key={i} className="text-xs text-gray-700">• {f}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-yellow-700 mb-2">Stretch (if time)</p>
                <ul className="space-y-1">
                  {plan.stretchFeatures.map((f, i) => <li key={i} className="text-xs text-gray-600">• {f}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium text-red-600 mb-2">Cut (if behind)</p>
                <ul className="space-y-1">
                  {plan.cutFeatures.map((f, i) => <li key={i} className="text-xs text-gray-500 line-through">• {f}</li>)}
                </ul>
              </div>
            </div>
          </Section>

          <Section title="Architecture & Stack">
            <div className="pt-4 space-y-3 text-sm text-gray-700">
              <p>{plan.architecture}</p>
              <div className="flex flex-wrap gap-1.5">
                {plan.techStack.map((t) => (
                  <span key={t} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded font-mono">{t}</span>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Hour-by-Hour Timeline">
            <div className="pt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                    <th className="pb-2 font-medium w-24">Hour</th>
                    <th className="pb-2 font-medium">Task</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.timeline.map((entry, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-2 text-xs text-gray-500 font-mono">{entry.hour}</td>
                      <td className="py-2 text-gray-700">{entry.task}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Task Breakdown">
            <div className="pt-4 space-y-4">
              {(["must", "should", "stretch"] as const).map((priority) => {
                const filtered = plan.tasks.filter((t) => t.priority === priority);
                if (!filtered.length) return null;
                const colors = { must: "text-green-700", should: "text-yellow-700", stretch: "text-blue-700" };
                const labels = { must: "Must Do", should: "Should Do", stretch: "Stretch" };
                return (
                  <div key={priority}>
                    <p className={`text-xs font-semibold mb-2 ${colors[priority]}`}>{labels[priority]}</p>
                    <ul className="space-y-1">
                      {filtered.map((t, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="mt-0.5">☐</span> {t.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="Demo Script">
            <div className="pt-4 bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-line">
              {plan.demoScript}
            </div>
          </Section>

          <Section title="Pitch Script">
            <div className="pt-4 bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-line">
              {plan.pitchScript}
            </div>
          </Section>

          <Section title="Judging Strategy & Risks">
            <div className="pt-4 space-y-3">
              <p className="text-sm text-gray-700">{plan.judgingStrategy}</p>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Risks</p>
                <ul className="space-y-1">
                  {plan.risks.map((r, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-yellow-500">⚠</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>

          <Section title="Submission Checklist">
            <ul className="pt-4 space-y-2">
              {plan.submissionChecklist.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span>☐</span> {item}
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button onClick={() => router.push("/ideas")} className="text-sm text-gray-400 hover:text-gray-600">
            ← Pick a different idea
          </button>
          <button
            onClick={handleDownload}
            className="bg-gray-900 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            ↓ Download Build Plan (.md)
          </button>
        </div>
      </div>
    </main>
  );
}
