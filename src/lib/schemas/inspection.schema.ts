import { z } from "zod";

export const IssueSchema = z.object({
  roomNumber: z.string().describe("رقم الشقة أو الغرفة المستخرجة من الملاحظة"),
  building: z.string().nullable().optional().describe("رمز أو اسم المبنى"),
  floor: z.string().nullable().optional().describe("رقم الطابق"),
  area: z.string().nullable().optional().describe("المكان داخل الغرفة مثل الحمام، الصالة، غرفة النوم"),
  description: z.string().min(1).describe("وصف المشكلة بدقة ووضوح"),
  department: z.string().describe("القسم المسؤول الأنسب للتعامل مع المشكلة"),
  mainType: z.string().describe("التصنيف الرئيسي للمشكلة مثل سباكة، كهرباء، تكييف، نظافة"),
  subType: z.string().nullable().optional().describe("التصنيف الفرعي للمشكلة"),
  needType: z.string().describe("نوع الاحتياج مثل صيانة، تأثيث، توريد، تنظيف"),
  priority: z.enum(["حرجة", "عالية", "متوسطة", "منخفضة"]).default("متوسطة"),
  status: z.string().default("جديد"),
  recommendedAction: z.string().nullable().optional().describe("الإجراء الموصى به لمعالجة المشكلة"),
  isRoomReady: z.boolean().default(true).describe("هل الغرفة صالحة للاستخدام والتسكين رغم هذه المشكلة؟"),
  isRecurring: z.boolean().default(false).describe("هل يبدو أن المشكلة متكررة أو ناتجة عن خلل سابق؟"),
  confidence: z.number().min(0).max(1).default(1.0).describe("درجة الثقة من 0 إلى 1"),
  evidenceDescription: z.string().nullable().optional().describe("دليل المشكلة المذكور في الملاحظة أو الصورة"),
  estimatedSlaHours: z.number().int().positive().default(24).describe("الزمن التقديري المتوقع للإصلاح بالساعات"),
});

export const GeminiInspectionResponseSchema = z.object({
  inspectionSummary: z.string().describe("ملخص إداري موجز لجولة التفتيش"),
  needsClarification: z.boolean().default(false).describe("هل تحتاج الملاحظة إلى توضيح من المشرف لعدم وضوح رقم الغرفة أو المشكلة؟"),
  clarificationQuestion: z.string().nullable().optional().describe("سؤال المشرف في حال الحاجة لتوضيح"),
  issues: z.array(IssueSchema).default([]).describe("قائمة المشاكل المستقلة المستخرجة"),
});

export type IssueParsed = z.infer<typeof IssueSchema>;
export type GeminiInspectionResponse = z.infer<typeof GeminiInspectionResponseSchema>;