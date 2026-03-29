"use client";

import { Entry } from "@/lib/types";
import { EntryItem } from "./EntryItem";

interface EntryListProps {
  entries: Entry[];
  loading: boolean;
  onEdit: (entry: Entry) => void;
  onDelete: (id: string) => void;
}

export function EntryList({ entries, loading, onEdit, onDelete }: EntryListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 bg-surface rounded-2xl border border-border/60 animate-pulse"
            style={{ opacity: 1 - i * 0.2 }}
          />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-4 opacity-40">🍽</div>
        <p className="text-[15px] text-text-muted font-medium">No entries yet</p>
        <p className="text-[13px] text-text-muted mt-1 opacity-70">
          Tap Add Food to log your first meal
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry, index) => (
        <EntryItem
          key={entry.id}
          entry={entry}
          onEdit={onEdit}
          onDelete={onDelete}
          style={{ animationDelay: `${index * 30}ms` }}
        />
      ))}
    </div>
  );
}
