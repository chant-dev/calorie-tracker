export interface USDAFood {
  fdcId: number;
  description: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  servingSize?: number;
  servingSizeUnit?: string;
}

interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  value: number;
  unitName: string;
}

interface USDASearchFood {
  fdcId: number;
  description: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: USDANutrient[];
}

interface USDASearchResponse {
  foods: USDASearchFood[];
  totalHits: number;
}

const ENERGY_NUTRIENT_IDS = [1008, 208];
const PROTEIN_NUTRIENT_IDS = [1003, 203];

function getNutrientValue(
  nutrients: USDANutrient[],
  ids: number[],
  type: "energy" | "protein"
): number {
  // Try by nutrient ID first (most reliable)
  for (const id of ids) {
    const nutrient = nutrients.find((n) => n.nutrientId === id);
    if (nutrient && nutrient.value !== undefined && nutrient.value >= 0) {
      // For energy, only accept kcal units
      if (type === "energy") {
        const unit = (nutrient.unitName || "").toLowerCase();
        if (unit === "kcal" || unit === "cal") return nutrient.value;
      } else {
        return nutrient.value;
      }
    }
  }
  // Fallback: search by name + unit
  if (type === "energy") {
    const byName = nutrients.find(
      (n) =>
        n.nutrientName?.toLowerCase().includes("energy") &&
        (n.unitName?.toLowerCase() === "kcal" || n.unitName?.toLowerCase() === "cal")
    );
    return byName?.value ?? 0;
  }
  const byName = nutrients.find((n) =>
    n.nutrientName?.toLowerCase().startsWith("protein")
  );
  return byName?.value ?? 0;
}

export async function searchUSDAFoods(query: string, pageSize = 15): Promise<USDAFood[]> {
  const apiKey = process.env.USDA_API_KEY || "DEMO_KEY";
  const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  url.searchParams.set("query", query);
  url.searchParams.set("pageSize", String(pageSize));
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("dataType", "Foundation,SR Legacy,Branded");

  const res = await fetch(url.toString(), { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`USDA API error: ${res.status}`);
  }

  const data: USDASearchResponse = await res.json();

  const results: USDAFood[] = [];
  for (const food of data.foods) {
    const calories = getNutrientValue(food.foodNutrients, ENERGY_NUTRIENT_IDS, "energy");
    const protein = getNutrientValue(food.foodNutrients, PROTEIN_NUTRIENT_IDS, "protein");
    if (calories <= 0) continue;
    results.push({
      fdcId: food.fdcId,
      description: formatFoodName(food.description),
      caloriesPer100g: Math.round(calories * 10) / 10,
      proteinPer100g: Math.round(protein * 10) / 10,
      servingSize: food.servingSize,
      servingSizeUnit: food.servingSizeUnit,
    });
    if (results.length >= pageSize) break;
  }
  return results;
}

function formatFoodName(name: string): string {
  // Convert ALL CAPS to Title Case for branded/SR legacy foods
  if (name === name.toUpperCase()) {
    return name
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
  return name;
}
