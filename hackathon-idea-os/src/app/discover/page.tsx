"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressBar } from "@/components/ProgressBar";
import { PageShell } from "@/components/PageShell";
import { useSession } from "@/lib/session";
import { Hackathon, HackathonSearchResult, GitHubSignals, UserProfile } from "@/lib/types";

type Tab = "search" | "url";
type LoadingState = "idle" | "auto-search" | "manual-search" | "extract";

function buildProfileQuery(userProfile: UserProfile, githubSignals: GitHubSignals) {
  const interests = userProfile.interests.slice(0, 3).join(", ");
  const frameworks = githubSignals.frameworks.slice(0, 2).join(", ");
  const themes = githubSignals.projectThemes.slice(0, 2).join(", ");
  return ["upcoming hackathons", interests ? `for ${interests}` : "", frameworks ? `aligned with ${frameworks}` : "", themes ? `around ${themes}` : ""].filter(Boolean).join(" ");
}

async function fetchHackathonSearchResults(query: string, userProfile: UserProfile, githubSignals: GitHubSignals, signal?: AbortSignal) {
  const res = await fetch("/api/hackathons/search", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, userProfile, githubSignals }), signal,
  });
  if (!res.ok) throw new Error("Search failed. Try refining the query or paste a URL instead.");
  return (await res.json()) as HackathonSearchResult[];
}

function buildHackathonFromSearchResult(result: HackathonSearchResult): Hackathon {
  return { title: result.title, date: result.date, location: result.location, tracks: [], sponsors: [], prizes: [], judgingCriteria: [], rules: [], theme: result.description, summary: result.description, fitSummary: result.fitSummary, sourceUrl: result.url };
}

