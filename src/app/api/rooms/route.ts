import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const isReady = searchParams.get("isReady");
    const building = searchParams.get("building");

    const where: any = {};
    if (isReady !== null && isReady !== undefined && isReady !== "") {
      where.isReady = isReady === "true";
    }
    if (building && building !== "الكل") {
      where.building = { name: { contains: building } };
    }

    const rooms = await prisma.apartment.findMany({
      where,
      orderBy: { number: "asc" },
      include: {
        building: true,
        floor: true,
        issues: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const enriched = rooms.map((r) => {
      const openIssues = r.issues.filter((i) => !["مكتمل", "مغلق", "مرفوض"].includes(i.status));
      const criticalCount = openIssues.filter((i) => i.priority === "حرجة").length;
      return {
        ...r,
        totalIssuesCount: r.issues.length,
        openIssuesCount: openIssues.length,
        criticalCount,
      };
    });

    return NextResponse.json({ success: true, count: enriched.length, data: enriched });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}