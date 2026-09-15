import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseNaturalLanguageQuery, buildSafePrismaQuery } from "@/lib/gemini/search-parser";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question } = body;

    if (!question || !question.trim()) {
      return NextResponse.json(
        { success: false, error: "يرجى كتابة سؤال أو استفسار للبحث" },
        { status: 400 }
      );
    }

    // 1. تحويل السؤال عبر Gemini إلى Query Object منظم ومطابق لـ Zod
    const parsedQuery = await parseNaturalLanguageQuery(question.trim());

    // 2. تحويله إلى استعلام Prisma آمن تماماً (دون أي SQL خام)
    const prismaWhere = buildSafePrismaQuery(parsedQuery);

    // 3. تنفيذ الاستعلام في PostgreSQL عبر Prisma
    const issues = await prisma.issue.findMany({
      where: prismaWhere,
      orderBy: { createdAt: "desc" },
      include: {
        apartment: true,
        attachments: true,
      },
    });

    return NextResponse.json({
      success: true,
      question: question.trim(),
      interpretation: parsedQuery.summary,
      filtersApplied: parsedQuery.filters,
      count: issues.length,
      data: issues,
    });
  } catch (error: any) {
    console.error("خطأ في البحث باللغة الطبيعية:", error);
    return NextResponse.json(
      { success: false, error: error.message || "تعذر معالجة البحث الذكي" },
      { status: 500 }
    );
  }
}