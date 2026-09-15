import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeminiInspectionResponseSchema, GeminiInspectionResponse } from "../schemas/inspection.schema";
import { buildSystemInstruction, DynamicTaxonomy } from "./prompts";
import prisma from "../prisma";

export interface MediaFilePayload {
  mimeType: string;
  base64Data: string;
  fileName?: string;
  fileUrl?: string;
  fileType?: "image" | "audio" | "video" | "document";
  fileSize?: number;
}

export interface AnalyzeInspectionInput {
  textNote?: string;
  mediaFiles?: MediaFilePayload[];
  supervisorName?: string;
}

export interface AnalyzeInspectionResult {
  success: boolean;
  inspectionId: string;
  status: "COMPLETED" | "PENDING" | "FAILED";
  data?: GeminiInspectionResponse;
  errorMessage?: string;
  retryCount?: number;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getLiveTaxonomy(): Promise<DynamicTaxonomy> {
  try {
    const depts = await prisma.department.findMany({ select: { name: true } });
    const cats = await prisma.category.findMany();

    return {
      departments: depts.map((d) => d.name),
      categories: cats.map((c) => ({
        name: c.name,
        subCategories: c.subCategories ? c.subCategories.split(",").map((s) => s.trim()) : [],
        needTypes: c.needTypes ? c.needTypes.split(",").map((n) => n.trim()) : [],
        departmentDefault: c.departmentDefault || undefined,
      })),
    };
  } catch (error) {
    console.error("تعذر جلب التصنيفات من قاعدة البيانات، استخدام القيم الافتراضية:", error);
    return { departments: [], categories: [] };
  }
}

export async function analyzeInspectionWithGemini(
  input: AnalyzeInspectionInput,
  inspectionRecordId?: string
): Promise<AnalyzeInspectionResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";

  // تحديد روابط الصوت والفيديو إن وجدت
  let audioUrl: string | undefined;
  let videoUrl: string | undefined;
  if (input.mediaFiles && input.mediaFiles.length > 0) {
    for (const f of input.mediaFiles) {
      if (f.fileType === "audio" && !audioUrl) audioUrl = f.fileUrl;
      if (f.fileType === "video" && !videoUrl) videoUrl = f.fileUrl;
    }
  }

  // 1. حفظ الملاحظة الأصلية وجميع المرفقات في قاعدة بيانات PostgreSQL أولاً
  let currentInspectionId = inspectionRecordId;
  if (!currentInspectionId) {
    const createdInspection = await prisma.inspection.create({
      data: {
        supervisorName: input.supervisorName || "مشرف الجولة",
        notes: input.textNote || "",
        audioUrl,
        videoUrl,
        status: "PENDING", // بانتظار التحليل
      },
    });
    currentInspectionId = createdInspection.id;

    // حفظ المرفقات في جدول Attachment
    if (input.mediaFiles && input.mediaFiles.length > 0) {
      for (const m of input.mediaFiles) {
        await prisma.attachment.create({
          data: {
            fileName: m.fileName || "ملف_مرفق",
            fileUrl: m.fileUrl || "/uploads/placeholder",
            fileType: m.fileType || (m.mimeType.startsWith("image/") ? "image" : m.mimeType.startsWith("audio/") ? "audio" : "video"),
            fileSize: m.fileSize || 0,
            mimeType: m.mimeType,
            inspectionId: currentInspectionId,
          },
        });
      }
    }
  }

  // 2. التحقق من وجود مفتاح API
  if (!apiKey) {
    const errorMsg = "مفتاح GEMINI_API_KEY غير معين. تم حفظ الملاحظة والمرفقات بنجاح بحالة (بانتظار التحليل). يرجى إدخال المفتاح في ملف .env أو شاشة الإعدادات.";
    await prisma.inspection.update({
      where: { id: currentInspectionId },
      data: {
        status: "PENDING",
        summary: errorMsg,
      },
    });
    return {
      success: false,
      inspectionId: currentInspectionId,
      status: "PENDING",
      errorMessage: errorMsg,
    };
  }

  // 3. جلب التصنيفات الحية من قاعدة البيانات
  const taxonomy = await getLiveTaxonomy();
  const systemInstruction = buildSystemInstruction(taxonomy);

