import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      message, 
      audioBase64, 
      mediaFiles, 
      branchId, 
      buildingName, 
      supervisorName, 
      history 
    } = body;

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "مفتاح GEMINI_API_KEY غير معين. يرجى إدخاله في الإعدادات.",
      }, { status: 400 });
    }

    // 1. جلب سياق الفرع المختار من قاعدة البيانات
    let branchInfo: any = null;
    let branchWhere: any = {};
    if (branchId && branchId !== "all") {
      branchInfo = await prisma.branch.findUnique({ where: { id: branchId } });
      branchWhere = { branchId };
    }

    const branchName = branchInfo?.name || "كافة الفروع";
    const totalApartments = await prisma.apartment.count({ where: branchWhere });
    const unreadyApartments = await prisma.apartment.count({ where: { ...branchWhere, isReady: false } });
    const readyApartments = totalApartments - unreadyApartments;
    
    // جلب البلاغات المفتوحة في الفرع
    const openIssues = await prisma.issue.findMany({
      where: { ...branchWhere, status: { notIn: ["مكتمل", "مغلق", "مرفوض"] } },
      select: { roomNumber: true, department: true, mainType: true, priority: true, description: true, isRoomReady: true },
      take: 20,
    });

    const issuesSummary = openIssues.map(i => `الشقة ${i.roomNumber}: [${i.department} / ${i.mainType}] ${i.description} (أولوية: ${i.priority})`).join("\n");

    // 2. إعداد تعليمات النظام لـ Gemini مع دعم الاستيضاح التلقائي وتحديد الغرفة
    const currentBuilding = buildingName || "المبنى الرئيسي";
    const currentSupervisor = supervisorName || "مشرف الجولة";

    const systemInstruction = `أنت مساعد الذكاء الاصطناعي الفندقي الخبير (Hotel Inspection AI Copilot).
أنت ترافق المشرف الميداني (${currentSupervisor}) في جولة التفتيش الفندقية بالصوت والصور والنص باللغة العربية الفصحى المهنية والودية.

سياق الفرع الحالي (${branchName}) - المبنى المختار: (${currentBuilding}):
- إجمالي الشقق: ${totalApartments}
- الشقق الجاهزة للتسكين: ${readyApartments}
- الشقق غير الجاهزة (محظورة): ${unreadyApartments}
- أبرز البلاغات المفتوحة حالياً (${openIssues.length} بلاغ):
${issuesSummary || "لا توجد بلاغات مفتوحة حالياً."}

قواعد الجولة التفتيشية التفاعلية:
1. الاستيضاح التلقائي (Auto-Clarification):
   - إذا ذكر المشرف عطلاً أو ملاحظة (بالصوت أو النص أو الصورة) ولكن لم يذكر رقم الشقة/الغرفة (مثال: "المكيف خربان ويقطر ماء" أو "اللمبة طافية"):
     * اطلب منه فوراً وبطريقة ودية تحديد رقم الشقة أو الغرفة (مثال: "⚠️ رصدت بلاغ عطل التكييف وتسريب الماء، لكن لم تذكر رقم الشقة أو الجناح. في أي شقة لاحظت هذا العطل حتى أعتمد البلاغ فوراً؟").
     * لا تقم بتوليد وسم <ISSUES_JSON> أبداً في هذه الحالة لحين معرفة رقم الشقة.
2. التفكيك اللحظي للبلاغ (عند توفر رقم الشقة والعطل):
   - إذا كان رقم الشقة معروفاً من الحديث أو أجاب المشرف عن رقمها:
     * رحّب بالملاحظة وأكد رصدها.
     * ضمّن كائن JSON منظم داخل وسم <ISSUES_JSON>...</ISSUES_JSON> بالشكل التالي:
     <ISSUES_JSON>
     [
       {
         "roomNumber": "512",
         "building": "${currentBuilding}",
         "floor": "5",
         "area": "الحمام",
         "description": "تسرب ماء أسفل المغسلة",
         "department": "السباكة",
         "mainType": "سباكة",
         "subType": "مغاسل وتمديدات",
         "needType": "صيانة فورية",
         "priority": "عالية",
         "isRoomReady": false,
         "recommendedAction": "إصلاح التسرب أسفل المغسلة وفحص السيفون والتمديدات",
         "estimatedSlaHours": 12
       }
     ]
     </ISSUES_JSON>
     بحيث يظهر للمشرف كبطاقة منظمة بزر اعتماد فوري.
3. معايير جاهزية الغرفة (isRoomReady):
   - الأعطال الحرجة التي تؤثر على النزيل مباشرة (تسريب مياه، انقطاع كهرباء، عطل تكييف، تلف أقفال، نقص سرير أو نظافة سيئة) تجعل isRoomReady = false (محظورة للتسكين).
   - الملاحظات البسيطة (خدش بسيط في طاولة، نقص صابونة إضافية) تجعل isRoomReady = true (جاهزة للتسكين).
4. استفسارات الجاهزية والإحصائيات:
   - أجب بدقة واحترافية عن أي سؤال يطرحه المشرف حول جاهزية الفندق أو الغرف.
5. كن موجزاً ومباشراً ومناسباً للاستخدام الميداني عبر شاشات الجوال.`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { temperature: 0.2 },
      systemInstruction,
    });

    // 3. بناء الرسائل السابقة للدردشة متعددة الأدوار (Multi-turn History)
    let formattedHistory: any[] = [];
    if (history && Array.isArray(history) && history.length > 0) {
      formattedHistory = history
        .filter((h: any) => h.text && h.sender)
        .slice(-8) // الاحتفاظ بآخر 8 جولات للحفاظ على سياق الحوار
        .map((h: any) => ({
          role: h.sender === "user" ? "user" : "model",
          parts: [{ text: h.text }],
        }));
    }

    // 4. بناء محتوى الطلب الحالي متعدد الوسائط
    const currentParts: any[] = [];

    // إضافة نص الرسالة الحالية
    if (message?.trim()) {
      currentParts.push({ text: message.trim() });
    }

    // إضافة تسجيل صوتي إذا وجد
    if (audioBase64) {
      currentParts.push({
        inlineData: {
          mimeType: "audio/webm",
          data: audioBase64,
        },
      });
    }

    // إضافة صور الكاميرا / المرفقات إذا وجدت
    if (mediaFiles && Array.isArray(mediaFiles)) {
      for (const m of mediaFiles) {
        if (m.base64Data) {
          currentParts.push({
            inlineData: {
              mimeType: m.mimeType || "image/jpeg",
              data: m.base64Data,
            },
          });
        }
      }
    }

    if (currentParts.length === 0) {
      return NextResponse.json({ success: false, error: "يرجى كتابة نص، تسجيل صوتي، أو إرفاق صورة" }, { status: 400 });
    }

    let replyText = "";

    if (formattedHistory.length > 0) {
      const chatSession = model.startChat({
        history: formattedHistory,
      });
      const response = await chatSession.sendMessage(currentParts);
      replyText = response.response.text();
    } else {
      const response = await model.generateContent(currentParts);
      replyText = response.response.text();
    }

    // فحص ما إذا كان الرد يحتوي على بلاغات مستخرجة
    let extractedIssues: any[] = [];
    let cleanReply = replyText;

    const match = replyText.match(/<ISSUES_JSON>([\s\S]*?)<\/ISSUES_JSON>/);
    if (match && match[1]) {
      try {
        extractedIssues = JSON.parse(match[1].trim());
        cleanReply = replyText.replace(/<ISSUES_JSON>[\s\S]*?<\/ISSUES_JSON>/, "").trim();
      } catch (e) {
        console.error("فشل قراءة كائن البلاغات من رد الشات:", e);
      }
    }

    return NextResponse.json({
      success: true,
      reply: cleanReply,
      extractedIssues,
      branchName,
      buildingName: currentBuilding,
    });
  } catch (error: any) {
    console.error("خطأ في شات الذكاء الاصطناعي والتفتيش:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}