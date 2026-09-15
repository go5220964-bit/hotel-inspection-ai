import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department");
    const mainType = searchParams.get("mainType");
    const needType = searchParams.get("needType");
    const priority = searchParams.get("priority");
    const status = searchParams.get("status");
    const roomNumber = searchParams.get("roomNumber");
    const isRoomReady = searchParams.get("isRoomReady");
    const search = searchParams.get("search");

    const where: any = {};

    if (department && department !== "الكل") where.department = department;
    if (mainType && mainType !== "الكل") where.mainType = mainType;
    if (needType && needType !== "الكل") where.needType = needType;
    if (priority && priority !== "الكل") where.priority = priority;
    if (status && status !== "الكل") where.status = status;
    if (roomNumber) where.roomNumber = roomNumber;
    if (isRoomReady !== null && isRoomReady !== undefined && isRoomReady !== "") {
      where.isRoomReady = isRoomReady === "true";
    }

    if (search && search.trim()) {
      where.OR = [
        { description: { contains: search.trim(), mode: "insensitive" } },
        { roomNumber: { contains: search.trim(), mode: "insensitive" } },
        { area: { contains: search.trim(), mode: "insensitive" } },
        { recommendedAction: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const issues = await prisma.issue.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        apartment: true,
        attachments: true,
        inspection: {
          select: {
            id: true,
            supervisorName: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, count: issues.length, data: issues });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}