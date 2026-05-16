import { Idea } from "@/lib/types";
import { ScoreBadge } from "./ScoreBadge";

interface IdeaCardProps {
  idea: Idea;
  rank: number;
  onSelect: (id: string) => void;
}

export function IdeaCard({ idea, rank, onSelect }: IdeaCardProps) {
  const borderColor =
    idea.winScore >= 80 ? "border-l-green-500" : idea.winScore >= 60 ? "border-l-yellow-500" : "border-l-red-400";

  return (
    <button
      onClick={() => onSelect(idea.id)}
      className={`w-full text-left bg-white border border-zinc-200 border-l-4 ${borderColor} rounded-lg p-5 hover:shadow-md hover:border-r-[#f97316] hover:border-t-[#f97316] hover:border-b-[#f97316] transition-all group`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-zinc-400 font-mono">#{rank}</span>
            <h3 className="font-bold text-[#18181b] text-sm leading-tight group-hover:text-[#f97316] transition-colors">
              {idea.title}
            </h3>
          </div>
          <p className="text-sm text-zinc-500 line-clamp-2">{idea.problem}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {idea.stack.slice(0, 3).map((s) => (
              <span key={s} className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded font-mono">{s}</span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <ScoreBadge score={idea.winScore} size="sm" />
          <span className="text-xs text-zinc-400">win score</span>
        </div>
      </div>
    </button>
  );
}
