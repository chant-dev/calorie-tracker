"use client";

import { CSSProperties } from "react";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { Entry } from "@/lib/types";
import { formatCalories } from "@/lib/utils";

interface EntryItemProps {
  entry: Entry;
  onEdit: (entry: Entry) => void;
  onDelete: (id: string) => void;
  style?: CSSProperties;
}

export function EntryItem({ entry, onEdit, onDelete, style }: EntryItemProps) {
  const handleDelete = () => {
    onDelete(entry.id);
  };

  return (
    <div
      className="group bg-surface rounded-2xl border border-border/60 px-4 py-3.5 flex items-center gap-3 animate-slide-up hover:border-border transition-colors"
      style={style}
    >
      {/* Food info */}
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium text-text truncate">
          {entry.foodName || (
            <span className="text-text-muted italic font-normal">Unnamed</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {entry.quantity && entry.unit && (
            <span className="text-[13px] text-text-muted">
              {entry.quantity}{entry.unit}
            </span>
          )}
          {entry.quantity && entry.unit && (
            <span className="text-text-muted opacity-40">·</span>
          )}
          <span className="text-[13px] text-text-secondary">
            {formatCalories(entry.calories)} cal
          </span>
          <span className="text-text-muted opacity-40">·</span>
          <span className="text-[13px] text-text-secondary">
            {Math.round(entry.protein * 10) / 10}g protein
          </span>
        </div>
      </div>

      {/* Actions — always visible on mobile, hover-reveal on desktop */}
      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(entry)}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-surface-raised transition-colors"
          aria-label="Edit entry"
        >
          <PencilIcon className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDelete}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-text-muted hover:text-danger hover:bg-danger-light"
          aria-label="Delete entry"
        >
          <Trash2Icon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
