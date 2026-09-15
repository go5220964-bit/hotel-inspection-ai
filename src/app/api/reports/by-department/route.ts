import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get("branchId");
    const department = searchParams.get("department") || "الكهرباء";

    const branchFilter = branchId && branchId !== "all" ? { branchId } : {};

    // Get all standard departments list
    const standardDepts = [
      "الكهرباء",
      "التكييف",
      "السباكة",
      "المستلزمات والنواقص",
      "النظافة",
      "الأثاث والتأثيث",
      "السلامة والأمان",
      "الأجهزة والمعدات",
    ];

    // Compute department stats for all departments in this branch
    const allBranchIssues = await prisma.issue.findMany({
      where: {
        ...branchFilter,
        status: { notIn: ["مكتمل", "مغلق"] },
      },
      select: {
        id: true,
        department: true,
        roomNumber: true,
        priority: true,
      },
    });

    // Helper for department query conditions
    const getDepartmentFilterCondition = (dept: string) => {
      if (dept === "الكل") return {};
      if (dept === "الكهرباء") {
        return {
          OR: [
            { department: "الكهرباء" },
            { mainType: { contains: "كهربا" } },
            { description: { contains: "كهربا" } },
            { description: { contains: "إضاءة" } },
            { description: { contains: "فيش" } },
          ],
        };
      }
      if (dept === "السباكة") {
        return {
          OR: [
            { department: "السباكة" },
            { mainType: { contains: "سباك" } },
            { description: { contains: "تسريب" } },
            { description: { contains: "ماء" } },
            { description: { contains: "مغسلة" } },
          ],
        };
      }
      if (dept === "التكييف") {
        return {
          OR: [
            { department: "التكييف" },
            { mainType: { contains: "تكييف" } },
            { description: { contains: "مكيف" } },
            { description: { contains: "تبريد" } },
          ],
        };
      }
      if (dept === "المستلزمات والنواقص") {
        return {
          OR: [
            { department: "المستلزمات والنواقص" },
            { department: "المستودع" },
            { mainType: { contains: "مطبخ" } },
            { mainType: { contains: "نواقص" } },
            { description: { contains: "مطبخ" } },
            { description: { contains: "غلاية" } },
            { description: { contains: "نقص" } },
          ],
        };
      }
      if (dept === "النظافة") {
        return {
          OR: [
            { department: "النظافة" },
            { department: "التدبير الفندقي" },
            { mainType: { contains: "نظافة" } },
            { description: { contains: "تنظيف" } },
            { description: { contains: "غسيل" } },
          ],
        };
      }
      return { department: dept };
    };

    // Compute dynamic departments list from database
    const allUniqueDepts = Array.from(new Set(allBranchIssues.map((i) => i.department).filter(Boolean)));
    const combinedDeptNames = Array.from(new Set([...standardDepts, ...allUniqueDepts]));

    const departmentList = combinedDeptNames.map((name) => {
      // Calculate how many issues match this department
      let matchingIssues = allBranchIssues.filter((i) => i.department === name);
      if (matchingIssues.length === 0) {
        if (name === "الكهرباء") matchingIssues = allBranchIssues.filter((i) => i.department?.includes("كهربا") || i.department === "الصيانة");
        else if (name === "المستلزمات والنواقص") matchingIssues = allBranchIssues.filter((i) => i.department === "المستودع");
        else if (name === "النظافة") matchingIssues = allBranchIssues.filter((i) => i.department === "التدبير الفندقي");
      }

      const aptsSet = new Set(matchingIssues.map((i) => i.roomNumber).filter(Boolean));
      const critCount = matchingIssues.filter((i) => i.priority === "حرجة" || i.priority === "عالية").length;

      return {
        name,
        totalIssues: matchingIssues.length,
        apartmentsCount: aptsSet.size,
        criticalCount: critCount,
      };
    }).sort((a, b) => b.totalIssues - a.totalIssues);

    // Now fetch specific issues for the selected department
    const issuesWhere: any = {
      ...branchFilter,
      ...getDepartmentFilterCondition(department),
    };

    const issues = await prisma.issue.findMany({
      where: issuesWhere,
      orderBy: [{ roomNumber: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
      include: {
        apartment: {
          include: {
            floor: true,
            building: true,
          },
        },
        inspection: true,
        attachments: true,
      },
    });

    // Group issues by apartment
    const apartmentsMap: Record<string, {
      apartment: any;
      roomNumber: string;
      issues: any[];
      isRoomReady: boolean;
      highestPriority: string;
      hasOverdue: boolean;
    }> = {};

    issues.forEach((iss) => {
      const rm = iss.roomNumber || "غير محدد";
      if (!apartmentsMap[rm]) {
        apartmentsMap[rm] = {
          apartment: iss.apartment,
          roomNumber: rm,
          issues: [],
          isRoomReady: iss.isRoomReady,
          highestPriority: iss.priority,
          hasOverdue: false,
        };
      }

      apartmentsMap[rm].issues.push(iss);
      if (!iss.isRoomReady) apartmentsMap[rm].isRoomReady = false;

      const isOverdue = iss.slaDeadline && new Date(iss.slaDeadline) < new Date() && !["مكتمل", "مغلق"].includes(iss.status);
      if (isOverdue) apartmentsMap[rm].hasOverdue = true;
    });

    const affectedApartments = Object.values(apartmentsMap);

    return NextResponse.json({
      success: true,
      data: {
        selectedDepartment: department,
        departmentList,
        affectedApartments,
        totalIssues: issues.length,
        totalApartmentsAffected: affectedApartments.length,
        criticalIssuesCount: issues.filter((i) => i.priority === "حرجة" || i.priority === "عالية").length,
        overdueCount: issues.filter((i) => i.slaDeadline && new Date(i.slaDeadline) < new Date() && !["مكتمل", "مغلق"].includes(i.status)).length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
