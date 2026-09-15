import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");

    const branchFilter = branchId && branchId !== "all" ? { branchId } : {};

    // 1. Fetch branch info
    let branchName = "كافة الفروع";
    if (branchId && branchId !== "all") {
      const b = await prisma.branch.findUnique({ where: { id: branchId } });
      if (b) branchName = b.name;
    }

    // 2. Total apartments and readiness
    const allApartments = await prisma.apartment.findMany({
      where: branchFilter,
      select: { id: true, number: true, isReady: true },
    });
    const totalApartments = allApartments.length;
    const readyApartments = allApartments.filter((a) => a.isReady).length;
    const blockedApartments = allApartments.filter((a) => !a.isReady);
    const blockedRoomNumbers = blockedApartments.map((a) => a.number);
    const readinessRate = totalApartments > 0 ? Math.round((readyApartments / totalApartments) * 100) : 100;

    // Active issues query (not completed/closed)
    const activeIssuesWhere = {
      ...branchFilter,
      status: { notIn: ["مكتمل", "مغلق"] },
    };

    const allActiveIssues = await prisma.issue.findMany({
      where: activeIssuesWhere,
      select: {
        id: true,
        roomNumber: true,
        department: true,
        mainType: true,
        needType: true,
        description: true,
        priority: true,
        isRoomReady: true,
      },
    });

    // Helper to get unique room numbers matching a condition
    const getRoomsByCondition = (predicate: (i: any) => boolean) => {
      const filtered = allActiveIssues.filter(predicate);
      return Array.from(new Set(filtered.map((i) => i.roomNumber))).filter(Boolean);
    };

    // 1. عطل كهرباء
    const electricityRooms = getRoomsByCondition((i) =>
      i.department === "الكهرباء" ||
      i.mainType?.includes("كهربا") ||
      i.description?.includes("كهربا") ||
      i.description?.includes("إضاءة") ||
      i.description?.includes("فيش") ||
      i.description?.includes("مفتاح")
    );

    // 2. نقص مطبخ ومستلزمات
    const kitchenRooms = getRoomsByCondition((i) =>
      i.department === "المستلزمات والنواقص" ||
      i.mainType?.includes("مطبخ") ||
      i.description?.includes("مطبخ") ||
      i.description?.includes("نقص") ||
      i.description?.includes("مستلزم") ||
      i.description?.includes("غلاية") ||
      i.description?.includes("ميكرويف") ||
      i.description?.includes("شاي") ||
      i.description?.includes("أكواب")
    );

    // 3. عطل سباكة
    const plumbingRooms = getRoomsByCondition((i) =>
      i.department === "السباكة" ||
      i.mainType?.includes("سباك") ||
      i.description?.includes("تسريب") ||
      i.description?.includes("ماء") ||
      i.description?.includes("مغسلة") ||
      i.description?.includes("مرحاض") ||
      i.description?.includes("صنبور") ||
      i.description?.includes("دش")
    );

    // 4. عطل تكييف
    const acRooms = getRoomsByCondition((i) =>
      i.department === "التكييف" ||
      i.mainType?.includes("تكييف") ||
      i.description?.includes("مكيف") ||
      i.description?.includes("تبريد") ||
      i.description?.includes("ريموت") ||
      i.description?.includes("حرارة")
    );

    // 5. نظافة عميقة
    const cleaningRooms = getRoomsByCondition((i) =>
      i.department === "النظافة" ||
      i.mainType?.includes("نظافة") ||
      i.description?.includes("تنظيف") ||
      i.description?.includes("غسيل") ||
      i.description?.includes("بقع") ||
      i.description?.includes("روائح")
    );

    // 6. تلف أثاث وديكور
    const furnitureRooms = getRoomsByCondition((i) =>
      i.department === "الأثاث والتأثيث" ||
      i.mainType?.includes("أثاث") ||
      i.description?.includes("كنب") ||
      i.description?.includes("سرير") ||
      i.description?.includes("طاولة") ||
      i.description?.includes("ستارة") ||
      i.description?.includes("تلف") ||
      i.description?.includes("كسر")
    );

    // 7. سلامة وأمان
    const safetyRooms = getRoomsByCondition((i) =>
      i.department === "السلامة والأمان" ||
      i.mainType?.includes("سلامة") ||
      i.description?.includes("قفل") ||
      i.description?.includes("دخان") ||
      i.description?.includes("طفاي")
    );

    // Categories summary table array
    const categoriesSummary = [
      {
        id: "electricity",
        title: "عدد الشقق التي فيها عطل كهرباء",
        department: "الكهرباء",
        count: electricityRooms.length,
        percentage: totalApartments > 0 ? Math.round((electricityRooms.length / totalApartments) * 100) : 0,
        rooms: electricityRooms,
        icon: "Zap",
        color: "amber",
        priority: "عالية",
        actionNeeded: "إرسال فني كهرباء للتمديدات والأفياش والإضاءة",
      },
      {
        id: "kitchen",
        title: "عدد الشقق التي فيها نقص مطبخ ومستلزمات",
        department: "المستلزمات والنواقص",
        count: kitchenRooms.length,
        percentage: totalApartments > 0 ? Math.round((kitchenRooms.length / totalApartments) * 100) : 0,
        rooms: kitchenRooms,
        icon: "Utensils",
        color: "emerald",
        priority: "متوسطة",
        actionNeeded: "تأمين أدوات الطهي وغلايات وضيافة ومستلزمات المطبخ",
      },
      {
        id: "plumbing",
        title: "عدد الشقق التي فيها عطل سباكة",
        department: "السباكة",
        count: plumbingRooms.length,
        percentage: totalApartments > 0 ? Math.round((plumbingRooms.length / totalApartments) * 100) : 0,
        rooms: plumbingRooms,
        icon: "Droplets",
        color: "blue",
        priority: "حرجة",
        actionNeeded: "معالجة فورية لتسريبات المياه والمغاسل ودورات المياه",
      },
      {
        id: "ac",
        title: "عدد الشقق التي فيها عطل تكييف",
        department: "التكييف",
        count: acRooms.length,
        percentage: totalApartments > 0 ? Math.round((acRooms.length / totalApartments) * 100) : 0,
        rooms: acRooms,
        icon: "Wind",
        color: "sky",
        priority: "حرجة",
        actionNeeded: "فحص غاز التبريد وتنظيف الفلاتر وضبط الثرموستات",
      },
      {
        id: "cleaning",
        title: "عدد الشقق التي تحتاج نظافة عميقة",
        department: "النظافة",
        count: cleaningRooms.length,
        percentage: totalApartments > 0 ? Math.round((cleaningRooms.length / totalApartments) * 100) : 0,
        rooms: cleaningRooms,
        icon: "Sparkles",
        color: "purple",
        priority: "متوسطة",
        actionNeeded: "توجيه فريق الـ Housekeeping لتعقيم وتنظيف الوحدة",
      },
      {
        id: "furniture",
        title: "عدد الشقق التي فيها تلف أثاث وديكور",
        department: "الأثاث والتأثيث",
        count: furnitureRooms.length,
        percentage: totalApartments > 0 ? Math.round((furnitureRooms.length / totalApartments) * 100) : 0,
        rooms: furnitureRooms,
        icon: "Armchair",
        color: "orange",
        priority: "متوسطة",
        actionNeeded: "صيانة النجارة وتنجيد الأثاث واستبدال القطع التالفة",
      },
      {
        id: "safety",
        title: "عدد الشقق التي فيها متطلبات أمان وسلامة",
        department: "السلامة والأمان",
        count: safetyRooms.length,
        percentage: totalApartments > 0 ? Math.round((safetyRooms.length / totalApartments) * 100) : 0,
        rooms: safetyRooms,
        icon: "ShieldAlert",
        color: "rose",
        priority: "حرجة",
        actionNeeded: "فحص أقفال الأبواب الإلكترونية وكواشف الدخان",
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        branchName,
        totalApartments,
        readyApartments,
        blockedApartments: blockedRoomNumbers.length,
        blockedRoomNumbers,
        readinessRate,
        totalActiveIssues: allActiveIssues.length,
        categoriesSummary,
        rawCounts: {
          electricityCount: electricityRooms.length,
          kitchenShortageCount: kitchenRooms.length,
          plumbingCount: plumbingRooms.length,
          acCount: acRooms.length,
          cleaningCount: cleaningRooms.length,
          furnitureCount: furnitureRooms.length,
          safetyCount: safetyRooms.length,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
