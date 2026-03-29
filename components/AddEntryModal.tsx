"use client";

import { useState, useEffect, useRef } from "react";
import { XIcon, SearchIcon, LoaderIcon, CheckIcon } from "lucide-react";
import { Entry } from "@/lib/types";
import { USDAFood } from "@/lib/usda";
import { cn } from "@/lib/utils";

interface AddEntryModalProps {
  date: string;
  editingEntry: Entry | null;
  onClose: () => void;
  onSuccess: () => void;
}

type Tab = "manual" | "usda";

interface FormState {
  foodName: string;
  calories: string;
  protein: string;
  saveForLater: boolean;
}

const emptyForm: FormState = {
  foodName: "",
  calories: "",
  protein: "",
  saveForLater: false,
};

export function AddEntryModal({ date, editingEntry, onClose, onSuccess }: AddEntryModalProps) {
  const [tab, setTab] = useState<Tab>("manual");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // USDA search state
  const [usdaQuery, setUsdaQuery] = useState("");
  const [usdaResults, setUsdaResults] = useState<USDAFood[]>([]);
  const [usdaLoading, setUsdaLoading] = useState(false);
  const [selectedFood, setSelectedFood] = useState<USDAFood | null>(null);
  const [amountGrams, setAmountGrams] = useState("");

  const firstInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pre-fill form when editing
  useEffect(() => {
    if (editingEntry) {
      setForm({
        foodName: editingEntry.foodName || "",
        calories: String(editingEntry.calories),
        protein: String(editingEntry.protein),
        saveForLater: false,
      });
    }
  }, [editingEntry]);

  // Focus first input on open
  useEffect(() => {
    const timer = setTimeout(() => {
      if (tab === "manual") firstInputRef.current?.focus();
      else searchRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [tab]);

  // USDA search with debounce
  useEffect(() => {
    if (selectedFood) return;
    if (usdaQuery.trim().length < 2) {
      setUsdaResults([]);
      return;
    }
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      setUsdaLoading(true);
      try {
        const res = await fetch(`/api/usda?query=${encodeURIComponent(usdaQuery)}`);
        const data = await res.json();
        setUsdaResults(data.foods || []);
      } catch {
        setUsdaResults([]);
      } finally {
        setUsdaLoading(false);
      }
    }, 350);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [usdaQuery, selectedFood]);

  // Recalculate when amount changes
  useEffect(() => {
    if (!selectedFood || !amountGrams) return;
    const grams = parseFloat(amountGrams);
    if (isNaN(grams) || grams <= 0) return;
    setForm((f) => ({
      ...f,
      calories: String(Math.round((selectedFood.caloriesPer100g * grams) / 100)),
      protein: String(Math.round(((selectedFood.proteinPer100g * grams) / 100) * 10) / 10),
    }));
  }, [amountGrams, selectedFood]);

  const selectUSDAFood = (food: USDAFood) => {
    setSelectedFood(food);
    const defaultAmount = food.servingSize && food.servingSizeUnit?.toLowerCase().includes("g")
      ? String(food.servingSize)
      : "100";
    setAmountGrams(defaultAmount);
    setForm((f) => ({
      ...f,
      foodName: food.description,
      calories: String(Math.round((food.caloriesPer100g * parseFloat(defaultAmount)) / 100)),
      protein: String(Math.round(((food.proteinPer100g * parseFloat(defaultAmount)) / 100) * 10) / 10),
    }));
  };

  const clearUSDASelection = () => {
    setSelectedFood(null);
    setAmountGrams("");
    setForm((f) => ({ ...f, foodName: "", calories: "", protein: "" }));
    setTimeout(() => searchRef.current?.focus(), 50);
  };

  const handleSubmit = async () => {
    const cal = parseFloat(form.calories);
    const prot = parseFloat(form.protein);

    if (isNaN(cal) || cal < 0) {
      setError("Enter valid calories");
      return;
    }
    if (isNaN(prot) || prot < 0) {
      setError("Enter valid protein");
      return;
    }
    if (form.saveForLater && !form.foodName.trim()) {
      setError("Food name required to save");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      if (editingEntry) {
        await fetch(`/api/entries/${editingEntry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            foodName: form.foodName.trim() || null,
            calories: cal,
            protein: prot,
            quantity: selectedFood ? parseFloat(amountGrams) || null : editingEntry.quantity,
            unit: selectedFood ? "g" : editingEntry.unit,
          }),
        });
      } else {
        await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            foodName: form.foodName.trim() || null,
            calories: cal,
            protein: prot,
            sourceType: selectedFood ? "usda" : "manual",
            quantity: selectedFood ? parseFloat(amountGrams) || null : null,
            unit: selectedFood ? "g" : null,
          }),
        });
      }

      // Save for later
      if (form.saveForLater && form.foodName.trim()) {
        await fetch("/api/saved-foods", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.foodName.trim(),
            calories: cal,
            protein: prot,
            quantity: selectedFood ? parseFloat(amountGrams) || null : null,
            unit: selectedFood ? "g" : null,
            sourceType: selectedFood ? "usda" : "manual",
          }),
        });
      }

      onSuccess();
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    form.calories !== "" &&
    form.protein !== "" &&
    parseFloat(form.calories) >= 0 &&
    parseFloat(form.protein) >= 0 &&
    (!form.saveForLater || form.foodName.trim().length > 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal — bottom sheet on mobile, centered on desktop */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full sm:max-w-[480px] bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl shadow-black/10 flex flex-col sheet-enter sm:animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle (mobile) */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 bg-border rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 sm:pt-5">
            <h2 className="text-[18px] font-semibold text-text">
              {editingEntry ? "Edit Entry" : "Add Food"}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-text-muted hover:text-text hover:bg-surface-raised transition-colors"
            >
              <XIcon className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Tabs (only for new entries) */}
          {!editingEntry && (
            <div className="px-5 mb-4">
              <div className="flex bg-surface-raised rounded-xl p-1 gap-1">
                <button
                  onClick={() => setTab("manual")}
                  className={cn(
                    "flex-1 py-2 text-[14px] font-medium rounded-lg transition-all",
                    tab === "manual"
                      ? "bg-surface text-text shadow-sm"
                      : "text-text-secondary hover:text-text"
                  )}
                >
                  Manual
                </button>
                <button
                  onClick={() => setTab("usda")}
                  className={cn(
                    "flex-1 py-2 text-[14px] font-medium rounded-lg transition-all",
                    tab === "usda"
                      ? "bg-surface text-text shadow-sm"
                      : "text-text-secondary hover:text-text"
                  )}
                >
                  Search USDA
                </button>
              </div>
            </div>
          )}

          {/* Form content */}
          <div className="px-5 pb-5 flex-1 overflow-y-auto max-h-[70vh]">
            {tab === "usda" && !editingEntry ? (
              <USDATab
                query={usdaQuery}
                setQuery={setUsdaQuery}
                results={usdaResults}
                loading={usdaLoading}
                selectedFood={selectedFood}
                amountGrams={amountGrams}
                setAmountGrams={setAmountGrams}
                onSelect={selectUSDAFood}
                onClear={clearUSDASelection}
                form={form}
                setForm={setForm}
                searchRef={searchRef as React.RefObject<HTMLInputElement>}
              />
            ) : (
              <ManualTab
                form={form}
                setForm={setForm}
                firstInputRef={firstInputRef as React.RefObject<HTMLInputElement>}
                isEditing={!!editingEntry}
                selectedFood={selectedFood}
                amountGrams={amountGrams}
                setAmountGrams={setAmountGrams}
              />
            )}

            {/* Error */}
            {error && (
              <p className="text-[13px] text-danger mt-3">{error}</p>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className={cn(
                "w-full mt-4 py-3.5 rounded-2xl text-[15px] font-semibold transition-all",
                canSubmit && !submitting
                  ? "bg-accent hover:bg-accent-hover text-white active:scale-[0.98]"
                  : "bg-surface-raised text-text-muted cursor-not-allowed"
              )}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <LoaderIcon className="w-4 h-4 animate-spin" />
                  Saving…
                </span>
              ) : editingEntry ? (
                "Save Changes"
              ) : (
                "Add to Day"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ---- Manual Tab ----

interface ManualTabProps {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  firstInputRef: React.RefObject<HTMLInputElement>;
  isEditing: boolean;
  selectedFood: USDAFood | null;
  amountGrams: string;
  setAmountGrams: (v: string) => void;
}

function ManualTab({ form, setForm, firstInputRef, isEditing, selectedFood, amountGrams, setAmountGrams }: ManualTabProps) {
  return (
    <div className="space-y-3">
      <FormField label="Food name" optional={!form.saveForLater}>
        <input
          ref={firstInputRef}
          type="text"
          placeholder="e.g. Chicken breast"
          value={form.foodName}
          onChange={(e) => setForm((f) => ({ ...f, foodName: e.target.value }))}
          className="w-full bg-surface-raised rounded-xl px-3.5 py-3 text-[15px] text-text placeholder:text-text-muted border border-transparent focus:border-accent/50 focus:bg-white focus:outline-none transition-colors"
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Calories">
          <input
            type="number"
            placeholder="0"
            value={form.calories}
            onChange={(e) => setForm((f) => ({ ...f, calories: e.target.value }))}
            inputMode="decimal"
            className="w-full bg-surface-raised rounded-xl px-3.5 py-3 text-[15px] text-text placeholder:text-text-muted border border-transparent focus:border-accent/50 focus:bg-white focus:outline-none transition-colors"
          />
        </FormField>
        <FormField label="Protein (g)">
          <input
            type="number"
            placeholder="0"
            value={form.protein}
            onChange={(e) => setForm((f) => ({ ...f, protein: e.target.value }))}
            inputMode="decimal"
            className="w-full bg-surface-raised rounded-xl px-3.5 py-3 text-[15px] text-text placeholder:text-text-muted border border-transparent focus:border-accent/50 focus:bg-white focus:outline-none transition-colors"
          />
        </FormField>
      </div>

      {/* Save for later (not when editing) */}
      {!isEditing && (
        <label className="flex items-center gap-3 py-1 cursor-pointer group">
          <div
            className={cn(
              "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0",
              form.saveForLater
                ? "bg-accent border-accent"
                : "border-border group-hover:border-text-muted"
            )}
            onClick={() => setForm((f) => ({ ...f, saveForLater: !f.saveForLater }))}
          >
            {form.saveForLater && <CheckIcon className="w-3 h-3 text-white" strokeWidth={3} />}
          </div>
          <span className="text-[14px] text-text-secondary select-none">
            Save for later reuse
            {form.saveForLater && (
              <span className="text-text-muted ml-1">(name required)</span>
            )}
          </span>
        </label>
      )}
    </div>
  );
}

// ---- USDA Tab ----

interface USDATabProps {
  query: string;
  setQuery: (q: string) => void;
  results: USDAFood[];
  loading: boolean;
  selectedFood: USDAFood | null;
  amountGrams: string;
  setAmountGrams: (v: string) => void;
  onSelect: (food: USDAFood) => void;
  onClear: () => void;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  searchRef: React.RefObject<HTMLInputElement>;
}

function USDATab({
  query, setQuery, results, loading, selectedFood, amountGrams,
  setAmountGrams, onSelect, onClear, form, setForm, searchRef,
}: USDATabProps) {
  if (selectedFood) {
    return (
      <div className="space-y-3">
        {/* Selected food */}
        <div className="bg-accent-light rounded-xl px-4 py-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-[14px] font-semibold text-accent">{selectedFood.description}</p>
            <p className="text-[12px] text-accent/70 mt-0.5">
              {selectedFood.caloriesPer100g} cal / {selectedFood.proteinPer100g}g protein per 100g
            </p>
          </div>
          <button
            onClick={onClear}
            className="text-accent/60 hover:text-accent transition-colors mt-0.5"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <FormField label={`Amount${selectedFood.servingSizeUnit ? ` (${selectedFood.servingSizeUnit.toLowerCase()})` : " (g)"}`}>
          <input
            type="number"
            placeholder="100"
            value={amountGrams}
            onChange={(e) => setAmountGrams(e.target.value)}
            autoFocus
            inputMode="decimal"
            className="w-full bg-surface-raised rounded-xl px-3.5 py-3 text-[15px] text-text placeholder:text-text-muted border border-transparent focus:border-accent/50 focus:bg-white focus:outline-none transition-colors"
          />
        </FormField>

        {/* Auto-calculated values */}
        {amountGrams && parseFloat(amountGrams) > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-raised rounded-xl px-3.5 py-3">
              <div className="text-[11px] text-text-muted uppercase tracking-wider mb-1">Calories</div>
              <div className="text-[20px] font-bold text-text">{form.calories}</div>
            </div>
            <div className="bg-surface-raised rounded-xl px-3.5 py-3">
              <div className="text-[11px] text-text-muted uppercase tracking-wider mb-1">Protein</div>
              <div className="text-[20px] font-bold text-text">{form.protein}g</div>
            </div>
          </div>
        )}

        <label className="flex items-center gap-3 py-1 cursor-pointer group">
          <div
            className={cn(
              "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0",
              form.saveForLater
                ? "bg-accent border-accent"
                : "border-border group-hover:border-text-muted"
            )}
            onClick={() => setForm((f) => ({ ...f, saveForLater: !f.saveForLater }))}
          >
            {form.saveForLater && <CheckIcon className="w-3 h-3 text-white" strokeWidth={3} />}
          </div>
          <span className="text-[14px] text-text-secondary select-none">
            Save for later reuse
          </span>
        </label>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        <input
          ref={searchRef}
          type="search"
          placeholder="Search foods, e.g. chicken breast…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-surface-raised rounded-xl pl-10 pr-4 py-3 text-[15px] text-text placeholder:text-text-muted border border-transparent focus:border-accent/50 focus:bg-white focus:outline-none transition-colors"
        />
        {loading && (
          <LoaderIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted animate-spin" />
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-1.5 max-h-64 overflow-y-auto -mx-1 px-1">
          {results.map((food) => (
            <button
              key={food.fdcId}
              onClick={() => onSelect(food)}
              className="w-full text-left bg-surface-raised hover:bg-border/30 rounded-xl px-3.5 py-3 transition-colors"
            >
              <div className="text-[14px] font-medium text-text line-clamp-1">{food.description}</div>
              <div className="text-[12px] text-text-muted mt-0.5">
                {food.caloriesPer100g} cal · {food.proteinPer100g}g protein per 100g
              </div>
            </button>
          ))}
        </div>
      )}

      {!loading && query.length >= 2 && results.length === 0 && (
        <p className="text-[13px] text-text-muted text-center py-4">
          No results found. Try a different search.
        </p>
      )}

      {query.length === 0 && (
        <p className="text-[13px] text-text-muted text-center py-4">
          Type to search millions of foods from USDA
        </p>
      )}
    </div>
  );
}

// ---- Helpers ----

function FormField({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-text-muted uppercase tracking-wider mb-1.5">
        {label}
        {optional && <span className="ml-1 normal-case tracking-normal text-text-muted/60">optional</span>}
      </label>
      {children}
    </div>
  );
}
