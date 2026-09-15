import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("--- بدء زرع البيانات التجريبية لنظام الفروع المتعددة ---");

  // تنظيف
  await prisma.auditLog.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.apartment.deleteMany();
  await prisma.floor.deleteMany();
  await prisma.building.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.department.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 1. إنشاء الفروع
  const branchRiyadh = await prisma.branch.create({
    data: {
      name: "فندق الأندلس - فرع الرياض (العليا)",
      code: "RUH-01",
      city: "الرياض",
      address: "طريق الملك فهد، حي العليا",
      phone: "+966 11 456 7890",
      managerName: "م. عبدالعزيز المنصور",
      status: "ACTIVE",
    },
  });

  const branchJeddah = await prisma.branch.create({
    data: {
      name: "فندق الأندلس - فرع جدة (الكورنيش)",
      code: "JED-01",
      city: "جدة",
      address: "طريق الكورنيش الشمالي",
      phone: "+966 12 654 3210",
      managerName: "أ. ماجد الغامدي",
      status: "ACTIVE",
    },
  });

  const branchKhobar = await prisma.branch.create({
    data: {
      name: "فندق الأندلس - فرع الخبر (الواجهة)",
      code: "KHB-01",
      city: "الخبر",
      address: "طريق الأمير تركي، حي الكورنيش",
      phone: "+966 13 890 1234",
      managerName: "م. حسام العتيبي",
      status: "ACTIVE",
    },
  });

  console.log("✅ تم إنشاء الفروع الثلاثة بنجاح");

  // 2. مباني وطوابق وشقق فرع الرياض
  const bldgRuhA = await prisma.building.create({
    data: { name: "المبنى الرئيسي A", code: "A", branchId: branchRiyadh.id },
  });

  const floorsRuh = [];
  for (let i = 1; i <= 5; i++) {
    const f = await prisma.floor.create({
      data: { number: `${i}`, name: `الطابق ${i}`, buildingId: bldgRuhA.id },
    });
    floorsRuh.push(f);
  }

  const ruhRooms = [
    { number: "101", floorIdx: 0, type: "جناح تنفيذي", isReady: true },
    { number: "201", floorIdx: 1, type: "استوديو فندقي", isReady: false, notes: "عطل تكييف" },
    { number: "302", floorIdx: 2, type: "غرفة قياسية", isReady: false, notes: "صيانة تكييف ونقص مناشف" },
    { number: "401", floorIdx: 3, type: "غرفة ديلوكس", isReady: false, notes: "قفل الباب وشفاط" },
    { number: "512", floorIdx: 4, type: "جناح عائلي فاخر", isReady: false, notes: "تسرب سباكة ولمبة وتأثيث" },
    { number: "514", floorIdx: 4, type: "غرفة قياسية", isReady: true },
  ];

  for (const r of ruhRooms) {
    await prisma.apartment.create({
      data: {
        number: r.number,
        branchId: branchRiyadh.id,
        buildingId: bldgRuhA.id,
        floorId: floorsRuh[r.floorIdx].id,
        type: r.type,
        isReady: r.isReady,
        notes: r.notes || null,
      },
    });
  }

  // 3. مباني وشقق فرع جدة
  const bldgJedA = await prisma.building.create({
    data: { name: "برج البحر", code: "SEA", branchId: branchJeddah.id },
  });

  const floorsJed = [];
  for (let i = 1; i <= 3; i++) {
    const f = await prisma.floor.create({
      data: { number: `${i}`, name: `الطابق ${i}`, buildingId: bldgJedA.id },
    });
    floorsJed.push(f);
  }

  const jedRooms = [
    { number: "J101", floorIdx: 0, type: "جناح مطل على البحر", isReady: true },
    { number: "J201", floorIdx: 1, type: "غرفة ديلوكس", isReady: false, notes: "تسريب مياه بالحمام" },
    { number: "J301", floorIdx: 2, type: "جناح ملكي", isReady: true },
  ];

  for (const r of jedRooms) {
    await prisma.apartment.create({
      data: {
        number: r.number,
        branchId: branchJeddah.id,
        buildingId: bldgJedA.id,
        floorId: floorsJed[r.floorIdx].id,
        type: r.type,
        isReady: r.isReady,
        notes: r.notes || null,
      },
    });
  }

  console.log("✅ تم إنشاء مباني وشقق فرعي الرياض وجدة");

  // 4. الأقسام الـ 8
  const departments = [
    { name: "الصيانة", code: "MAINT", managerName: "م. أحمد الغامدي", managerEmail: "ahmed@hotel.com", slaHoursDefault: 12 },
    { name: "التدبير الفندقي", code: "HK", managerName: "سارة الشمري", managerEmail: "sara@hotel.com", slaHoursDefault: 4 },
    { name: "المستودع", code: "WH", managerName: "خالد العتيبي", managerEmail: "khaled@hotel.com", slaHoursDefault: 24 },
    { name: "المشتريات", code: "PURCH", managerName: "فهد الدوسري", managerEmail: "fahad@hotel.com", slaHoursDefault: 48 },
    { name: "الأمن والسلامة", code: "SEC", managerName: "نايف الحربي", managerEmail: "naif@hotel.com", slaHoursDefault: 2 },
    { name: "تقنية المعلومات", code: "IT", managerName: "م. طارق الشهري", managerEmail: "tariq@hotel.com", slaHoursDefault: 8 },
    { name: "إدارة الأصول", code: "ASSETS", managerName: "ياسر القحطاني", managerEmail: "yasser@hotel.com", slaHoursDefault: 48 },
    { name: "الإدارة", code: "MGT", managerName: "م. عبدالعزيز المنصور", managerEmail: "gm@hotel.com", slaHoursDefault: 24 },
  ];

  for (const d of departments) {
    await prisma.department.create({ data: d });
  }

  // 5. التصنيفات الـ 11
  const categories = [
    { name: "كهرباء", code: "ELEC", departmentDefault: "الصيانة", subCategories: "لمبات,أفياش,قواطع كهربائية", needTypes: "صيانة,استبدال,فحص" },
    { name: "سباكة", code: "PLUMB", departmentDefault: "الصيانة", subCategories: "تسرب مياه,انسداد مغاسل,خلاطات مياه,شطافات", needTypes: "صيانة,استبدال,فحص" },
    { name: "تكييف", code: "HVAC", departmentDefault: "الصيانة", subCategories: "صوت مرتفع,تبريد ضعيف,تسرب ماء", needTypes: "صيانة,فحص,استبدال" },
    { name: "نظافة", code: "CLEAN", departmentDefault: "التدبير الفندقي", subCategories: "تنظيف موكيت,تعقيم حمام,بقع مفارش", needTypes: "تنظيف,تجهيز" },
    { name: "تأثيث", code: "FURN", departmentDefault: "المستودع", subCategories: "كراسي تالفة,طاولات,ستائر,أبواب دواليب", needTypes: "تأثيث,استبدال,صيانة" },
    { name: "نقص مستلزمات", code: "SUPP", departmentDefault: "التدبير الفندقي", subCategories: "مناشف كبيرة,صابون وشامبو,غلاية ماء,أدوات مطبخ", needTypes: "توريد,تجهيز" },
    { name: "أجهزة", code: "APPL", departmentDefault: "الصيانة", subCategories: "شاشة تلفاز,ثلاجة ميني بار,مجفف شعر", needTypes: "صيانة,استبدال,فحص" },
    { name: "دهان وتشطيبات", code: "PAINT", departmentDefault: "الصيانة", subCategories: "تقشير دهان,خدوش جدران", needTypes: "صيانة" },
    { name: "سلامة", code: "SAFE", departmentDefault: "الأمن والسلامة", subCategories: "كاشف دخان,طفاية حريق,قفل إلكتروني", needTypes: "سلامة,فحص,استبدال" },
    { name: "مكافحة حشرات", code: "PEST", departmentDefault: "التدبير الفندقي", subCategories: "رش وقائي,مكافحة نمل", needTypes: "فحص,تجهيز" },
    { name: "أخرى", code: "OTHER", departmentDefault: "الإدارة", subCategories: "ملاحظات إدارية", needTypes: "فحص" },
  ];

  for (const c of categories) {
    await prisma.category.create({ data: c });
  }

  // 6. زرع بلاغات نموذجية لفرع الرياض
  const apt512 = await prisma.apartment.findFirst({ where: { number: "512", branchId: branchRiyadh.id } });
  const apt302 = await prisma.apartment.findFirst({ where: { number: "302", branchId: branchRiyadh.id } });
  const apt201 = await prisma.apartment.findFirst({ where: { number: "201", branchId: branchRiyadh.id } });

  // جولة لفرع الرياض
  const inspRuh = await prisma.inspection.create({
    data: {
      supervisorName: "عمر المشرف",
      notes: "جولة تفتيشية للشقق 512 و 302",
      branchId: branchRiyadh.id,
      summary: "رصد أعطال سباكة وكهرباء وتأثيث ونقص مستلزمات في شقق فرع الرياض",
      status: "APPROVED",
    },
  });

  await prisma.issue.createMany({
    data: [
      {
        roomNumber: "512",
        area: "الحمام",
        description: "تسرب ماء أسفل المغسلة يبلل الأرضية",
        department: "الصيانة",
        mainType: "سباكة",
        subType: "تسرب مياه",
        needType: "صيانة",
        priority: "حرجة",
        status: "قيد التنفيذ",
        recommendedAction: "تغيير محبس وخراطيم المغسلة",
        isRoomReady: false,
        estimatedSlaHours: 4,
        branchId: branchRiyadh.id,
        apartmentId: apt512?.id,
        inspectionId: inspRuh.id,
      },
      {
        roomNumber: "512",
        area: "الصالة",
        description: "لمبة السقف الرئيسية محروقة ولا تعمل",
        department: "الصيانة",
        mainType: "كهرباء",
        subType: "لمبات",
        needType: "استبدال",
        priority: "متوسطة",
        status: "جديد",
        recommendedAction: "تركيب لمبة LED موفرة",
        isRoomReady: true,
        estimatedSlaHours: 8,
        branchId: branchRiyadh.id,
        apartmentId: apt512?.id,
        inspectionId: inspRuh.id,
      },
      {
        roomNumber: "512",
        area: "المطبخ",
        description: "نقص طقم أواني وأدوات المطبخ وسكاكين الطعام",
        department: "التدبير الفندقي",
        mainType: "نقص مستلزمات",
        subType: "أدوات مطبخ",
        needType: "توريد",
        priority: "عالية",
        status: "جديد",
        recommendedAction: "تزويد الشقة بطقم أواني ومستلزمات مطبخ كاملة",
        isRoomReady: false,
        estimatedSlaHours: 6,
        branchId: branchRiyadh.id,
        apartmentId: apt512?.id,
        inspectionId: inspRuh.id,
      },
      {
        roomNumber: "302",
        area: "غرفة النوم",
        description: "التكييف صوته مرتفع جداً وتبريده شبه معدوم",
        department: "الصيانة",
        mainType: "تكييف",
        subType: "صوت مرتفع",
        needType: "صيانة",
        priority: "عالية",
        status: "جديد",
        recommendedAction: "تنظيف الفلتر وفحص ضغط الفريون ومروحة التبريد",
        isRoomReady: false,
        estimatedSlaHours: 12,
        branchId: branchRiyadh.id,
        apartmentId: apt302?.id,
        inspectionId: inspRuh.id,
      },
      {
        roomNumber: "302",
        area: "المطبخ",
        description: "نقص غلاية ماء كهربائية وأكواب شاي في ركن المطبخ",
        department: "المستودع",
        mainType: "نقص مستلزمات",
        subType: "أدوات مطبخ",
        needType: "توريد",
        priority: "متوسطة",
        status: "جديد",
        recommendedAction: "صرف غلاية ماء وأكواب من المستودع",
        isRoomReady: true,
        estimatedSlaHours: 4,
        branchId: branchRiyadh.id,
        apartmentId: apt302?.id,
        inspectionId: inspRuh.id,
      },
    ],
  });

  // 7. بلاغات نموذجية لفرع جدة (لتأكيد استقلالية البيانات)
  const aptJ201 = await prisma.apartment.findFirst({ where: { number: "J201", branchId: branchJeddah.id } });
  const inspJed = await prisma.inspection.create({
    data: {
      supervisorName: "خالد مشرف جدة",
      notes: "جولة الغرفة J201",
      branchId: branchJeddah.id,
      summary: "تسرب مياه في دورة المياه بجناح جدة",
      status: "APPROVED",
    },
  });

  await prisma.issue.create({
    data: {
      roomNumber: "J201",
      area: "الحمام",
      description: "تسرب ماء من وصلة الشطاف في فرع جدة",
      department: "الصيانة",
      mainType: "سباكة",
      subType: "شطافات",
      needType: "صيانة",
      priority: "عالية",
      status: "جديد",
      recommendedAction: "استبدال لي الشطاف",
      isRoomReady: false,
      estimatedSlaHours: 3,
      branchId: branchJeddah.id,
      apartmentId: aptJ201?.id,
      inspectionId: inspJed.id,
    },
  });

  console.log("✅ تم زرع البيانات وتوزيع البلاغات المستقلة لكل فرع بنجاح!");
}

main()
  .catch((e) => {
    console.error("خطأ في الزرع:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });