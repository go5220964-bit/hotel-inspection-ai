import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { roomNumber: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const whereClause: any = { number: params.roomNumber };
    if (branchId) whereClause.branchId = branchId;

    const room = await prisma.apartment.findFirst({
      where: whereClause,
      include: {
        building: true,
        floor: true,
        issues: {
          orderBy: { createdAt: "desc" },
          include: {
            attachments: true,
            inspection: {
              select: {
                id: true,
                supervisorName: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ success: false, error: "الشقة غير موجودة" }, { status: 404 });
    }

    const openIssues = room.issues.filter((i) => !["مكتمل", "مغلق", "مرفوض"].includes(i.status));
    const closedIssues = room.issues.filter((i) => ["مكتمل", "مغلق"].includes(i.status));
    const recurringIssues = room.issues.filter((i) => i.isRecurring);

    // تجميع المشاكل حسب النوع
    const issuesByType: Record<string, number> = {};
    for (const iss of room.issues) {
      issuesByType[iss.mainType] = (issuesByType[iss.mainType] || 0) + 1;
    }

    // جلب كل المرفقات المتعلقة بالشقة
    const attachments = room.issues.flatMap((i) => i.attachments);

    // سجل التعديلات للشقة
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { entityType: "Apartment", entityId: room.id },
          { entityType: "Issue", entityId: { in: room.issues.map((i) => i.id) } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...room,
        openIssues,
        closedIssues,
        recurringIssues,
        issuesByType,
        attachments,
        auditLogs,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}