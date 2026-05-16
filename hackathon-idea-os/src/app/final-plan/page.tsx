"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { ProgressBar } from "@/components/ProgressBar";
import { PageShell } from "@/components/PageShell";
import { ScoreBadge } from "@/components/ScoreBadge";
import { FinalPlan, SessionState } from "@/lib/types";
import { generateMarkdown, downloadMarkdown } from "@/lib/markdown";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
      <button onClick={() => setOpen((o) => !o)}
        className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
        <h2 className="text-xs font-bold uppercase tracking-wide text-orange-600">{title}</h2>
        <span className="text-zinc-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="px-5 pb-5 border-t border-zinc-100">{children}</div>}
    </div>
  );
}

function LoadingScreen({ label, subLabel }: { label: string; subLabel?: string }) {
  return (
    <PageShell>
      <div className="max-w-3xl mx-auto">
        <ProgressBar currentStep={5} />
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-500 text-sm">{label}</p>
          {subLabel && <p className="text-zinc-400 text-xs mt-2">{subLabel}</p>}
        </div>
      </div>
    </PageShell>
  );
}

export default function FinalPlanPage() {
  const router = useRouter();
  const { state, update, hydrated } = useSession();
  if (!hydrated) return <LoadingScreen label="Loading your plan..." />;
  return <FinalPlanContent state={state} update={update} router={router} />;
}

type Update = (patch: Partial<SessionState>) => void;
type Router = ReturnType<typeof useRouter>;

