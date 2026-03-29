import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "date required" }, { status: 400 });
  }

  const entries = await prisma.entry.findMany({
    where: { date },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { date, foodName, calories, protein, sourceType, quantity, unit } = body;

  if (!date || calories === undefined || protein === undefined) {
    return NextResponse.json({ error: "date, calories, protein required" }, { status: 400 });
  }

  const entry = await prisma.entry.create({
    data: {
      date,
      foodName: foodName || null,
      calories: Number(calories),
      protein: Number(protein),
      sourceType: sourceType || "manual",
      quantity: quantity ? Number(quantity) : null,
      unit: unit || null,
    },
  });

  return NextResponse.json({ entry }, { status: 201 });
}
