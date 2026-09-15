import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const totalApartments = await prisma.apartment.count();
    const readyApartments = await prisma.apartment.count({ where: { isReady: true } });
    const unreadyApartments = totalApartments - readyApartments;

    const apartmentsWithInspections = await prisma.apartment.count({
      where: { lastInspectionDate: { not: null } },
    });

    const totalIssues = await prisma.issue.count();
    const criticalIssues = await prisma.issue.count({ where: { priority: "حرجة" } });
    const highIssues = await prisma.issue.count({ where: { priority: "عالية" } });
    const openIssues = await prisma.issue.count({
      where: { status: { notIn: ["مكتمل", "مغلق", "مرفوض"] } },
    });
    const closedIssues = await prisma.issue.count({
      where: { status: { in: ["مكتمل", "مغلق"] } },
    });

    // المشاكل المتأخرة عن الـ SLA
    const now = new Date();
    const overdueIssues = await prisma.issue.count({
      where: {
        slaDeadline: { lt: now },
        status: { notIn: ["مكتمل", "مغلق", "مرفوض"] },
      },
    });

    // توزيع المشاكل حسب النوع
    const allIssues = await prisma.issue.findMany({
      select: { mainType: true, department: true, roomNumber: true, priority: true },
    });

    const issuesByType: Record<string, number> = {};
    const issuesByDept: Record<string, number> = {};
    const roomIssuesCount: Record<string, number> = {};

    for (const iss of allIssues) {
      issuesByType[iss.mainType] = (issuesByType[iss.mainType] || 0) + 1;
      issuesByDept[iss.department] = (issuesByDept[iss.department] || 0) + 1;
      roomIssuesCount[iss.roomNumber] = (roomIssuesCount[iss.roomNumber] || 0) + 1;
    }

    // أعلى خمس شقق احتياجاً
    const top5Rooms = Object.entries(roomIssuesCount)
      .map(([roomNumber, count]) => ({ roomNumber, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // أهم التوصيات الإدارية الذكية
    const recommendations = [];
    if (unreadyApartments > 0) {
      recommendations.push(`إعطاء أولوية قصوى للشقق غير الجاهزة (${unreadyApartments} شقة) لتسريع تسليمها للنزلاء وزيادة نسبة الإشغال.`);
    }
    if (criticalIssues > 0) {
      recommendations.push(`توجيه فرق الصيانة والأمن لمعالجة ${criticalIssues} بلاغ حرج وفوري يمس سلامة الضيوف.`);
    }
    const maxType = Object.entries(issuesByType).sort((a, b) => b[1] - a[1])[0];
    if (maxType) {
      recommendations.push(`التركيز على قطاع "${maxType[0]}" كأكثر أنواع المشاكل رصداً (${maxType[1]} بلاغ)، وتوفير قطع الغيار مسبقاً بالمستودع.`);
    }
    recommendations.push("الاستمرار في جولات التفتيش اليومية عبر تطبيق الذكاء الاصطناعي لضمان الحفاظ على المعايير الفندقية الخمس نجوم.");

    return NextResponse.json({
      success: true,
      data: {
        period: "الشهر الحالي - سبتمبر 2026",
        totalApartments,
        apartmentsWithInspections: apartmentsWithInspections || totalApartments,
        readyApartments,
        unreadyApartments,
        readinessPercentage: totalApartments > 0 ? Math.round((readyApartments / totalApartments) * 100) : 100,
        totalIssues,
        openIssues,
        closedIssues,
        criticalIssues,
        highIssues,
        overdueIssues,
        issuesByType,
        issuesByDept,
        top5Rooms,
        recommendations,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}