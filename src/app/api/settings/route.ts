import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 5;
  const currentModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  return NextResponse.json({
    success: true,
    hasKey,
    currentModel,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, model } = body;

    if (apiKey) {
      process.env.GEMINI_API_KEY = apiKey.trim();
    }
    if (model) {
      process.env.GEMINI_MODEL = model.trim();
    }

    return NextResponse.json({
      success: true,
      message: "تم تحديث الإعدادات مؤقتاً في جلسة الخادم الحالية",
      hasKey: !!process.env.GEMINI_API_KEY,
      currentModel: process.env.GEMINI_MODEL,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}