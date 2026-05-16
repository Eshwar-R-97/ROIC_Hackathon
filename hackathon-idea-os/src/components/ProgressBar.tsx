const STEPS = ["Profile", "Discover", "Hackathon", "Questions", "Ideas", "Plan"];

interface ProgressBarProps {
  currentStep: number;
}

export function ProgressBar({ currentStep }: ProgressBarProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="flex items-center justify-between mb-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < currentStep
                  ? "bg-[#f97316] text-white"
                  : i === currentStep
                  ? "bg-[#18181b] text-white ring-2 ring-orange-300"
                  : "bg-zinc-100 text-zinc-400"
              }`}
            >
              {i < currentStep ? "✓" : i + 1}
            </div>
            <span className={`text-xs font-medium ${i <= currentStep ? "text-[#18181b]" : "text-zinc-400"}`}>
              {label}
            </span>
          </div>
        ))}
      </div>
      <div className="h-1 bg-zinc-100 rounded-full mt-1">
        <div
          className="h-full bg-[#f97316] rounded-full transition-all"
          style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}
