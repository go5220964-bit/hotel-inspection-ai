import { z } from "zod";

export const NaturalLanguageQuerySchema = z.object({
  intent: z.enum(["search_issues", "search_rooms", "statistics"]).default("search_issues"),
  summary: z.string().describe("تفسير وفهم الذكاء الاصطناعي لسؤال المستخدم باللغة العربية"),
  filters: z.object({
    roomNumber: z.string().nullable().optional().describe("رقم الشقة إذا حدد في السؤال"),
    building: z.string().nullable().optional().describe("رمز المبنى مثل A أو B"),
    floor: z.string().nullable().optional().describe("رقم الطابق"),
    department: z.string().nullable().optional().describe("القسم مثل الصيانة، التدبير الفندقي"),
    mainType: z.string().nullable().optional().describe("التصنيف الرئيسي مثل كهرباء، سباكة، تكييف، نقص مستلزمات، تأثيث"),
    subType: z.string().nullable().optional().describe("التصنيف الفرعي"),
    needType: z.string().nullable().optional().describe("نوع الاحتياج مثل صيانة، توريد، تأثيث"),
    priority: z.enum(["حرجة", "عالية", "متوسطة", "منخفضة"]).nullable().optional().describe("الأولوية"),
    status: z.string().nullable().optional().describe("الحالة"),
    isRoomReady: z.boolean().nullable().optional().describe("هل الشقة جاهزة للتسكين؟ false تعني غير جاهزة"),
    isOverdue: z.boolean().nullable().optional().describe("هل المشكلة متأخرة عن وقت الإغلاق SLA؟"),
    isRecurring: z.boolean().nullable().optional().describe("هل المشكلة متكررة؟"),
    textSearch: z.string().nullable().optional().describe("كلمات دلالية للبحث في الوصف والملاحظات"),
  }),
});

export type NaturalLanguageQuery = z.infer<typeof NaturalLanguageQuerySchema>;