import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sortBy = searchParams.get("sortBy") || "roomNumber"; // roomNumber, mainType, department, priority, status

    const allIssues = await prisma.issue.findMany({
      include: {
        apartment: {
          include: { building: true, floor: true },
        },
        attachments: true,
      },
    });

    const now = new Date();

    // فرز البلاغات وفق المعيار المطلوب
    const sortedIssues = [...allIssues].sort((a, b) => {
      if (sortBy === "roomNumber") {
        return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
      }
      if (sortBy === "priority") {
        const order: Record<string, number> = { "حرجة": 0, "عالية": 1, "متوسطة": 2, "منخفضة": 3 };
        return (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
      }
      if (sortBy === "department") {
        return a.department.localeCompare(b.department);
      }
      if (sortBy === "mainType") {
        return a.mainType.localeCompare(b.mainType);
      }
      if (sortBy === "status") {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });

    // دالة مساعدة لتجميع وتلخيص القسم
    const buildSection = (title: string, categoryKey: string, filterFn: (iss: any) => boolean) => {
      const items = sortedIssues.filter(filterFn);
      const uniqueRooms = Array.from(new Set(items.map((i) => i.roomNumber)));

      return {
        key: categoryKey,
        title,
        roomsCount: uniqueRooms.length,
        issuesCount: items.length,
        rooms: uniqueRooms,
        issues: items,
      };
    };

    // الأقسام الـ 11 المحددة بدقة:
    const sections = [
      buildSection("1. جميع الشقق التي تعاني من مشاكل الكهرباء", "electricity", (i) => i.mainType === "كهرباء"),
      buildSection("2. جميع الشقق التي تعاني من مشاكل السباكة", "plumbing", (i) => i.mainType === "سباكة"),
      buildSection("3. جميع الشقق التي تحتاج إلى صيانة التكييف", "hvac", (i) => i.mainType === "تكييف"),
      buildSection("4. جميع الشقق التي تحتاج إلى تأثيث", "furnishing", (i) => i.mainType === "تأثيث" || i.needType === "تأثيث"),
      buildSection("5. جميع الشقق التي لديها نواقص مستلزمات", "supplies", (i) => i.mainType === "نقص مستلزمات" || i.needType === "توريد"),
      buildSection("6. جميع الشقق التي تحتاج إلى تنظيف", "cleaning", (i) => i.mainType === "نظافة" || i.needType === "تنظيف"),
      buildSection("7. جميع الشقق التي لديها مشاكل أمن وسلامة", "safety", (i) => i.mainType === "سلامة" || i.department === "الأمن والسلامة"),
      buildSection("8. جميع الشقق التي تحتاج إلى أجهزة ومعدات", "appliances", (i) => i.mainType === "أجهزة"),
      buildSection("9. جميع الشقق غير الجاهزة للتسكين", "unready", (i) => !i.isRoomReady),
      buildSection("10. جميع المشاكل المتأخرة عن وقت الإغلاق (SLA)", "overdue", (i) => i.slaDeadline && new Date(i.slaDeadline) < now && !["مكتمل", "مغلق"].includes(i.status)),
      buildSection("11. جميع المشاكل المتكررة", "recurring", (i) => i.isRecurring),
    ];

    return NextResponse.json({
      success: true,
      totalIssues: allIssues.length,
      sections,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}