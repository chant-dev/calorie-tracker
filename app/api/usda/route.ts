import { NextRequest, NextResponse } from "next/server";
import { searchUSDAFoods } from "@/lib/usda";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query");
  if (!query || query.trim().length < 2) {
    return NextResponse.json({ foods: [] });
  }

  try {
    const foods = await searchUSDAFoods(query.trim(), 15);
    return NextResponse.json({ foods });
  } catch (err) {
    console.error("USDA search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
