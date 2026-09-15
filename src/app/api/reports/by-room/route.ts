import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const roomNumber = searchParams.get("roomNumber");

    const branchFilter = branchId && branchId !== "all" ? { branchId } : {};

    // Get all apartments for this branch (for filter dropdown)
    const apartments = await prisma.apartment.findMany({
      where: branchFilter,
      orderBy: { number: "asc" },
      include: {
        _count: {
          select: {
            issues: true,
          },
        },
      },
    });

    // If specific room number is requested
    if (roomNumber && roomNumber !== "all") {
      const apartment = await prisma.apartment.findFirst({
        where: {
          ...branchFilter,
          number: roomNumber,
        },
        include: {
          branch: true,
          floor: true,
          building: true,
        },
      });

      const issues = await prisma.issue.findMany({
        where: {
          ...branchFilter,
          roomNumber,
        },
        orderBy: { createdAt: "desc" },
        include: {
          inspection: true,
          attachments: true,
        },
      });

      const totalCount = issues.length;
      const openCount = issues.filter((i) => !["مكتمل", "مغلق"].includes(i.status)).length;
      const closedCount = issues.filter((i) => ["مكتمل", "مغلق"].includes(i.status)).length;
      const criticalCount = issues.filter((i) => i.priority === "حرجة" || i.priority === "عالية").length;
      const recurringCount = issues.filter((i) => i.isRecurring).length;

      return NextResponse.json({
        success: true,
        data: {
          apartment,
          apartmentsList: apartments,
          issues,
          metrics: {
            totalCount,
            openCount,
            closedCount,
            criticalCount,
            recurringCount,
            isReady: apartment ? apartment.isReady : true,
          },
        },
      });
    }

    // If "all" rooms or no specific room requested, group issues by apartment
    const allIssues = await prisma.issue.findMany({
      where: branchFilter,
      orderBy: [{ roomNumber: "asc" }, { createdAt: "desc" }],
      include: {
        apartment: true,
        inspection: true,
        attachments: true,
      },
    });

    // Group issues by roomNumber
    const groupedByRoom: Record<string, any[]> = {};
    allIssues.forEach((issue) => {
      const rm = issue.roomNumber || "غير محدد";
      if (!groupedByRoom[rm]) groupedByRoom[rm] = [];
      groupedByRoom[rm].push(issue);
    });

    return NextResponse.json({
      success: true,
      data: {
        apartment: null,
        apartmentsList: apartments,
        issues: allIssues,
        groupedByRoom,
        metrics: {
          totalApartments: apartments.length,
          apartmentsWithIssues: Object.keys(groupedByRoom).length,
          totalIssues: allIssues.length,
          openIssues: allIssues.filter((i) => !["مكتمل", "مغلق"].includes(i.status)).length,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
