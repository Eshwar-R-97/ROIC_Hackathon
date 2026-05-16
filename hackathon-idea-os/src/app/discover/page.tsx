"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProgressBar } from "@/components/ProgressBar";
import { useSession } from "@/lib/session";
import {
  GitHubSignals,
  Hackathon,
  HackathonSearchResult,
  UserProfile,
} from "@/lib/types";

type Tab = "search" | "url";
type LoadingState = "idle" | "auto-search" | "manual-search" | "extract";

function buildProfileQuery(userProfile: UserProfile, githubSignals: GitHubSignals) {
  const interests = userProfile.interests.slice(0, 3).join(", ");
  const frameworks = githubSignals.frameworks.slice(0, 2).join(", ");
  const themes = githubSignals.projectThemes.slice(0, 2).join(", ");

  const parts = [
    "upcoming hackathons",
    interests ? `for ${interests}` : "",
    frameworks ? `aligned with ${frameworks}` : "",
    themes ? `around ${themes}` : "",
  ].filter(Boolean);

  return parts.join(" ");
}

async function fetchHackathonSearchResults(
  query: string,
  userProfile: UserProfile,
  githubSignals: GitHubSignals,
  signal?: AbortSignal,
) {
  const res = await fetch("/api/hackathons/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, userProfile, githubSignals }),
    signal,
  });

  if (!res.ok) {
    throw new Error("Search failed. Try refining the query or paste a URL instead.");
  }

  return (await res.json()) as HackathonSearchResult[];
}

