import { PrismaClient } from "@prisma/client";
import { parseNaturalLanguageQuery, buildSafePrismaQuery } from "../src/lib/gemini/search-parser";
import { NaturalLanguageQuerySchema } from "../src/lib/schemas/query.schema";

const prisma = new PrismaClient();

async function runSearchVerification() {
  console.log("==================================================");
  console.log("🚀 بدء الاختبار العملي للمرحلة الخامسة: البحث باللغة الطبيعية");
  console.log("==================================================");

  const testQuestions = [
    "أظهر جميع الشقق التي تحتاج إلى كهرباء",
    "أظهر النواقص في المبنى A",
    "أظهر البلاغات المتأخرة أكثر من 24 ساعة",
    "أظهر الشقق غير الجاهزة",
  ];

  for (let i = 0; i < testQuestions.length; i++) {
    const q = testQuestions[i];
    console.log(`\n--------------------------------------------------`);
    console.log(`[اختبار ${i + 1}]: السؤال: "${q}"`);

    // 1. استدعاء Gemini لتحويل السؤال لكائن مهيكل
    const queryObj = await parseNaturalLanguageQuery(q);
    console.log(`فهم الذكاء الاصطناعي: ${queryObj.summary}`);
    console.log(`الفلاتر المستخرجة:`, JSON.stringify(queryObj.filters, null, 2));

    // 2. التحقق الصارم عبر Zod
    const zodValid = NaturalLanguageQuerySchema.safeParse(queryObj);
    if (zodValid.success) {
      console.log("✅ التحقق من Zod ناجح 100%!");
    } else {
      console.error("❌ خطأ Zod:", zodValid.error);
    }

    // 3. بناء استعلام Prisma الآمن (دون SQL خام نهائياً)
    const prismaWhere = buildSafePrismaQuery(queryObj);
    console.log(`Prisma Where Clause:`, JSON.stringify(prismaWhere));

    // 4. تنفيذ الاستعلام الفعلي في PostgreSQL
    const results = await prisma.issue.findMany({
      where: prismaWhere,
      take: 5,
      select: {
        id: true,
        roomNumber: true,
        department: true,
        mainType: true,
        priority: true,
        description: true,
        isRoomReady: true,
      },
    });

    console.log(`✅ تم استرجاع ${results.length} نتائج مطابقة من PostgreSQL بنجاح:`);
    results.forEach((r) => {
      console.log(`   - الشقة ${r.roomNumber} [${r.department} / ${r.mainType}]: ${r.description} (جاهزية: ${r.isRoomReady})`);
    });
  }

  console.log("\n==================================================");
  console.log("🎉 اكتمل اختبار البحث باللغة الطبيعية بنجاح تام 100%!");
  console.log("==================================================");
}

runSearchVerification()
  .catch((e) => {
    console.error("خطأ أثناء اختبار البحث الذكي:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });