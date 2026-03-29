import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const search = req.nextUrl.searchParams.get("search") || "";

  const savedFoods = await prisma.savedFood.findMany({
    where: {
      userId: session.user.id,
      ...(search ? { name: { contains: search } } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ savedFoods });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, calories, protein, quantity, unit, sourceType } = body;

  if (!name || calories === undefined || protein === undefined) {
    return NextResponse.json({ error: "name, calories, protein required" }, { status: 400 });
  }

  const existing = await prisma.savedFood.findFirst({
    where: { userId: session.user.id, name },
  });

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
      userId: session.user.id,
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