function buildHackathonFromSearchResult(result: HackathonSearchResult): Hackathon {
  return {
    title: result.title,
    date: result.date,
    location: result.location,
    tracks: [],
    sponsors: [],
    prizes: [],
    judgingCriteria: [],
    rules: [],
    theme: result.description,
    summary: result.description,
    fitSummary: result.fitSummary,
    sourceUrl: result.url,
  };
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

    if (!userProfile || !githubSignals) {
      router.push("/onboarding");
      return;
    }

    const autoQuery = buildProfileQuery(userProfile, githubSignals);
    const autoSearchKey = JSON.stringify({
      githubUsername: userProfile.githubUsername,
      interests: userProfile.interests,
      frameworks: githubSignals.frameworks,
      themes: githubSignals.projectThemes,
    });

    if (lastAutoSearchKey.current === autoSearchKey) return;
    lastAutoSearchKey.current = autoSearchKey;

    setQuery(autoQuery);
    setTab("search");
    setError("");
    setLoadingState("auto-search");

    const controller = new AbortController();
    fetchHackathonSearchResults(autoQuery, userProfile, githubSignals, controller.signal)
      .then((results) => {
        setSearchResults(results);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setSearchResults([]);
        setError(err instanceof Error ? err.message : "We couldn't find recommendations yet.");
      })
      .finally(() => {
        setLoadingState("idle");
      });

    return () => controller.abort();
  }, [hydrated, githubSignals, router, userProfile]);

  function selectHackathon(hackathon: Hackathon) {
    update({
      selectedHackathon: hackathon,
      lifeAnswers: {},
      adaptiveQuestions: [],
      generatedIdeas: [],
      selectedIdeaId: null,
      finalPlan: null,
      step: 2,
    });
    router.push("/hackathon");
  }

  async function extractHackathon(sourceUrl: string) {
    const res = await fetch("/api/hackathons/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lumaUrl: sourceUrl }),
    });

    if (!res.ok) {
      throw new Error("Could not fetch hackathon page.");
    }

    const hackathon = (await res.json()) as Hackathon;
    return { ...hackathon, sourceUrl };
  }

  async function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoadingState("extract");
    setError("");

    try {
      const hackathon = await extractHackathon(url.trim());
      selectHackathon(hackathon);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoadingState("idle");
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || !userProfile || !githubSignals) return;

    setLoadingState("manual-search");
    setError("");
    setSearchResults([]);

    try {
      const results = await fetchHackathonSearchResults(query.trim(), userProfile, githubSignals);
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed. Try pasting a URL instead.");
    } finally {
      setLoadingState("idle");
    }
  }

  async function selectSearchResult(result: HackathonSearchResult) {
    setError("");

    if (result.url) {
      setUrl(result.url);
      setLoadingState("extract");

      try {
        const hackathon = await extractHackathon(result.url);
        selectHackathon({
          ...hackathon,
          summary: result.description,
          fitSummary: result.fitSummary,
        });
      } catch (err) {
        console.warn("Falling back to summarized hackathon data after extraction failed.", err);
        selectHackathon(buildHackathonFromSearchResult(result));
      } finally {
        setLoadingState("idle");
      }
      return;
    }

    selectHackathon(buildHackathonFromSearchResult(result));
  }

  if (!hydrated || !userProfile || !githubSignals) {
    return (
      <main className="min-h-screen py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <ProgressBar currentStep={1} />
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Loading your profile...</p>
          </div>
        </div>
      </main>
    );
  }

  const signalChips = Array.from(new Set([
    ...githubSignals.languages.slice(0, 2),
    ...githubSignals.frameworks.slice(0, 2),
    ...userProfile.interests.slice(0, 2),
  ])).slice(0, 5);

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <ProgressBar currentStep={1} />

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Discover Hackathons</h1>
        <p className="text-gray-500 text-sm mb-8">
          We automatically searched for events that match your profile. Pick one to review, or override it with your own search.
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-sm">
          <p className="text-gray-500 text-xs font-medium mb-1.5">Profile signals we used</p>
          <div className="flex flex-wrap gap-1.5">
            {signalChips.map((chip) => (
              <span key={chip} className="bg-white border border-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded font-mono">
                {chip}
              </span>
            ))}
          </div>
          {query && (
            <p className="text-xs text-gray-500 mt-3">
              Search focus: <span className="text-gray-700">{query}</span>
            </p>
          )}
        </div>

        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          {(["search", "url"] as const).map((nextTab) => (
            <button
              key={nextTab}
              type="button"
              onClick={() => setTab(nextTab)}
              className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${
                tab === nextTab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {nextTab === "search" ? "Recommendations" : "Paste URL"}
            </button>
          ))}
        </div>

        {tab === "search" ? (
          <div className="space-y-4">
            <form onSubmit={handleSearch} className="space-y-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Refine the recommendation query"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              />
              {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg">{error}</p>}
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium text-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {loadingState === "auto-search"
                  ? "Finding matching hackathons..."
                  : loadingState === "manual-search"
                    ? "Refreshing recommendations..."
                    : "Refresh Recommendations"}
              </button>
            </form>

            {loadingState === "auto-search" && searchResults.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <p className="text-sm font-medium text-gray-900">Finding good hackathon matches for you...</p>
                <p className="text-xs text-gray-500 mt-1">
                  We&apos;re using your GitHub profile, interests, and project patterns to rank the best options.
                </p>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-3">
                {searchResults.map((result, i) => (
                  <button
                    key={`${result.title}-${i}`}
                    type="button"
                    onClick={() => selectSearchResult(result)}
                    disabled={loadingState === "extract"}
                    className="w-full text-left bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-400 hover:shadow-sm transition-all disabled:opacity-60"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{result.title}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                          {result.date && <span>{result.date}</span>}
                          {result.location && <span>{result.location}</span>}
                        </div>
                      </div>
                      <span className="text-xs font-medium text-gray-400 whitespace-nowrap">
                        Review →
                      </span>
                    </div>

                    {result.description && (
                      <p className="text-sm text-gray-600 mt-3 leading-relaxed">{result.description}</p>
                    )}

                    {result.fitSummary && (
                      <div className="mt-3 rounded-md bg-gray-50 border border-gray-100 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">Why it fits you</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{result.fitSummary}</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {!loading && !error && searchResults.length === 0 && (
              <div className="bg-white border border-dashed border-gray-300 rounded-lg p-5 text-sm text-gray-500">
                No matches yet. Refine the query above or paste a specific event URL.
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleUrlSubmit} className="space-y-4">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://lu.ma/hackathon-name"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
            />
            {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg">{error}</p>}
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium text-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {loadingState === "extract" ? "Extracting hackathon details..." : "Extract Hackathon →"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
