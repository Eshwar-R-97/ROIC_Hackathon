"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { ProgressBar } from "@/components/ProgressBar";
import { HackathonSearchResult } from "@/lib/types";

export default function DiscoverPage() {
  const router = useRouter();
  const { state, update } = useSession();
  const [tab, setTab] = useState<"url" | "search">("url");
  const [url, setUrl] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchResults, setSearchResults] = useState<HackathonSearchResult[]>([]);

  async function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/hackathons/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lumaUrl: url.trim() }),
      });
      if (!res.ok) throw new Error("Could not fetch hackathon page.");
      const hackathon = await res.json();
      update({ selectedHackathon: hackathon, step: 2 });
      router.push("/hackathon");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setSearchResults([]);

    try {
      const res = await fetch("/api/hackathons/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const results = await res.json();
      setSearchResults(results);
    } catch {
      setError("Search failed. Try pasting a URL instead.");
    } finally {
      setLoading(false);
    }
  }

  async function selectSearchResult(result: HackathonSearchResult) {
    if (result.url) {
      setTab("url");
      setUrl(result.url);
      setLoading(true);
      try {
        const res = await fetch("/api/hackathons/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lumaUrl: result.url }),
        });
        const hackathon = await res.json();
        update({ selectedHackathon: hackathon, step: 2 });
        router.push("/hackathon");
      } catch {
        setError("Could not extract hackathon details.");
      } finally {
        setLoading(false);
      }
    } else {
      // Use search result directly as minimal hackathon
      const hackathon = {
        title: result.title,
        date: result.date,
        location: result.location,
        tracks: [],
        sponsors: [],
        prizes: [],
        judgingCriteria: [],
        rules: [],
        theme: result.description,
      };
      update({ selectedHackathon: hackathon, step: 2 });
      router.push("/hackathon");
    }
  }

  return (
    <main className="min-h-screen py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <ProgressBar currentStep={1} />

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Find a Hackathon</h1>
        <p className="text-gray-500 text-sm mb-8">Paste a Lu.ma event URL, or search for upcoming hackathons.</p>

        {state.githubSignals && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-sm">
            <p className="text-gray-500 text-xs font-medium mb-1.5">GitHub signals detected</p>
            <div className="flex flex-wrap gap-1.5">
              {state.githubSignals.languages.slice(0, 4).map((l) => (
                <span key={l} className="bg-white border border-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded font-mono">{l}</span>
              ))}
              {state.githubSignals.frameworks.slice(0, 3).map((f) => (
                <span key={f} className="bg-white border border-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded font-mono">{f}</span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          {(["url", "search"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${
                tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "url" ? "Paste URL" : "Search"}
            </button>
          ))}
        </div>

        {tab === "url" ? (
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
              {loading ? "Extracting hackathon details..." : "Extract Hackathon →"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSearch} className="space-y-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. AI hackathon San Francisco 2025"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
            />
            {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg">{error}</p>}
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-medium text-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Searching..." : "Search Hackathons"}
            </button>

            {searchResults.length > 0 && (
              <div className="space-y-2 mt-4">
                {searchResults.map((result, i) => (
                  <button
                    key={i}
                    onClick={() => selectSearchResult(result)}
                    className="w-full text-left bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-400 hover:shadow-sm transition-all"
                  >
                    <p className="font-medium text-gray-900 text-sm">{result.title}</p>
                    {result.date && <p className="text-xs text-gray-500 mt-0.5">{result.date}</p>}
                    {result.location && <p className="text-xs text-gray-400">{result.location}</p>}
                    {result.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{result.description}</p>}
                  </button>
                ))}
              </div>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
