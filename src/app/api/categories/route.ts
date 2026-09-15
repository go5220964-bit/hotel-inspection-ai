import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });
    const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json({ success: true, departments, categories });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}