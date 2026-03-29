"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { addDays, formatDate, todayString } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface DayNavProps {
  date: string;
  onDateChange: (date: string) => void;
}

export function DayNav({ date, onDateChange }: DayNavProps) {
  const isToday = date === todayString();

  return (
    <div className="flex items-center justify-between mb-5">
      <button
        onClick={() => onDateChange(addDays(date, -1))}
        className="w-9 h-9 flex items-center justify-center rounded-xl text-text-secondary hover:text-text hover:bg-surface transition-colors"
        aria-label="Previous day"
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>

      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[17px] font-semibold text-text tracking-tight">
          {formatDate(date)}
        </span>
      </div>

      <button
        onClick={() => onDateChange(addDays(date, 1))}
        className={cn(
          "w-9 h-9 flex items-center justify-center rounded-xl transition-colors",
          isToday
            ? "text-text-muted cursor-default"
            : "text-text-secondary hover:text-text hover:bg-surface"
        )}
        disabled={isToday}
        aria-label="Next day"
      >
        <ChevronRightIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