function FinalPlanContent({ state, update, router }: { state: SessionState; update: Update; router: Router }) {
  const [plan, setPlan] = useState<FinalPlan | null>(state.finalPlan);
  const [loading, setLoading] = useState(!state.finalPlan);
  const [error, setError] = useState("");

  const selectedIdea = state.generatedIdeas.find((i) => i.id === state.selectedIdeaId) || null;

  useEffect(() => {
    if (plan) return;
    if (!selectedIdea || !state.userProfile || !state.selectedHackathon) { router.push("/ideas"); return; }
    const controller = new AbortController();
    fetch("/api/plan/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ selectedIdea, userProfile: state.userProfile, hackathon: state.selectedHackathon }), signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error("Failed to generate plan."); return r.json(); })
      .then((p: FinalPlan) => { setPlan(p); update({ finalPlan: p }); setLoading(false); })
      .catch((err) => { if (err instanceof DOMException && err.name === "AbortError") return; setError("Failed to generate plan. Please try again."); setLoading(false); });
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDownload() {
    if (!plan || !selectedIdea) return;
    const md = generateMarkdown(plan, selectedIdea);
    downloadMarkdown(md, `${plan.projectName.replace(/\s+/g, "-").toLowerCase()}-plan.md`);
  }

  if (loading) return <LoadingScreen label="Generating your complete build plan..." subLabel="This may take 30–60 seconds" />;

  if (error || !plan) {
    return (
      <PageShell>
        <div className="max-w-3xl mx-auto">
          <ProgressBar currentStep={5} />
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{error || "Plan not found."}</div>
          <button onClick={() => router.push("/ideas")} className="mt-4 text-sm text-zinc-600 hover:underline">← Go back</button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto">
        <ProgressBar currentStep={5} />

        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#18181b] mb-1">{plan.projectName}</h1>
            <p className="text-zinc-500 text-sm">{plan.oneLiner}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {selectedIdea && <ScoreBadge score={selectedIdea.winScore} size="lg" />}
            <button onClick={handleDownload}
              className="bg-[#f97316] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-500 transition-colors flex items-center gap-1.5">
              ↓ Download .md
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <Section title="Problem & Hackathon Fit">
            <div className="space-y-3 pt-4 text-sm text-zinc-700">
              <p>{plan.problem}</p>
              <div className="bg-orange-50 rounded-lg p-3">
                <p className="text-xs font-bold text-orange-600 mb-1">Why this hackathon</p>
                <p>{plan.hackathonFit}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-50 rounded-lg p-3">
                  <p className="text-xs font-bold text-zinc-500 mb-1">Track</p>
                  <p>{plan.trackAlignment}</p>
                </div>
                <div className="bg-zinc-50 rounded-lg p-3">
                  <p className="text-xs font-bold text-zinc-500 mb-1">Sponsor</p>
                  <p>{plan.sponsorAlignment}</p>
                </div>
              </div>
            </div>
          </Section>

          <Section title="User Flow">
            <ol className="pt-4 space-y-2">
              {plan.userFlow.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-zinc-700">
                  <span className="w-5 h-5 rounded-full bg-[#f97316] text-white text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </Section>

          <Section title="Features">
            <div className="pt-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-bold text-green-700 mb-2">MVP (build this)</p>
                <ul className="space-y-1">{plan.mvpFeatures.map((f, i) => <li key={i} className="text-xs text-zinc-700">• {f}</li>)}</ul>
              </div>
              <div>
                <p className="text-xs font-bold text-yellow-700 mb-2">Stretch (if time)</p>
                <ul className="space-y-1">{plan.stretchFeatures.map((f, i) => <li key={i} className="text-xs text-zinc-600">• {f}</li>)}</ul>
              </div>
              <div>
                <p className="text-xs font-bold text-red-600 mb-2">Cut (if behind)</p>
                <ul className="space-y-1">{plan.cutFeatures.map((f, i) => <li key={i} className="text-xs text-zinc-400 line-through">• {f}</li>)}</ul>
              </div>
            </div>
          </Section>

          <Section title="Architecture & Stack">
            <div className="pt-4 space-y-3 text-sm text-zinc-700">
              <p>{plan.architecture}</p>
              <div className="flex flex-wrap gap-1.5">
                {plan.techStack.map((t) => (
                  <span key={t} className="text-xs bg-zinc-100 text-zinc-700 px-2 py-1 rounded font-mono">{t}</span>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Hour-by-Hour Timeline">
            <div className="pt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-zinc-400 border-b border-zinc-100">
                    <th className="pb-2 font-semibold w-24">Hour</th>
                    <th className="pb-2 font-semibold">Task</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.timeline.map((entry, i) => (
                    <tr key={i} className="border-b border-zinc-50">
                      <td className="py-2 text-xs text-[#f97316] font-mono font-bold">{entry.hour}</td>
                      <td className="py-2 text-zinc-700">{entry.task}</td>
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
                    <p className={`text-xs font-bold uppercase tracking-wide mb-2 ${colors[priority]}`}>{labels[priority]}</p>
                    <ul className="space-y-1">
                      {filtered.map((t, i) => <li key={i} className="flex items-start gap-2 text-sm text-zinc-700"><span className="mt-0.5">☐</span> {t.label}</li>)}
                    </ul>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="Demo Script">
            <div className="pt-4 bg-zinc-50 rounded-lg p-4 text-sm text-zinc-700 whitespace-pre-line">{plan.demoScript}</div>
          </Section>

          <Section title="Pitch Script">
            <div className="pt-4 bg-zinc-50 rounded-lg p-4 text-sm text-zinc-700 whitespace-pre-line">{plan.pitchScript}</div>
          </Section>

          <Section title="Judging Strategy & Risks">
            <div className="pt-4 space-y-3">
              <p className="text-sm text-zinc-700">{plan.judgingStrategy}</p>
              <div>
                <p className="text-xs font-bold text-zinc-500 mb-2">Risks</p>
                <ul className="space-y-1">
                  {plan.risks.map((r, i) => (
                    <li key={i} className="text-sm text-zinc-600 flex items-start gap-2">
                      <span className="text-[#f97316]">⚠</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>

          <Section title="Submission Checklist">
            <ul className="pt-4 space-y-2">
              {plan.submissionChecklist.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-zinc-700"><span>☐</span> {item}</li>
              ))}
            </ul>
          </Section>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button onClick={() => router.push("/ideas")} className="text-sm text-zinc-400 hover:text-zinc-600">← Pick a different idea</button>
          <button onClick={handleDownload}
            className="bg-[#f97316] text-white px-6 py-3 rounded-lg text-sm font-bold hover:bg-orange-500 transition-colors flex items-center gap-2">
            ↓ Download Build Plan (.md)
          </button>
        </div>
      </div>
    </PageShell>
  );
}