export default function DiscoverPage() {
  const router = useRouter();
  const { state, update, hydrated } = useSession();
  const [tab, setTab] = useState<Tab>("search");
  const [url, setUrl] = useState("");
  const [query, setQuery] = useState("");
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [error, setError] = useState("");
  const [searchResults, setSearchResults] = useState<HackathonSearchResult[]>([]);
  const lastAutoSearchKey = useRef<string | null>(null);

  const loading = loadingState !== "idle";
  const userProfile = state.userProfile;
  const githubSignals = state.githubSignals;

  useEffect(() => {
    if (!hydrated) return;
    if (!userProfile || !githubSignals) { router.push("/onboarding"); return; }
    const autoQuery = buildProfileQuery(userProfile, githubSignals);
    const autoSearchKey = JSON.stringify({ githubUsername: userProfile.githubUsername, interests: userProfile.interests, frameworks: githubSignals.frameworks, themes: githubSignals.projectThemes });
    if (lastAutoSearchKey.current === autoSearchKey) return;
    lastAutoSearchKey.current = autoSearchKey;
    setQuery(autoQuery); setTab("search"); setError(""); setLoadingState("auto-search");
    const controller = new AbortController();
    fetchHackathonSearchResults(autoQuery, userProfile, githubSignals, controller.signal)
      .then(setSearchResults)
      .catch((err) => { if (err instanceof DOMException && err.name === "AbortError") return; setSearchResults([]); setError(err instanceof Error ? err.message : "Couldn't find recommendations."); })
      .finally(() => setLoadingState("idle"));
    return () => controller.abort();
  }, [hydrated, githubSignals, router, userProfile]);

  function selectHackathon(hackathon: Hackathon) {
    update({ selectedHackathon: hackathon, lifeAnswers: {}, adaptiveQuestions: [], generatedIdeas: [], selectedIdeaId: null, finalPlan: null, step: 2 });
    router.push("/hackathon");
  }

  async function extractHackathon(sourceUrl: string) {
    const res = await fetch("/api/hackathons/extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lumaUrl: sourceUrl }) });
    if (!res.ok) throw new Error("Could not fetch hackathon page.");
    const hackathon = (await res.json()) as Hackathon;
    return { ...hackathon, sourceUrl };
  }

  async function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!url.trim()) return;
    setLoadingState("extract"); setError("");
    try { selectHackathon(await extractHackathon(url.trim())); }
    catch (err) { setError(err instanceof Error ? err.message : "Something went wrong."); }
    finally { setLoadingState("idle"); }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault(); if (!query.trim() || !userProfile || !githubSignals) return;
    setLoadingState("manual-search"); setError(""); setSearchResults([]);
    try { setSearchResults(await fetchHackathonSearchResults(query.trim(), userProfile, githubSignals)); }
    catch (err) { setError(err instanceof Error ? err.message : "Search failed."); }
    finally { setLoadingState("idle"); }
  }

  async function selectSearchResult(result: HackathonSearchResult) {
    setError("");
    if (result.url) {
      setUrl(result.url); setLoadingState("extract");
      try { selectHackathon({ ...(await extractHackathon(result.url)), summary: result.description, fitSummary: result.fitSummary }); }
      catch { selectHackathon(buildHackathonFromSearchResult(result)); }
      finally { setLoadingState("idle"); }
      return;
    }
    selectHackathon(buildHackathonFromSearchResult(result));
  }

  if (!hydrated || !userProfile || !githubSignals) {
    return (
      <PageShell>
        <div className="max-w-3xl mx-auto">
          <ProgressBar currentStep={1} />
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-zinc-500 text-sm">Loading your profile...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  const signalChips = Array.from(new Set([...githubSignals.languages.slice(0, 2), ...githubSignals.frameworks.slice(0, 2), ...userProfile.interests.slice(0, 2)])).slice(0, 5);

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto">
        <ProgressBar currentStep={1} />
        <h1 className="text-2xl font-bold text-[#18181b] mb-1">Discover Hackathons</h1>
        <p className="text-zinc-500 text-sm mb-8">We found events that match your profile. Pick one, or search with a custom query.</p>

        <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 mb-6">
          <p className="text-orange-700 text-xs font-semibold mb-1.5 uppercase tracking-wide">Profile signals used</p>
          <div className="flex flex-wrap gap-1.5">
            {signalChips.map((chip) => (
              <span key={chip} className="bg-white border border-orange-200 text-[#18181b] text-xs px-2 py-0.5 rounded font-mono">{chip}</span>
            ))}
          </div>
          {query && <p className="text-xs text-zinc-500 mt-2">Query: <span className="text-[#18181b]">{query}</span></p>}
        </div>

        <div className="flex gap-1 mb-6 bg-zinc-100 p-1 rounded-lg w-fit">
          {(["search", "url"] as const).map((nextTab) => (
            <button key={nextTab} type="button" onClick={() => setTab(nextTab)}
              className={`px-4 py-1.5 text-sm rounded-md font-semibold transition-colors ${tab === nextTab ? "bg-white text-[#18181b] shadow-sm" : "text-zinc-500 hover:text-[#18181b]"}`}>
              {nextTab === "search" ? "Recommendations" : "Paste URL"}
            </button>
          ))}
        </div>

        {tab === "search" ? (
          <div className="space-y-4">
            <form onSubmit={handleSearch} className="space-y-3">
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Refine the recommendation query"
                className="w-full border border-zinc-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316] bg-white" />
              {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg">{error}</p>}
              <button type="submit" disabled={loading || !query.trim()}
                className="w-full bg-[#18181b] text-white py-3 rounded-lg font-bold text-sm hover:bg-zinc-700 transition-colors disabled:opacity-50">
                {loadingState === "auto-search" ? "Finding matches..." : loadingState === "manual-search" ? "Refreshing..." : "Refresh Recommendations"}
              </button>
            </form>

            {loadingState === "auto-search" && searchResults.length === 0 && (
              <div className="bg-white border border-zinc-200 rounded-lg p-5 flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin shrink-0" />
                <p className="text-sm text-zinc-600">Finding hackathon matches for your profile...</p>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-3">
                {searchResults.map((result, i) => (
                  <button key={`${result.title}-${i}`} type="button" onClick={() => selectSearchResult(result)} disabled={loadingState === "extract"}
                    className="w-full text-left bg-white border border-zinc-200 rounded-lg p-5 hover:border-[#f97316] hover:shadow-sm transition-all disabled:opacity-60 group">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-[#18181b] text-sm group-hover:text-[#f97316] transition-colors">{result.title}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mt-1">
                          {result.date && <span>{result.date}</span>}
                          {result.location && <span>· {result.location}</span>}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#f97316] whitespace-nowrap">Select →</span>
                    </div>
                    {result.description && <p className="text-sm text-zinc-600 mt-3 leading-relaxed">{result.description}</p>}
                    {result.fitSummary && (
                      <div className="mt-3 rounded-md bg-orange-50 border border-orange-100 px-3 py-2">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-orange-600 mb-1">Why it fits you</p>
                        <p className="text-sm text-zinc-700 leading-relaxed">{result.fitSummary}</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {!loading && !error && searchResults.length === 0 && (
              <div className="bg-white border border-dashed border-zinc-300 rounded-lg p-5 text-sm text-zinc-500">
                No matches yet. Refine the query above or paste a specific event URL.
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleUrlSubmit} className="space-y-4">
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://lu.ma/hackathon-name"
              className="w-full border border-zinc-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f97316] bg-white" />
            {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg">{error}</p>}
            <button type="submit" disabled={loading || !url.trim()}
              className="w-full bg-[#f97316] text-white py-3 rounded-lg font-bold text-sm hover:bg-orange-500 transition-colors disabled:opacity-50">
              {loadingState === "extract" ? "Extracting hackathon details..." : "Extract Hackathon →"}
            </button>
          </form>
        )}
      </div>
    </PageShell>
  );
}
