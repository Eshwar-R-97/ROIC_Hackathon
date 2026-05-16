"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { ProgressBar } from "@/components/ProgressBar";

export default function HackathonPage() {
  const router = useRouter();
  const { state, update, hydrated } = useSession();
  const hackathon = state.selectedHackathon;

  useEffect(() => {
    if (hydrated && !hackathon) {
      router.push("/discover");
    }
  }, [hydrated, hackathon, router]);

  if (!hydrated || !hackathon) {
    return (
      <main className="min-h-screen py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <ProgressBar currentStep={2} />
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Loading hackathon...</p>
          </div>
        </div>
      </main>
    );
  }

  function handleContinue() {
    update({ step: 3 });
    router.push("/questions");
  }

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <ProgressBar currentStep={2} />

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{hackathon.title}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              {hackathon.date && <span>{hackathon.date}</span>}
              {hackathon.date && hackathon.location && <span>·</span>}
              {hackathon.location && <span>{hackathon.location}</span>}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {(hackathon.summary || hackathon.theme) && (
            <section className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Overview</h2>
              <p className="text-sm text-gray-700 leading-relaxed">{hackathon.summary || hackathon.theme}</p>
            </section>
          )}

          {hackathon.fitSummary && (
            <section className="bg-gray-50 border border-gray-200 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Why This Fits You</h2>
              <p className="text-sm text-gray-700 leading-relaxed">{hackathon.fitSummary}</p>
            </section>
          )}

          {hackathon.tracks.length > 0 && (
            <section className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Tracks</h2>
              <div className="space-y-2">
                {hackathon.tracks.map((track, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{track.name}</p>
                      {track.description && <p className="text-xs text-gray-500 mt-0.5">{track.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {hackathon.sponsors.length > 0 && (
            <section className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Sponsors & APIs</h2>
              <div className="space-y-3">
                {hackathon.sponsors.map((sponsor, i) => (
                  <div key={i}>
                    <p className="text-sm font-medium text-gray-800">{sponsor.name}</p>
                    {sponsor.apis.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {sponsor.apis.map((api) => (
                          <span key={api} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded font-mono">{api}</span>
                        ))}
                      </div>
                    )}
                    {sponsor.prizes.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">{sponsor.prizes.join(" · ")}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {hackathon.prizes.length > 0 && (
            <section className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Prizes</h2>
              <ul className="space-y-1">
                {hackathon.prizes.map((prize, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                    <span className="text-yellow-500">🏆</span> {prize}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {hackathon.judgingCriteria.length > 0 && (
            <section className="bg-white border border-gray-200 rounded-lg p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Judging Criteria</h2>
              <ul className="space-y-1">
                {hackathon.judgingCriteria.map((c, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-gray-400 mt-0.5">•</span> {c}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {hackathon.tracks.length === 0 && hackathon.sponsors.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              Limited hackathon details were extracted. You can still continue — ideas will be based on general hackathon principles.
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={() => router.push("/discover")}
            className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
          >
            ← Change hackathon
          </button>
          <button
            onClick={handleContinue}
            className="flex-1 bg-gray-900 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-gray-700 transition-colors"
          >
            Looks right — Continue →
          </button>
        </div>
      </div>
    </main>
  );
}
