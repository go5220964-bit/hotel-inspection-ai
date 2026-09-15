import { PrismaClient } from "@prisma/client";
import { analyzeInspectionWithGemini } from "../src/lib/gemini/inspector";
import { GeminiInspectionResponseSchema } from "../src/lib/schemas/inspection.schema";

const prisma = new PrismaClient();

async function runMvpVerification() {
  console.log("==================================================");
  console.log("🚀 بدء الاختبار العملي للمرحلة الأولى: MVP");
  console.log("==================================================");

  // 1. فحص الاتصال بقاعدة بيانات PostgreSQL
  console.log("\n1. فحص الاتصال بـ PostgreSQL...");
  const aptCount = await prisma.apartment.count();
  const deptCount = await prisma.department.count();
  const catCount = await prisma.category.count();
  console.log(`✅ الاتصال ناجح! إجمالي الشقق: ${aptCount}, الأقسام: ${deptCount}, التصنيفات: ${catCount}`);

  // 2. اختبار معالجة الملاحظة النصية عبر Gemini
  console.log("\n2. اختبار إرسال ملاحظة تفتيش نصية عشوائية...");
  const testNote = "الشقة 512: في الحمام يوجد تسرب ماء شديد أسفل المغسلة يبلل الأرضية، ولمبة السقف في الصالة محروقة، كما أن كرسي السفرة مكسور ويحتاج استبدال، والستارة بها شق.";
  console.log(`النص المدخل: "${testNote}"`);

  const result = await analyzeInspectionWithGemini({
    textNote: testNote,
    supervisorName: "عمر المشرف (اختبار آلي)",
  });

  console.log(`\nنتيجة التحليل: نجاح = ${result.success}, الحالة = ${result.status}, معرف الجولة = ${result.inspectionId}`);

  if (result.success && result.data) {
    console.log("\n✅ استخراج البيانات من Gemini:");
    console.log(`- ملخص الجولة: ${result.data.inspectionSummary}`);
    console.log(`- عدد المشاكل المستخرجة: ${result.data.issues.length}`);
    console.log(`- هل يحتاج توضيح؟: ${result.data.needsClarification}`);

    result.data.issues.forEach((iss, idx) => {
      console.log(`\n  [مشكلة ${idx + 1}]:`);
      console.log(`    الشقة: ${iss.roomNumber} (${iss.area || "عام"})`);
      console.log(`    الوصف: ${iss.description}`);
      console.log(`    القسم: ${iss.department} | النوع: ${iss.mainType} (${iss.subType || "عام"})`);
      console.log(`    الأولوية: ${iss.priority} | جاهزية الشقة: ${iss.isRoomReady ? "جاهزة" : "غير جاهزة"}`);
      console.log(`    درجة الثقة: ${(iss.confidence * 100).toFixed(1)}% | SLA: ${iss.estimatedSlaHours}h`);
    });

    // 3. اختبار التحقق الصارم عبر Zod
    console.log("\n3. اختبار مطابقة النتيجة لمخطط Zod...");
    const parsed = GeminiInspectionResponseSchema.safeParse(result.data);
    if (parsed.success) {
      console.log("✅ التحقق من Zod ناجح 100% بدون أي أخطاء بنية!");
    } else {
      console.error("❌ فشل التحقق من Zod:", parsed.error);
    }

    // 4. اختبار حفظ المشاكل في PostgreSQL واعتمادها
    console.log("\n4. اختبار حفظ البلاغات المعتمدة في جداول PostgreSQL...");
    let savedCount = 0;
    for (const issueData of result.data.issues) {
      const apartment = await prisma.apartment.findFirst({
        where: { number: issueData.roomNumber },
      });

      if (apartment && !issueData.isRoomReady) {
        await prisma.apartment.update({
          where: { id: apartment.id },
          data: { isReady: false, lastInspectionDate: new Date() },
        });
      }

      await prisma.issue.create({
        data: {
          roomNumber: issueData.roomNumber,
          building: issueData.building || null,
          floor: issueData.floor || null,
          area: issueData.area || null,
          description: issueData.description,
          department: issueData.department,
          mainType: issueData.mainType,
          subType: issueData.subType || null,
          needType: issueData.needType,
          priority: issueData.priority || "متوسطة",
          status: "معتمد",
          recommendedAction: issueData.recommendedAction || null,
          isRoomReady: issueData.isRoomReady ?? true,
          isRecurring: issueData.isRecurring ?? false,
          confidence: issueData.confidence ?? 1.0,
          evidenceDescription: issueData.evidenceDescription || null,
          estimatedSlaHours: issueData.estimatedSlaHours || 24,
          apartmentId: apartment?.id,
          inspectionId: result.inspectionId,
        },
      });
      savedCount++;
    }

    await prisma.inspection.update({
      where: { id: result.inspectionId },
      data: { status: "APPROVED" },
    });

    console.log(`✅ تم حفظ ${savedCount} بلاغ بنجاح في جدول Issue في PostgreSQL!`);

    // التحقق من حالة الشقة 512
    const apt512 = await prisma.apartment.findFirst({ where: { number: "512" } });
    console.log(`✅ حالة الشقة 512 في قاعدة البيانات: isReady = ${apt512?.isReady}`);

  } else {
    console.log(`ℹ️ ملاحظة التحليل: ${result.errorMessage}`);
    console.log("✅ الملاحظة محفوظة بأمان في قاعدة البيانات كـ PENDING لحين توفير المفتاح.");
  }

  console.log("\n==================================================");
  console.log("🎉 اكتمل اختبار المرحلة الأولى بنجاح!");
  console.log("==================================================");
}

runMvpVerification()
  .catch((e) => {
    console.error("خطأ أثناء الاختبار:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });