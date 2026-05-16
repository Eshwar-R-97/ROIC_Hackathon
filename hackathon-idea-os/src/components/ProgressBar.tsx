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
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                i < currentStep
                  ? "bg-gray-900 text-white"
                  : i === currentStep
                  ? "bg-gray-900 text-white ring-2 ring-gray-300"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {i < currentStep ? "✓" : i + 1}
            </div>
            <span className={`text-xs ${i <= currentStep ? "text-gray-700" : "text-gray-400"}`}>
              {label}
            </span>
          </div>
        ))}
      </div>
      <div className="h-0.5 bg-gray-100 rounded-full mt-1">
        <div
          className="h-full bg-gray-900 rounded-full transition-all"
          style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}
