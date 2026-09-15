import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { ExcelService } from "@/lib/export/excel.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get("reportType") || "issues";
    const branchId = searchParams.get("branchId");
    const department = searchParams.get("department");
    const roomNumber = searchParams.get("roomNumber");
    const status = searchParams.get("status");

    // Fetch branch info if branchId provided
    let branchName = "كافة الفروع";
    if (branchId && branchId !== "all") {
      const branch = await prisma.branch.findUnique({ where: { id: branchId } });
      if (branch) branchName = branch.name;
    }

    if (reportType === "aggregate") {
      // Build aggregate report
      const branchWhere = branchId && branchId !== "all" ? { branchId } : {};
      const totalApartments = await prisma.apartment.count({ where: branchWhere });
      const readyApartments = await prisma.apartment.count({ where: { ...branchWhere, isReady: true } });
      const blockedApts = await prisma.apartment.findMany({
        where: { ...branchWhere, isReady: false },
        select: { number: true },
      });
      const blockedApartments = blockedApts.length;
      const blockedRoomNumbers = blockedApts.map((a) => a.number);
      const readinessRate = totalApartments > 0 ? Math.round((readyApartments / totalApartments) * 100) : 100;

      const activeIssuesWhere = {
        ...branchWhere,
        status: { notIn: ["مكتمل", "مغلق"] },
      };

      const electricityIssues = await prisma.issue.findMany({
        where: {
          ...activeIssuesWhere,
          OR: [{ department: "الكهرباء" }, { mainType: { contains: "كهربا" } }, { description: { contains: "كهربا" } }],
        },
        select: { roomNumber: true },
      });
      const electricityRooms = Array.from(new Set(electricityIssues.map((i) => i.roomNumber)));

      const kitchenIssues = await prisma.issue.findMany({
        where: {
          ...activeIssuesWhere,
          OR: [
            { department: "المستلزمات والنواقص" },
            { mainType: { contains: "مطبخ" } },
            { description: { contains: "مطبخ" } },
            { description: { contains: "نقص" } },
          ],
        },
        select: { roomNumber: true },
      });
      const kitchenRooms = Array.from(new Set(kitchenIssues.map((i) => i.roomNumber)));

      const plumbingIssues = await prisma.issue.findMany({
        where: {
          ...activeIssuesWhere,
          OR: [{ department: "السباكة" }, { mainType: { contains: "سباك" } }, { description: { contains: "تسريب" } }],
        },
        select: { roomNumber: true },
      });
      const plumbingRooms = Array.from(new Set(plumbingIssues.map((i) => i.roomNumber)));

      const acIssues = await prisma.issue.findMany({
        where: {
          ...activeIssuesWhere,
          OR: [{ department: "التكييف" }, { mainType: { contains: "تكييف" } }, { description: { contains: "مكيف" } }, { description: { contains: "تبريد" } }],
        },
        select: { roomNumber: true },
      });
      const acRooms = Array.from(new Set(acIssues.map((i) => i.roomNumber)));

      const cleaningIssues = await prisma.issue.findMany({
        where: {
          ...activeIssuesWhere,
          OR: [{ department: "النظافة" }, { mainType: { contains: "نظافة" } }, { description: { contains: "تنظيف" } }],
        },
        select: { roomNumber: true },
      });
      const cleaningRooms = Array.from(new Set(cleaningIssues.map((i) => i.roomNumber)));

      const furnitureIssues = await prisma.issue.findMany({
        where: {
          ...activeIssuesWhere,
          OR: [{ department: "الأثاث والتأثيث" }, { mainType: { contains: "أثاث" } }, { description: { contains: "كسر" } }, { description: { contains: "تلف" } }],
        },
        select: { roomNumber: true },
      });
      const furnitureRooms = Array.from(new Set(furnitureIssues.map((i) => i.roomNumber)));

      const excelBuffer = ExcelService.generateAggregateWorkbook({
        branchName,
        totalApartments,
        readyApartments,
        blockedApartments,
        blockedRoomNumbers,
        readinessRate,
        electricityCount: electricityRooms.length,
        electricityRooms,
        kitchenShortageCount: kitchenRooms.length,
        kitchenRooms,
        plumbingCount: plumbingRooms.length,
        plumbingRooms,
        acCount: acRooms.length,
        acRooms,
        cleaningCount: cleaningRooms.length,
        cleaningRooms,
        furnitureCount: furnitureRooms.length,
        furnitureRooms,
      });

      return new NextResponse(new Uint8Array(excelBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="aggregate_counts_report_${Date.now()}.xlsx"`,
        },
      });
    }

    // Default or filtered issues
    const where: any = {};
    if (branchId && branchId !== "all") where.branchId = branchId;
    if (roomNumber && roomNumber !== "all") where.roomNumber = roomNumber;
    if (department && department !== "الكل") where.department = department;
    if (status && status !== "الكل") where.status = status;

    const issues = await prisma.issue.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        apartment: true,
        inspection: true,
        attachments: true,
      },
    });

    let excelBuffer: Buffer;
    let filename = `hotel_report_${Date.now()}.xlsx`;

    if (reportType === "visual") {
      excelBuffer = ExcelService.generateVisualReportWorkbook(issues, branchName);
      filename = `visual_inspection_report_${Date.now()}.xlsx`;
    } else if (reportType === "room") {
      excelBuffer = ExcelService.generateIssuesWorkbook(issues, `تقرير شقة ${roomNumber || "شامل"}`);
      filename = `room_${roomNumber || "all"}_issues_${Date.now()}.xlsx`;
    } else if (reportType === "department") {
      excelBuffer = ExcelService.generateIssuesWorkbook(issues, `تقرير قسم ${department || "شامل"}`);
      filename = `dept_${department || "all"}_issues_${Date.now()}.xlsx`;
    } else {
      excelBuffer = ExcelService.generateIssuesWorkbook(issues);
    }

    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}