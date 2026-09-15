import { GoogleGenerativeAI } from "@google/generative-ai";
import { NaturalLanguageQuerySchema, NaturalLanguageQuery } from "../schemas/query.schema";
import prisma from "../prisma";

export async function parseNaturalLanguageQuery(userQuestion: string): Promise<NaturalLanguageQuery> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";

  if (!apiKey) {
    throw new Error("مفتاح GEMINI_API_KEY غير معين لتشغيل محرك البحث الذكي");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
    systemInstruction: `أنت محرك بحث ذكي فندقي متخصص في ترجمة استفسارات المشرفين والمديرين باللغة العربية إلى كائن استعلام منظم.
قواعد صارمة:
1. لا تقم بتوليد أي كود SQL أو أوامر استعلام مباشرة إطلاقاً.
2. مهمتك فقط هي استخراج الفلاتر المنظمة المناسبة لسؤال المستخدم.
3. يجب أن يكون الناتج كائن JSON صالح فقط بالشكل الدقيق التالي:
{
  "intent": "search_issues",
  "summary": "تفسير السؤال باللغة العربية",
  "filters": {
    "roomNumber": null,
    "building": null,
    "floor": null,
    "department": null,
    "mainType": null,
    "subType": null,
    "needType": null,
    "priority": null,
    "status": null,
    "isRoomReady": null,
    "isOverdue": null,
    "isRecurring": null,
    "textSearch": null
  }
}

4. إرشادات الفلاتر:
- إذا سأل عن كهرباء: mainType = "كهرباء"
- إذا سأل عن سباكة: mainType = "سباكة"
- إذا سأل عن تكييف: mainType = "تكييف"
- إذا سأل عن نواقص (مناشف، صابون): mainType = "نقص مستلزمات"
- إذا سأل عن أثاث أو مفروشات: mainType = "تأثيث"
- إذا سأل عن مبنى (مثل المبنى A): building = "A"
- إذا سأل عن شقق غير جاهزة: isRoomReady = false
- إذا سأل عن بلاغات متأخرة: isOverdue = true
- إذا سأل عن أولوية (حرجة، عالية): priority = "حرجة"`,
  });

  const prompt = `حلل استفسار المستخدم التالي واستخرج كائن الفلترة المنظم:
"${userQuestion}"`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (e: any) {
    throw new Error(`تعذر قراءة كائن الاستعلام من الذكاء الاصطناعي: ${e.message}`);
  }

  // إذا أعاد النموذج filters مباشرة في الجذر
  if (!parsed.filters && (parsed.mainType || parsed.building || parsed.isRoomReady !== undefined)) {
    parsed = {
      intent: parsed.intent || "search_issues",
      summary: parsed.summary || userQuestion,
      filters: { ...parsed },
    };
  }

  if (!parsed.summary) {
    parsed.summary = `استعلام البحث عن: ${userQuestion}`;
  }
  if (!parsed.filters) {
    parsed.filters = {};
  }

  const validated = NaturalLanguageQuerySchema.parse(parsed);
  return validated;
}

export function buildSafePrismaQuery(query: NaturalLanguageQuery): any {
  const where: any = {};
  const { filters } = query;

  if (filters.roomNumber) {
    where.roomNumber = filters.roomNumber;
  }
  if (filters.building) {
    where.building = { contains: filters.building, mode: "insensitive" };
  }
  if (filters.floor) {
    where.floor = filters.floor;
  }
  if (filters.department) {
    where.department = { contains: filters.department, mode: "insensitive" };
  }
  if (filters.mainType) {
    where.mainType = { contains: filters.mainType, mode: "insensitive" };
  }
  if (filters.subType) {
    where.subType = { contains: filters.subType, mode: "insensitive" };
  }
  if (filters.needType) {
    where.needType = { contains: filters.needType, mode: "insensitive" };
  }
  if (filters.priority) {
    where.priority = filters.priority;
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.isRoomReady !== null && filters.isRoomReady !== undefined) {
    where.isRoomReady = filters.isRoomReady;
  }
  if (filters.isRecurring !== null && filters.isRecurring !== undefined) {
    where.isRecurring = filters.isRecurring;
  }
  if (filters.isOverdue) {
    where.slaDeadline = { lt: new Date() };
    where.status = { notIn: ["مكتمل", "مغلق", "مرفوض"] };
  }
  if (filters.textSearch) {
    where.OR = [
      { description: { contains: filters.textSearch, mode: "insensitive" } },
      { recommendedAction: { contains: filters.textSearch, mode: "insensitive" } },
      { area: { contains: filters.textSearch, mode: "insensitive" } },
    ];
  }

  return where;
}