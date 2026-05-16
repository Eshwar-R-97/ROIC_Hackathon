import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <div className="max-w-xl">
        <div className="inline-block bg-gray-100 text-gray-600 text-xs font-mono px-3 py-1 rounded-full mb-6">
          GitHub + Hackathon → Winning Plan
        </div>

        <h1 className="text-5xl font-bold tracking-tight text-gray-900 mb-4 leading-tight">
          Hackathon<br />Idea OS
        </h1>

        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          Paste your GitHub username and a hackathon link. Get 10 personalized
          project ideas and a complete hour-by-hour build plan — ready to win.
        </p>

        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg font-medium text-sm hover:bg-gray-700 transition-colors"
        >
          Start Building
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-70">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>

        <p className="text-xs text-gray-400 mt-4">
          No account required. Session stored locally. Takes under 2 minutes.
        </p>
      </div>

      <div className="absolute bottom-8 flex items-center gap-6 text-xs text-gray-400">
        <span>GitHub Analysis</span>
        <span>·</span>
        <span>10 Ranked Ideas</span>
        <span>·</span>
        <span>Full Build Plan</span>
        <span>·</span>
        <span>Download .md</span>
      </div>
    </main>
  );
}