  // 4. تهيئة مكتبة Gemini الرسمية
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
    systemInstruction,
  });

  // 5. بناء محتوى الطلب المتعدد الوسائط (Multimodal Content)
  const promptParts: (string | { inlineData: { mimeType: string; data: string } })[] = [];

  // إضافة الملاحظة النصية
  if (input.textNote?.trim()) {
    promptParts.push(`ملاحظة المشرف الميداني أثناء الجولة:\n${input.textNote.trim()}`);
  }

  // إضافة المرفقات (صوت، صور، فيديو)
  if (input.mediaFiles && input.mediaFiles.length > 0) {
    for (const media of input.mediaFiles) {
      if (media.base64Data) {
        promptParts.push({
          inlineData: {
            mimeType: media.mimeType,
            data: media.base64Data,
          },
        });
      }
    }
  }

  // إرشادات الاستخراج الفندقي الدقيق
  promptParts.push(`
قم بتحليل الملاحظة الصوتية / النصية / المرئية المرفقة بدقة كاملة.
إذا كان هناك تسجيل صوتي: استمع إليه واستخرج كل الملاحظات المذكورة فيه.
إذا كانت هناك صور: حلل الصور واستخرج المشاكل الظاهرة فيها مع ذكر الدليل في evidenceDescription.
إذا كان هناك فيديو: حلل الحركة والمشاكل المرئية والمسموعة فيه.
افصل كل مشكلة في سجل مستقل في قائمة issues.

أعد كائن JSON صالح فقط بالشكل التالي:
{
  "inspectionSummary": "ملخص شامل للجولة باللغة العربية",
  "needsClarification": false,
  "clarificationQuestion": null,
  "issues": [
    {
      "roomNumber": "512",
      "building": "A",
      "floor": "5",
      "area": "الحمام",
      "description": "وصف دقيق للمشكلة",
      "department": "الصيانة",
      "mainType": "سباكة",
      "subType": "تسرب مياه",
      "needType": "صيانة",
      "priority": "عالية",
      "status": "جديد",
      "recommendedAction": "الإجراء المقترح",
      "isRoomReady": false,
      "isRecurring": false,
      "confidence": 0.95,
      "evidenceDescription": "صورة توضح تسرب مياه تحت الحوض",
      "estimatedSlaHours": 8
    }
  ]
}
`);

  // 6. حلقة المحاولات مع Auto-Correction
  const MAX_RETRIES = 3;
  let attempt = 0;
  let lastError: any = null;
  let correctionInstruction = "";

  while (attempt < MAX_RETRIES) {
    attempt++;
    try {
      const currentParts = correctionInstruction
        ? [...promptParts, `\n\nتنبيه تصحيحي مهم: المحاولة السابقة فشلت بسبب:\n${correctionInstruction}\nأعد صياغة كائن الـ JSON المنظم بدقة الآن.`]
        : promptParts;

      const result = await model.generateContent(currentParts as any);
      const responseText = result.response.text();

      let parsedJson: any;
      try {
        parsedJson = JSON.parse(responseText);
      } catch (jsonErr: any) {
        throw new Error(`تعذر قراءة الـ JSON من Gemini: ${jsonErr.message}`);
      }

      // التحقق الصارم عبر Zod
      const validationResult = GeminiInspectionResponseSchema.safeParse(parsedJson);

      if (!validationResult.success) {
        const errorIssues = validationResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
        correctionInstruction = `فشل التحقق من صحة المخطط (Schema Validation Error): ${errorIssues}`;
        throw new Error(correctionInstruction);
      }

      const validatedData = validationResult.data;

      // تحديث سجل التفتيش
      await prisma.inspection.update({
        where: { id: currentInspectionId },
        data: {
          status: "COMPLETED",
          summary: validatedData.inspectionSummary,
          needsClarification: validatedData.needsClarification,
          clarificationQuestion: validatedData.clarificationQuestion || null,
          rawGeminiResponse: JSON.stringify(validatedData),
        },
      });

      // إضافة سجل تدقيق
      await prisma.auditLog.create({
        data: {
          entityType: "Inspection",
          entityId: currentInspectionId,
          action: "AI_MULTIMODAL_ANALYZE_SUCCESS",
          performedBy: input.supervisorName || "مشرف الجولة",
          details: `تم التحليل متعدد الوسائط بنجاح بواسطة ${modelName}. عدد المشاكل المستخرجة: ${validatedData.issues.length}`,
        },
      });

      return {
        success: true,
        inspectionId: currentInspectionId,
        status: "COMPLETED",
        data: validatedData,
        retryCount: attempt - 1,
      };
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini Attempt ${attempt}/${MAX_RETRIES} Failed]:`, err.message);

      if (err.message?.includes("RESOURCE_EXHAUSTED") || err.message?.includes("429")) {
        const quotaMsg = "تم تجاوز الحد المتاح لطلبات Gemini API. تم حفظ الملاحظة والمرفقات بحالة 'بانتظار التحليل' لإعادة المحاولة لاحقاً.";
        await prisma.inspection.update({
          where: { id: currentInspectionId },
          data: { status: "PENDING", summary: quotaMsg },
        });
        return {
          success: false,
          inspectionId: currentInspectionId,
          status: "PENDING",
          errorMessage: quotaMsg,
        };
      }

      if (attempt < MAX_RETRIES) {
        await sleep(Math.pow(2, attempt) * 1000);
      }
    }
  }

  const failureMsg = `تعذر إكمال التحليل متعدد الوسائط بعد ${MAX_RETRIES} محاولات: ${lastError?.message || "خطأ غير معروف"}. الملاحظة والمرفقات محفوظة بأمان.`;
  await prisma.inspection.update({
    where: { id: currentInspectionId },
    data: {
      status: "FAILED",
      summary: failureMsg,
    },
  });

  return {
    success: false,
    inspectionId: currentInspectionId,
    status: "FAILED",
    errorMessage: failureMsg,
    retryCount: MAX_RETRIES,
  };
}