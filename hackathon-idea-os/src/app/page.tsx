import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <header className="w-full border-b border-zinc-100 px-8 py-4 flex items-center justify-between">
        <Image src="/hackmatch_wordmark.svg" alt="HackMatch" width={155} height={40} priority />
        <Link
          href="/onboarding"
          className="text-sm font-semibold text-white bg-[#f97316] hover:bg-orange-500 px-5 py-2 rounded-lg transition-colors"
        >
          Get Started
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-24">
        <div className="mb-8">
          <Image src="/hackmatch_logo.svg" alt="HackMatch logo" width={100} height={100} priority />
        </div>

        <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase">
          GitHub + Hackathon → Winning Plan
        </div>

        <h1 className="text-6xl font-black tracking-tight text-[#18181b] mb-5 leading-[1.05] max-w-2xl">
          Find your perfect
          <br />
          <span className="text-[#f97316]">hackathon match.</span>
        </h1>

        <p className="text-lg text-zinc-500 mb-10 leading-relaxed max-w-lg">
          Paste your GitHub and a hackathon link. HackMatch generates 10 personalized project ideas
          and a complete hour-by-hour build plan — ready to win.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 bg-[#18181b] text-white px-8 py-4 rounded-xl font-bold text-sm hover:bg-zinc-700 transition-colors shadow-lg"
          >
            Start Building
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <p className="text-xs text-zinc-400">No account. No sign-up. Just ideas.</p>
        </div>
      </main>

      {/* Features strip */}
      <div className="border-t border-zinc-100 bg-zinc-50 py-6">
        <div className="max-w-3xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 text-xs font-medium text-zinc-500">
          {[
            ["⚡", "GitHub Analysis"],
            ["🎯", "10 Ranked Ideas"],
            ["🗺️", "Full Build Plan"],
            ["📄", "Download .md"],
          ].map(([icon, label]) => (
            <div key={label} className="flex items-center gap-2">
              <span>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-100 py-4 px-8 flex items-center justify-between">
        <Image src="/hackmatch_wordmark.svg" alt="HackMatch" width={100} height={26} />
        <p className="text-xs text-zinc-400">Built for hackers, by hackers.</p>
      </footer>
    </div>
  );
}
