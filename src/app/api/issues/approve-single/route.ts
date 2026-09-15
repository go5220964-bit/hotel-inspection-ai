import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { issue, branchId, supervisorName, attachments } = body;

    if (!issue || !issue.roomNumber || !issue.description) {
      return NextResponse.json(
        { success: false, error: "بيانات البلاغ غير مكتملة (رقم الشقة ووصف العطل مطلوبان)" },
        { status: 400 }
      );
    }

    const roomNumber = String(issue.roomNumber).trim();
    const activeBranchId = branchId && branchId !== "all" ? branchId : null;

    // 1. Find or create apartment
    let apartment = await prisma.apartment.findFirst({
      where: {
        number: roomNumber,
        ...(activeBranchId ? { branchId: activeBranchId } : {}),
      },
    });

    if (!apartment) {
      apartment = await prisma.apartment.create({
        data: {
          number: roomNumber,
          branchId: activeBranchId,
          type: "غرفة فندقية",
          isReady: issue.isRoomReady !== false,
          notes: `تم إنشاؤها تلقائياً أثناء جولة التفتيش الذكية من المبنى ${issue.building || "الرئيسي"}`,
        },
      });
    } else {
      // If issue prevents room readiness, mark apartment unready
      if (issue.isRoomReady === false) {
        await prisma.apartment.update({
          where: { id: apartment.id },
          data: {
            isReady: false,
            lastInspectionDate: new Date(),
          },
        });
      }
    }

    // 2. Compute SLA Deadline
    const slaHours = issue.estimatedSlaHours || (issue.priority === "حرجة" ? 4 : issue.priority === "عالية" ? 12 : 24);
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + slaHours);

    // 3. Create the issue in PostgreSQL
    const createdIssue = await prisma.issue.create({
      data: {
        roomNumber,
        building: issue.building || null,
        floor: issue.floor || (roomNumber.length >= 3 ? roomNumber.slice(0, 1) : null),
        area: issue.area || "عام",
        description: issue.description,
        department: issue.department || "الصيانة",
        mainType: issue.mainType || issue.department || "صيانة عامة",
        subType: issue.subType || null,
        needType: issue.needType || "صيانة فورية",
        priority: issue.priority || "متوسطة",
        status: "معتمد",
        recommendedAction: issue.recommendedAction || null,
        isRoomReady: issue.isRoomReady !== false,
        isRecurring: issue.isRecurring || false,
        estimatedSlaHours: slaHours,
        slaDeadline: deadline,
        branchId: activeBranchId,
        apartmentId: apartment.id,
      },
    });

    // 4. Save any attachments linked to this issue
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      for (const att of attachments) {
        await prisma.attachment.create({
          data: {
            fileName: att.fileName || "صورة_معاينة",
            fileUrl: att.fileUrl || att.previewUrl || "/uploads/placeholder",
            fileType: "image",
            mimeType: att.mimeType || "image/jpeg",
            issueId: createdIssue.id,
          },
        });
      }
    }

    // 5. Create Audit Log
    await prisma.auditLog.create({
      data: {
        entityType: "Issue",
        entityId: createdIssue.id,
        action: "APPROVE_FROM_CHAT",
        performedBy: supervisorName || "مشرف الجولة الميدانية",
        details: `تم اعتماد بلاغ فوري للشقة ${roomNumber}: ${createdIssue.description} (${createdIssue.department} - أولوية: ${createdIssue.priority})`,
        branchId: activeBranchId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم حفظ واعتماد البلاغ بنجاح في قاعدة البيانات",
      data: createdIssue,
    });
  } catch (error: any) {
    console.error("خطأ في حفظ البلاغ:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
