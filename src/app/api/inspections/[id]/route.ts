import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const inspection = await prisma.inspection.findUnique({
      where: { id: params.id },
      include: {
        issues: {
          include: {
            apartment: true,
          },
        },
        attachments: true,
      },
    });

    if (!inspection) {
      return NextResponse.json(
        { success: false, error: "لم يتم العثور على سجل التفتيش" },
        { status: 404 }
      );
    }

    let parsedAiResponse = null;
    if (inspection.rawGeminiResponse) {
      try {
        parsedAiResponse = JSON.parse(inspection.rawGeminiResponse);
      } catch (e) {
        console.error("فشل قراءة rawGeminiResponse:", e);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...inspection,
        parsedAiResponse,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}