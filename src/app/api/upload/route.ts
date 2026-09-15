import { NextRequest, NextResponse } from "next/server";
import { StorageService } from "@/lib/storage/storage.service";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "لم يتم تحديد أي ملف للرفع" },
        { status: 400 }
      );
    }

    const savedFiles = [];
    for (const file of files) {
      const saved = await StorageService.saveUploadedFile(file);
      savedFiles.push(saved);
    }

    return NextResponse.json({
      success: true,
      files: savedFiles,
    });
  } catch (error: any) {
    console.error("خطأ في رفع الملفات:", error);
    return NextResponse.json(
      { success: false, error: error.message || "فشل رفع الملف" },
      { status: 500 }
    );
  }
}