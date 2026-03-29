import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("search") || "";

  const savedFoods = await prisma.savedFood.findMany({
    where: search
      ? {
          name: {
            contains: search,
          },
        }
      : undefined,
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ savedFoods });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, calories, protein, quantity, unit, sourceType } = body;

  if (!name || calories === undefined || protein === undefined) {
    return NextResponse.json({ error: "name, calories, protein required" }, { status: 400 });
  }

  // Upsert by name to avoid duplicates
  const existing = await prisma.savedFood.findFirst({ where: { name } });
  if (existing) {
    const updated = await prisma.savedFood.update({
      where: { id: existing.id },
      data: {
        calories: Number(calories),
        protein: Number(protein),
        quantity: quantity ? Number(quantity) : null,
        unit: unit || null,
        sourceType: sourceType || "manual",
      },
    });
    return NextResponse.json({ savedFood: updated });
  }

  const savedFood = await prisma.savedFood.create({
    data: {
      name,
      calories: Number(calories),
      protein: Number(protein),
      quantity: quantity ? Number(quantity) : null,
      unit: unit || null,
      sourceType: sourceType || "manual",
    },
  });

  return NextResponse.json({ savedFood }, { status: 201 });
}
