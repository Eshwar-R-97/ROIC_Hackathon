"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { ProgressBar } from "@/components/ProgressBar";
import { PageShell } from "@/components/PageShell";
import { Hackathon } from "@/lib/types";
import { mergeHackathonDetails } from "@/lib/hackathons";

export default function HackathonPage() {
  const router = useRouter();
  const { state, update } = useSession();
  const hackathon = state.selectedHackathon;
  const [isEnriching, setIsEnriching] = useState(false);
  const attemptedSourceUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!hackathon) return;
    if (!hackathon.sourceUrl || hackathon.extractionStatus !== "fallback") return;
    if (attemptedSourceUrl.current === hackathon.sourceUrl) return;

    const controller = new AbortController();
    attemptedSourceUrl.current = hackathon.sourceUrl;
    setIsEnriching(true);

    fetch("/api/hackathons/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: hackathon.sourceUrl,
        fallbackHackathon: hackathon,
      }),
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Could not enrich hackathon details.");
        return response.json();
      })
      .then((nextHackathon: Hackathon) => {
        update({ selectedHackathon: mergeHackathonDetails(hackathon, nextHackathon) });
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
      })
      .finally(() => {
        setIsEnriching(false);
      });

    return () => controller.abort();
  }, [hackathon, update]);

  if (!hackathon) {
    router.push("/discover");
    return null;
  }

  function handleContinue() {
    update({ step: 3 });
    router.push("/questions");
  }

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto">
        <ProgressBar currentStep={2} />

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#18181b] mb-1">{hackathon.title}</h1>
            <div className="flex items-center gap-3 text-sm text-zinc-500">
              {hackathon.date && <span>{hackathon.date}</span>}
              {hackathon.date && hackathon.location && <span>·</span>}
              {hackathon.location && <span>{hackathon.location}</span>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {hackathon.summary && (
            <section className="bg-white border border-zinc-200 rounded-lg p-5">
              <h2 className="text-xs font-bold uppercase tracking-wide text-orange-600 mb-3">Overview</h2>
              <p className="text-sm text-zinc-600 leading-relaxed">{hackathon.summary}</p>
            </section>
          )}

          {hackathon.fitSummary && (
            <section className="bg-orange-50 border border-orange-100 rounded-lg p-5">
              <h2 className="text-xs font-bold uppercase tracking-wide text-orange-600 mb-3">Why It Fits You</h2>
              <p className="text-sm text-zinc-700 leading-relaxed">{hackathon.fitSummary}</p>
            </section>
          )}

          {hackathon.extractionStatus === "fallback" && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-800">
              {isEnriching
                ? "Using summary-level event data for now while we pull richer event details in the background."
                : "Using summary-level event data. You can still continue, and idea generation plus the fit graph will still work."}
            </div>
          )}

          {hackathon.tracks.length > 0 && (
            <section className="bg-white border border-zinc-200 rounded-lg p-5">
              <h2 className="text-xs font-bold uppercase tracking-wide text-orange-600 mb-3">Tracks</h2>
              <div className="space-y-2">
                {hackathon.tracks.map((track, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#f97316] mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-[#18181b]">{track.name}</p>
                      {track.description && <p className="text-xs text-zinc-500 mt-0.5">{track.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {hackathon.sponsors.length > 0 && (
            <section className="bg-white border border-zinc-200 rounded-lg p-5">
              <h2 className="text-xs font-bold uppercase tracking-wide text-orange-600 mb-3">Sponsors & APIs</h2>
              <div className="space-y-3">
                {hackathon.sponsors.map((sponsor, i) => (
                  <div key={i}>
                    <p className="text-sm font-semibold text-[#18181b]">{sponsor.name}</p>
                    {sponsor.apis.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {sponsor.apis.map((api) => (
                          <span key={api} className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded font-mono">{api}</span>
                        ))}
                      </div>
                    )}
                    {sponsor.prizes.length > 0 && <p className="text-xs text-zinc-400 mt-1">{sponsor.prizes.join(" · ")}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {hackathon.prizes.length > 0 && (
            <section className="bg-white border border-zinc-200 rounded-lg p-5">
              <h2 className="text-xs font-bold uppercase tracking-wide text-orange-600 mb-3">Prizes</h2>
              <ul className="space-y-1">
                {hackathon.prizes.map((prize, i) => (
                  <li key={i} className="text-sm text-[#18181b] flex items-center gap-2">
                    <span className="text-[#f97316]">🏆</span> {prize}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {hackathon.judgingCriteria.length > 0 && (
            <section className="bg-white border border-zinc-200 rounded-lg p-5">
              <h2 className="text-xs font-bold uppercase tracking-wide text-orange-600 mb-3">Judging Criteria</h2>
              <ul className="space-y-1">
                {hackathon.judgingCriteria.map((c, i) => (
                  <li key={i} className="text-sm text-[#18181b] flex items-start gap-2">
                    <span className="text-zinc-300 mt-0.5">•</span> {c}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {hackathon.tracks.length === 0 && hackathon.sponsors.length === 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-800">
              Limited details extracted. You can still continue — ideas will be based on general hackathon principles.
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={() => router.push("/discover")}
            className="px-4 py-2.5 text-sm text-zinc-600 border border-zinc-200 rounded-lg hover:border-zinc-400 transition-colors font-medium">
            ← Change hackathon
          </button>
          <button onClick={handleContinue}
            className="flex-1 bg-[#f97316] text-white py-2.5 rounded-lg font-bold text-sm hover:bg-orange-500 transition-colors">
            Looks right — Continue →
          </button>
        </div>
      </div>
    </PageShell>
  );
}
