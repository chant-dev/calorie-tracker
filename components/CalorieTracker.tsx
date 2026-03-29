"use client";

import { useState, useCallback, useRef } from "react";
import useSWR, { mutate } from "swr";
import { BookmarkIcon, PlusIcon, LogOutIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import { todayString } from "@/lib/utils";
import { Entry, SavedFood } from "@/lib/types";
import { DayNav } from "./DayNav";
import { DailySummary } from "./DailySummary";
import { EntryList } from "./EntryList";
import { AddEntryModal } from "./AddEntryModal";
import { SavedFoodsSheet } from "./SavedFoodsSheet";
import { UndoToast } from "./UndoToast";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function CalorieTracker() {
  const [date, setDate] = useState(todayString);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [showSavedFoods, setShowSavedFoods] = useState(false);
  const [undoEntry, setUndoEntry] = useState<Entry | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: entriesData, isLoading: loadingEntries } = useSWR<{ entries: Entry[] }>(
    `/api/entries?date=${date}`,
    fetcher
  );

  const entries = entriesData?.entries ?? [];
  const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0);
  const totalProtein = entries.reduce((sum, e) => sum + e.protein, 0);

  const refreshEntries = useCallback(() => {
    mutate(`/api/entries?date=${date}`);
  }, [date]);

  const handleDeleteEntry = async (id: string) => {
    const entry = entries.find((e) => e.id === id);
    await fetch(`/api/entries/${id}`, { method: "DELETE" });
    refreshEntries();
    if (entry) {
      setUndoEntry(entry);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    }
  };

  const handleUndoDelete = async () => {
    if (!undoEntry) return;
    const { id: _id, createdAt: _c, updatedAt: _u, ...body } = undoEntry;
    await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    refreshEntries();
    setUndoEntry(null);
  };

  const handleEditEntry = (entry: Entry) => {
    setEditingEntry(entry);
    setShowAddModal(true);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setEditingEntry(null);
  };

  const handleEntryAdded = () => {
    refreshEntries();
    handleModalClose();
  };

  const handleAddSavedFood = async (food: SavedFood) => {
    await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        foodName: food.name,
        calories: food.calories,
        protein: food.protein,
        sourceType: "saved",
        quantity: food.quantity,
        unit: food.unit,
      }),
    });
    refreshEntries();
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-bg/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-[520px] mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-[17px] font-semibold tracking-tight text-text">
            Calories
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowSavedFoods(true)}
              className="flex items-center gap-1.5 text-[14px] text-text-secondary hover:text-text transition-colors px-2 py-1.5 rounded-lg hover:bg-surface-raised"
            >
              <BookmarkIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Saved</span>
            </button>
            <button
              onClick={() => signOut()}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-surface-raised transition-colors"
              aria-label="Sign out"
            >
              <LogOutIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-[520px] mx-auto w-full px-4 pb-28 pt-4">
        <DayNav date={date} onDateChange={setDate} />

        <DailySummary
          calories={totalCalories}
          protein={totalProtein}
          loading={loadingEntries}
        />

        <EntryList
          entries={entries}
          loading={loadingEntries}
          onEdit={handleEditEntry}
          onDelete={handleDeleteEntry}
        />
      </main>

      {/* Bottom add button */}
      <div className="fixed bottom-0 left-0 right-0 z-10 pb-6 pt-4 bg-gradient-to-t from-bg via-bg/95 to-transparent pointer-events-none">
        <div className="max-w-[520px] mx-auto px-4 flex justify-center pointer-events-auto">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium text-[15px] px-6 py-3 rounded-2xl shadow-lg shadow-accent/20 transition-all active:scale-95"
          >
            <PlusIcon className="w-5 h-5" strokeWidth={2.5} />
            Add Food
          </button>
        </div>
      </div>

      {/* Add/Edit Entry Modal */}
      {showAddModal && (
        <AddEntryModal
          date={date}
          editingEntry={editingEntry}
          onClose={handleModalClose}
          onSuccess={handleEntryAdded}
        />
      )}

      {/* Saved Foods Sheet */}
      {showSavedFoods && (
        <SavedFoodsSheet
          onClose={() => setShowSavedFoods(false)}
          onAddToDay={handleAddSavedFood}
        />
      )}

      {/* Undo toast */}
      {undoEntry && (
        <UndoToast
          message="Entry deleted"
          onUndo={handleUndoDelete}
          onDismiss={() => setUndoEntry(null)}
        />
      )}
    </div>
  );
}
