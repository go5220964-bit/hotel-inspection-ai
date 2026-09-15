import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const department = searchParams.get("department");
    const roomNumber = searchParams.get("roomNumber");
    const status = searchParams.get("status");

    const where: any = {};
    if (branchId && branchId !== "all") where.branchId = branchId;
    if (department && department !== "الكل") where.department = department;
    if (roomNumber && roomNumber !== "all") where.roomNumber = roomNumber;
    if (status && status !== "الكل") where.status = status;

    const issues = await prisma.issue.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        apartment: {
          include: {
            building: true,
            floor: true,
          },
        },
        inspection: {
          include: {
            attachments: true,
          },
        },
        attachments: true,
      },
    });

    // Compute stats
    let totalPhotosCount = 0;
    issues.forEach((iss) => {
      const directPhotos = iss.attachments?.length || 0;
      const inspPhotos = iss.inspection?.attachments?.length || 0;
      totalPhotosCount += directPhotos + inspPhotos;
    });

    return NextResponse.json({
      success: true,
      data: {
        issues,
        totalIssues: issues.length,
        totalPhotosCount,
        criticalCount: issues.filter((i) => i.priority === "حرجة" || i.priority === "عالية").length,
        unreadyCount: issues.filter((i) => !i.isRoomReady).length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
