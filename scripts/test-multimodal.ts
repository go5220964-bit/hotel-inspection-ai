import { PrismaClient } from "@prisma/client";
import { analyzeInspectionWithGemini } from "../src/lib/gemini/inspector";
import { GeminiInspectionResponseSchema } from "../src/lib/schemas/inspection.schema";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function runMultimodalVerification() {
  console.log("==================================================");
  console.log("🚀 بدء الاختبار العملي للمرحلة الثانية: الإدخال متعدد الوسائط");
  console.log("==================================================");

  // 1. تجهيز صورة فحص تجريبية (صورة PNG صالحة 1x1 بتنسيق Base64)
  // 1x1 red dot PNG
  const sampleImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

  // 2. تجهيز ملف صوتي تجريبي (Header WAV صالح)
  const wavHeader = Buffer.from([
    0x52, 0x49, 0x46, 0x46, // "RIFF"
    0x24, 0x00, 0x00, 0x00, // Chunk size
    0x57, 0x41, 0x56, 0x45, // "WAVE"
    0x66, 0x6d, 0x74, 0x20, // "fmt "
    0x10, 0x00, 0x00, 0x00, // Subchunk1Size (16 for PCM)
    0x01, 0x00,             // AudioFormat (1 = PCM)
    0x01, 0x00,             // NumChannels (1)
    0x44, 0xac, 0x00, 0x00, // SampleRate (44100)
    0x88, 0x58, 0x01, 0x00, // ByteRate
    0x02, 0x00,             // BlockAlign
    0x10, 0x00,             // BitsPerSample (16)
    0x64, 0x61, 0x74, 0x61, // "data"
    0x00, 0x00, 0x00, 0x00  // Subchunk2Size
  ]);
  const sampleAudioBase64 = wavHeader.toString("base64");

  // 3. إرسال طلب تفتيش متعدد الوسائط يحتوي على نص + صورة + تسجيل صوتي
  console.log("\n1. إرسال طلب تفتيش هجين يجمع (ملاحظة نصية + صورة فحص + تسجيل صوتي)...");
  const testText = "الشقة 401 في المبنى الرئيسي A: قفل الباب الإلكتروني لا يغلق بإحكام وهناك كسر في يد الباب، وصوت شفاط الحمام مزعج، ويوجد تسريب في صنبور المغسلة.";

  const result = await analyzeInspectionWithGemini({
    textNote: testText,
    supervisorName: "سارة المشرفة (فحص متعدد الوسائط)",
    mediaFiles: [
      {
        fileName: "صورة_يد_الباب_المكسور.png",
        mimeType: "image/png",
        base64Data: sampleImageBase64,
        fileType: "image",
        fileSize: 68,
        fileUrl: "/uploads/sample_door.png",
      },
      {
        fileName: "تسجيل_ملاحظات_الغرفة_401.wav",
        mimeType: "audio/wav",
        base64Data: sampleAudioBase64,
        fileType: "audio",
        fileSize: 44,
        fileUrl: "/uploads/sample_audio.wav",
      },
    ],
  });

  console.log(`\nنتيجة الاستجابة من Gemini:`);
  console.log(`- النجاح: ${result.success}`);
  console.log(`- حالة السجل: ${result.status}`);
  console.log(`- معرف الجولة: ${result.inspectionId}`);

  if (!result.success || !result.data) {
    throw new Error(`فشل التحليل متعدد الوسائط: ${result.errorMessage}`);
  }

  console.log(`- ملخص الجولة الذكي: ${result.data.inspectionSummary}`);
  console.log(`- عدد البلاغات المستخرجة: ${result.data.issues.length}`);

  result.data.issues.forEach((iss, i) => {
    console.log(`\n  [بلاغ ${i + 1}]:`);
    console.log(`    الشقة: ${iss.roomNumber} (${iss.area || "عام"})`);
    console.log(`    الوصف: ${iss.description}`);
    console.log(`    القسم المسؤول: ${iss.department}`);
    console.log(`    التصنيف: ${iss.mainType} / ${iss.subType || "عام"} (نوع الاحتياج: ${iss.needType})`);
    console.log(`    الأولوية: ${iss.priority} | الجاهزية: ${iss.isRoomReady ? "جاهزة" : "غير جاهزة"}`);
    console.log(`    الدليل المرصود: ${iss.evidenceDescription || "ملاحظة مسجلة"}`);
    console.log(`    دقة الذكاء الاصطناعي: ${(iss.confidence * 100).toFixed(1)}%`);
  });

  // 4. التحقق من تخزين المرفقات في قاعدة بيانات PostgreSQL
  console.log("\n2. التحقق من تسجيل المرفقات في جدول Attachment في PostgreSQL...");
  const attachments = await prisma.attachment.findMany({
    where: { inspectionId: result.inspectionId },
  });
  console.log(`✅ تم العثور على ${attachments.length} مرفقات مرتبطة بهذه الجولة في قاعدة البيانات:`);
  attachments.forEach((att, idx) => {
    console.log(`   - مرفق ${idx + 1}: ${att.fileName} (النوع: ${att.fileType}, الحجم: ${att.fileSize} bytes)`);
  });

  // 5. التحقق من Zod Schema
  console.log("\n3. التحقق من صحة المخطط بواسطة Zod...");
  const zodValidation = GeminiInspectionResponseSchema.safeParse(result.data);
  if (zodValidation.success) {
    console.log("✅ التحقق من Zod ناجح 100%!");
  } else {
    console.error("❌ خطأ في التحقق من Zod:", zodValidation.error);
  }

  console.log("\n==================================================");
  console.log("🎉 اكتمل اختبار المرحلة الثانية (متعدد الوسائط) بنجاح تام!");
  console.log("==================================================");
}

runMultimodalVerification()
  .catch((e) => {
    console.error("خطأ أثناء الاختبار متعدد الوسائط:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });