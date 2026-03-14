'use client'

interface SupportButtonsProps {
  onExplainSimpler: () => void;
  onShowStepByStep: () => void;
  onGiveSimilar: () => void;
  disabled: boolean;
  visible: boolean;
}

export default function SupportButtons({
  onExplainSimpler,
  onShowStepByStep,
  onGiveSimilar,
  disabled,
  visible
}: SupportButtonsProps) {
  if (!visible) return null;

  return (
    <div className="grid grid-cols-3 gap-2 p-3 bg-white border-t-2 border-gray-200 shadow-lg">
      <button
        onClick={onExplainSimpler}
        disabled={disabled}
        className="flex flex-col items-center gap-1 p-3 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-300 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
        title="Get a simpler explanation"
      >
        <span className="text-2xl">🎯</span>
        <span className="text-[10px] sm:text-xs font-black text-blue-700 text-center leading-tight">
          Explain Simpler
        </span>
      </button>

      <button
        onClick={onShowStepByStep}
        disabled={disabled}
        className="flex flex-col items-center gap-1 p-3 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-2 border-green-300 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
        title="See step-by-step solution"
      >
        <span className="text-2xl">📝</span>
        <span className="text-[10px] sm:text-xs font-black text-green-700 text-center leading-tight">
          Show Steps
        </span>
      </button>

      <button
        onClick={onGiveSimilar}
        disabled={disabled}
        className="flex flex-col items-center gap-1 p-3 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-2 border-purple-300 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
        title="Get a similar question"
      >
        <span className="text-2xl">🔄</span>
        <span className="text-[10px] sm:text-xs font-black text-purple-700 text-center leading-tight">
          Similar Question
        </span>
      </button>
    </div>
  );
}
