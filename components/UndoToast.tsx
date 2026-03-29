"use client";

import { useEffect } from "react";

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

export function UndoToast({ message, onUndo, onDismiss, duration = 4000 }: UndoToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        onUndo();
      }
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKey);
    };
  }, [onUndo, onDismiss, duration]);

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="flex items-center gap-3 bg-[#1C1917] text-white text-[13px] px-4 py-2.5 rounded-2xl shadow-xl whitespace-nowrap">
        <span className="text-white/80">{message}</span>
        <span className="text-white/30">·</span>
        <button
          onClick={onUndo}
          className="font-medium text-white hover:text-white/80 transition-colors"
        >
          Undo
        </button>
        <span className="text-white/30 text-[11px]">Ctrl+Z</span>
      </div>
    </div>
  );
}
