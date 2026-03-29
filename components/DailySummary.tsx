"use client";

import { formatCalories } from "@/lib/utils";

interface DailySummaryProps {
  calories: number;
  protein: number;
  loading: boolean;
}

export function DailySummary({ calories, protein, loading }: DailySummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      <div className="bg-surface rounded-2xl p-4 border border-border/60">
        <div className="text-[12px] font-medium text-text-muted uppercase tracking-wider mb-1.5">
          Calories
        </div>
        <div
          className={`text-[32px] font-bold tracking-tight leading-none transition-opacity ${
            loading ? "opacity-40" : "opacity-100"
          }`}
        >
          {formatCalories(calories)}
        </div>
        <div className="text-[13px] text-text-muted mt-1">kcal</div>
      </div>

      <div className="bg-surface rounded-2xl p-4 border border-border/60">
        <div className="text-[12px] font-medium text-text-muted uppercase tracking-wider mb-1.5">
          Protein
        </div>
        <div
          className={`text-[32px] font-bold tracking-tight leading-none transition-opacity ${
            loading ? "opacity-40" : "opacity-100"
          }`}
        >
          {Math.round(protein * 10) / 10}
        </div>
        <div className="text-[13px] text-text-muted mt-1">grams</div>
      </div>
    </div>
  );
}
