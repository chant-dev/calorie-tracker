"use client";

import { useState, useEffect, useRef } from "react";
import useSWR, { mutate } from "swr";
import { XIcon, SearchIcon, PlusIcon, Trash2Icon, LoaderIcon } from "lucide-react";
import { SavedFood } from "@/lib/types";
import { formatCalories } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { UndoToast } from "./UndoToast";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SavedFoodsSheetProps {
  onClose: () => void;
  onAddToDay: (food: SavedFood) => Promise<void>;
}

export function SavedFoodsSheet({ onClose, onAddToDay }: SavedFoodsSheetProps) {
  const [search, setSearch] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [undoFood, setUndoFood] = useState<SavedFood | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useSWR<{ savedFoods: SavedFood[] }>(
    `/api/saved-foods?search=${encodeURIComponent(search)}`,
    fetcher
  );

  const savedFoods = data?.savedFoods ?? [];

  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 100);
  }, []);

  const handleAdd = async (food: SavedFood) => {
    setAddingId(food.id);
    await onAddToDay(food);
    setAddingId(null);
    onClose();
  };

  const handleDelete = async (id: string) => {
    const food = savedFoods.find((f) => f.id === id);
    setDeletingId(id);
    await fetch(`/api/saved-foods/${id}`, { method: "DELETE" });
    mutate(`/api/saved-foods?search=${encodeURIComponent(search)}`);
    setDeletingId(null);
    if (food) setUndoFood(food);
  };

  const handleUndoDelete = async () => {
    if (!undoFood) return;
    const { id: _id, createdAt: _c, updatedAt: _u, ...body } = undoFood;
    await fetch("/api/saved-foods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    mutate(`/api/saved-foods?search=${encodeURIComponent(search)}`);
    setUndoFood(null);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full sm:max-w-[480px] bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/10 flex flex-col sheet-enter sm:animate-slide-up max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 bg-border rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 sm:pt-5 flex-shrink-0">
            <h2 className="text-[18px] font-semibold text-text">Saved Foods</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-text-muted hover:text-text hover:bg-surface-raised transition-colors"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="px-5 pb-3 flex-shrink-0">
            <div className="relative">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              <input
                ref={searchRef}
                type="search"
                placeholder="Search saved foods…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface-raised rounded-xl pl-10 pr-4 py-3 text-[15px] text-text placeholder:text-text-muted border border-transparent focus:border-accent/50 focus:bg-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-5 pb-5 min-h-0">
            {isLoading ? (
              <div className="space-y-2 pt-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-surface-raised rounded-2xl animate-pulse"
                    style={{ opacity: 1 - i * 0.2 }}
                  />
                ))}
              </div>
            ) : savedFoods.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-3xl mb-3 opacity-40">🔖</div>
                <p className="text-[15px] text-text-muted font-medium">
                  {search ? "No results" : "No saved foods yet"}
                </p>
                {!search && (
                  <p className="text-[13px] text-text-muted mt-1 opacity-70">
                    When adding a food, check Save for later
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                {savedFoods.map((food) => (
                  <div
                    key={food.id}
                    className="group bg-surface-raised hover:bg-border/20 rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-medium text-text truncate">{food.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[13px] text-text-secondary">
                          {formatCalories(food.calories)} cal
                        </span>
                        <span className="text-text-muted opacity-40">·</span>
                        <span className="text-[13px] text-text-secondary">
                          {Math.round(food.protein * 10) / 10}g protein
                        </span>
                        {food.quantity && food.unit && (
                          <>
                            <span className="text-text-muted opacity-40">·</span>
                            <span className="text-[13px] text-text-muted">
                              {food.quantity}{food.unit}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(food.id)}
                        disabled={deletingId === food.id}
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors sm:opacity-0 sm:group-hover:opacity-100 text-text-muted hover:text-danger hover:bg-danger-light"
                        aria-label="Delete"
                      >
                        {deletingId === food.id ? (
                          <LoaderIcon className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2Icon className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => handleAdd(food)}
                        disabled={addingId === food.id}
                        className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white text-[13px] font-medium px-3 py-1.5 rounded-xl transition-all active:scale-95"
                        aria-label="Add to day"
                      >
                        {addingId === food.id ? (
                          <LoaderIcon className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <PlusIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
                            Add
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {undoFood && (
        <UndoToast
          message="Saved food deleted"
          onUndo={handleUndoDelete}
          onDismiss={() => setUndoFood(null)}
        />
      )}
    </>
  );
}
