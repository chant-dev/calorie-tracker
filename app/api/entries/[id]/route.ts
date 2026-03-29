import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { foodName, calories, protein, quantity, unit } = body;

  const entry = await prisma.entry.update({
    where: { id },
    data: {
      ...(foodName !== undefined && { foodName: foodName || null }),
      ...(calories !== undefined && { calories: Number(calories) }),
      ...(protein !== undefined && { protein: Number(protein) }),
      ...(quantity !== undefined && { quantity: quantity ? Number(quantity) : null }),
      ...(unit !== undefined && { unit: unit || null }),
    },
  });

  return NextResponse.json({ entry });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.entry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
