import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const issue = await prisma.issue.findUnique({
      where: { id: params.id },
      include: {
        apartment: true,
        attachments: true,
        inspection: true,
      },
    });

    if (!issue) {
      return NextResponse.json({ success: false, error: "البلاغ غير موجود" }, { status: 404 });
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: { entityType: "Issue", entityId: params.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: issue, auditLogs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { status, priority, department, resolutionNotes, resolutionProofUrl, performedBy } = body;

    const existing = await prisma.issue.findUnique({
      where: { id: params.id },
      include: { apartment: true },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "البلاغ غير موجود" }, { status: 404 });
    }

    // التحقق الصارم من متطلب إغلاق البلاغ: لا يغلق دون تسجيل إجراء الإصلاح
    if ((status === "مغلق" || status === "مكتمل") && (!resolutionNotes || resolutionNotes.trim().length === 0)) {
      return NextResponse.json(
        { success: false, error: "لا يمكن إغلاق أو إكمال البلاغ دون تسجيل ملاحظات وإجراءات الإصلاح المنفذة." },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (department) updateData.department = department;

    if (status === "مغلق" || status === "مكتمل") {
      updateData.resolutionNotes = resolutionNotes;
      updateData.resolutionProofUrl = resolutionProofUrl || null;
      updateData.closedAt = new Date();
      updateData.closedByUserId = performedBy || "مسؤول الصيانة";
    }

    const updated = await prisma.issue.update({
      where: { id: params.id },
      data: updateData,
    });

    // تسجيل في AuditLog
    await prisma.auditLog.create({
      data: {
        entityType: "Issue",
        entityId: params.id,
        action: status === "مغلق" || status === "مكتمل" ? "CLOSE_ISSUE" : "UPDATE_ISSUE",
        performedBy: performedBy || "المشرف",
        details: `تم تحديث البلاغ للشقة ${updated.roomNumber}: الحالة (${updated.status}) - ${resolutionNotes ? `إجراء الإصلاح: ${resolutionNotes}` : ""}`,
      },
    });

    // إذا تم إغلاق البلاغ، نفحص هل بقيت أي مشاكل أخرى مفتوحة تمنع جاهزية الشقة؟
    if ((status === "مغلق" || status === "مكتمل") && existing.apartmentId) {
      const remainingUnreadyIssues = await prisma.issue.count({
        where: {
          apartmentId: existing.apartmentId,
          isRoomReady: false,
          status: { notIn: ["مكتمل", "مغلق", "مرفوض"] },
        },
      });

      if (remainingUnreadyIssues === 0) {
        await prisma.apartment.update({
          where: { id: existing.apartmentId },
          data: { isReady: true },
        });
        await prisma.auditLog.create({
          data: {
            entityType: "Apartment",
            entityId: existing.apartmentId,
            action: "ROOM_AUTO_READY",
            performedBy: "النظام",
            details: `تمت استعادة جاهزية الشقة ${existing.roomNumber} للتسكين بعد إغلاق كافة البلاغات الحرجة.`,
          },
        });
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}