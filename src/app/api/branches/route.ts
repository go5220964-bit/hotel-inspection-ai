import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        buildings: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: {
            apartments: true,
            issues: true,
            inspections: true,
          },
        },
      },
    });

    const enriched = await Promise.all(
      branches.map(async (b) => {
        const unreadyCount = await prisma.apartment.count({
          where: { branchId: b.id, isReady: false },
        });
        const openIssuesCount = await prisma.issue.count({
          where: { branchId: b.id, status: { notIn: ["مكتمل", "مغلق", "مرفوض"] } },
        });

        return {
          ...b,
          apartmentsCount: b._count.apartments,
          issuesCount: b._count.issues,
          openIssuesCount,
          unreadyCount,
        };
      })
    );

    return NextResponse.json({ success: true, count: enriched.length, data: enriched });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, code, city, address, phone, managerName } = body;

    if (!name || !code) {
      return NextResponse.json({ success: false, error: "اسم الفرع والرمز مطلوبان" }, { status: 400 });
    }

    const existing = await prisma.branch.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ success: false, error: "رمز الفرع مستخدم مسبقاً، يرجى اختيار رمز آخر" }, { status: 400 });
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        code,
        city: city || null,
        address: address || null,
        phone: phone || null,
        managerName: managerName || null,
        status: "ACTIVE",
      },
    });

    await prisma.auditLog.create({
      data: {
        entityType: "Branch",
        entityId: branch.id,
        action: "CREATE_BRANCH",
        performedBy: "مدير النظام",
        details: `تم إنشاء فرع جديد: ${branch.name} (${branch.code}) في مدينة ${branch.city || ""}`,
        branchId: branch.id,
      },
    });

    return NextResponse.json({ success: true, data: branch });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}