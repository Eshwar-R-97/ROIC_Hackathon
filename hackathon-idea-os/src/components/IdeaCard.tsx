import { Idea } from "@/lib/types";
import { ScoreBadge } from "./ScoreBadge";

interface IdeaCardProps {
  idea: Idea;
  rank: number;
  featured?: boolean;
  actionLabel?: string;
  onSelect: (id: string) => void;
}

export function IdeaCard({
  idea,
  rank,
  featured = false,
  actionLabel = "Build plan anyway",
  onSelect,
}: IdeaCardProps) {
  const borderColor =
    idea.winScore >= 80 ? "border-l-green-500" : idea.winScore >= 60 ? "border-l-yellow-500" : "border-l-red-400";

  return (
    <article
      className={`bg-white border border-zinc-200 border-l-4 ${borderColor} rounded-lg p-5 transition-all ${
        featured ? "shadow-sm ring-1 ring-orange-200" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-zinc-400 font-mono">#{rank}</span>
            {featured && (
              <span className="text-[10px] font-bold uppercase tracking-wide bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full">
                Top 3
              </span>
            )}
          </div>
          <h3 className="font-bold text-[#18181b] text-sm leading-tight">{idea.title}</h3>
          <p className="text-sm text-zinc-500 line-clamp-2">{idea.problem}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {idea.stack.slice(0, 3).map((s) => (
              <span key={s} className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded font-mono">{s}</span>
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-3 line-clamp-2">
            {idea.trackFit || idea.sponsorFit || idea.personalConnection}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <ScoreBadge score={idea.winScore} size="sm" />
          <span className="text-xs text-zinc-400">win score</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-400">
          {featured ? "Included in the fit graph comparison." : "Available for direct plan generation."}
        </p>
        <button
          type="button"
          onClick={() => onSelect(idea.id)}
          className="shrink-0 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:border-[#f97316] hover:text-[#f97316] transition-colors"
        >
          {actionLabel}
        </button>
      </div>
    </article>
  );
}
