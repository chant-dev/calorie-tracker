import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const entries = await prisma.entry.findMany({
    where: { userId: session.user.id, date },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { date, foodName, calories, protein, sourceType, quantity, unit } = body;

  if (!date || calories === undefined || protein === undefined) {
    return NextResponse.json({ error: "date, calories, protein required" }, { status: 400 });
  }

  const entry = await prisma.entry.create({
    data: {
      userId: session.user.id,
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
