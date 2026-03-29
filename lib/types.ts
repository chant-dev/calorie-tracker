export interface Entry {
  id: string;
  date: string;
  foodName: string | null;
  calories: number;
  protein: number;
  sourceType: "manual" | "usda" | "saved";
  quantity: number | null;
  unit: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SavedFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  quantity: number | null;
  unit: string | null;
  sourceType: "manual" | "usda";
  createdAt: string;
  updatedAt: string;
}
