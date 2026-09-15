import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { analyzeInspectionWithGemini } from "@/lib/gemini/inspector";

export async function GET(req: NextRequest) {
  try {
    const inspections = await prisma.inspection.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        issues: true,
        attachments: true,
      },
    });
    return NextResponse.json({ success: true, data: inspections });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { textNote, mediaFiles, supervisorName } = body;

    if (!textNote && (!mediaFiles || mediaFiles.length === 0)) {
      return NextResponse.json(
        { success: false, error: "يرجى كتابة ملاحظة نصية أو إرفاق ملف على الأقل" },
        { status: 400 }
      );
    }

    // تشغيل خدمة التحليل الذكي مع حفظ الملاحظة الأصلية
    const result = await analyzeInspectionWithGemini({
      textNote,
      mediaFiles,
      supervisorName: supervisorName || "مشرف الجولة",
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("خطأ في API تسجيل الجولة:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}