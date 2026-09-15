import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { IssueParsed } from "@/lib/schemas/inspection.schema";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { issues, approvedBy } = body as {
      issues: IssueParsed[];
      approvedBy?: string;
    };

    if (!issues || !Array.isArray(issues) || issues.length === 0) {
      return NextResponse.json(
        { success: false, error: "يجب تحديد بلاغ واحد على الأقل للاعتماد" },
        { status: 400 }
      );
    }

    const inspection = await prisma.inspection.findUnique({
      where: { id: params.id },
    });

    if (!inspection) {
      return NextResponse.json(
        { success: false, error: "جولة التفتيش غير موجودة" },
        { status: 404 }
      );
    }

    const createdIssues = [];

    for (const issueData of issues) {
      // 1. البحث عن الشقة برقمها أو ربطها إذا وجدت
      let apartment = await prisma.apartment.findFirst({
        where: {
          number: issueData.roomNumber,
          ...(inspection.branchId ? { branchId: inspection.branchId } : {}),
        },
      });

      // إذا لم تكن الشقة موجودة في قاعدة البيانات، ننشئها تلقائياً لضمان عدم توقف العمل
      if (!apartment) {
        apartment = await prisma.apartment.create({
          data: {
            number: issueData.roomNumber,
            branchId: inspection.branchId || null,
            type: "غرفة فندقية",
            isReady: issueData.isRoomReady,
            notes: `تم إنشاؤها تلقائياً أثناء التفتيش من المبنى ${issueData.building || "الرئيسي"}`,
          },
        });
      } else {
        // تحديث جاهزية الشقة وتاريخ آخر تفتيش
        const newIsReady = issueData.isRoomReady === false ? false : apartment.isReady;
        await prisma.apartment.update({
          where: { id: apartment.id },
          data: {
            isReady: newIsReady,
            lastInspectionDate: new Date(),
          },
        });
      }

      // 2. حساب الموعد النهائي لاتفاقية مستوى الخدمة (SLA Deadline)
      const slaHours = issueData.estimatedSlaHours || 24;
      const slaDeadline = new Date();
      slaDeadline.setHours(slaDeadline.getHours() + slaHours);

      // 3. إنشاء البلاغ في PostgreSQL
      const created = await prisma.issue.create({
        data: {
          roomNumber: issueData.roomNumber,
          building: issueData.building || null,
          floor: issueData.floor || null,
          area: issueData.area || null,
          description: issueData.description,
          department: issueData.department,
          mainType: issueData.mainType,
          subType: issueData.subType || null,
          needType: issueData.needType,
          priority: issueData.priority || "متوسطة",
          status: "معتمد", // تم الاعتماد من قبل المشرف
          recommendedAction: issueData.recommendedAction || null,
          isRoomReady: issueData.isRoomReady ?? true,
          isRecurring: issueData.isRecurring ?? false,
          confidence: issueData.confidence ?? 1.0,
          evidenceDescription: issueData.evidenceDescription || null,
          estimatedSlaHours: slaHours,
          slaDeadline,
          apartmentId: apartment.id,
          inspectionId: inspection.id,
        },
      });

      // 4. تسجيل العملية في سجل التدقيق
      await prisma.auditLog.create({
        data: {
          entityType: "Issue",
          entityId: created.id,
          action: "APPROVE_ISSUE",
          performedBy: approvedBy || "مشرف التفتيش",
          details: `تم اعتماد البلاغ وإحالته إلى قسم ${created.department} للشقة ${created.roomNumber}. الأولوية: ${created.priority}`,
        },
      });

      createdIssues.push(created);
    }

    // 5. تحديث حالة الجولة إلى معتمدة
    await prisma.inspection.update({
      where: { id: inspection.id },
      data: {
        status: "APPROVED",
      },
    });

    return NextResponse.json({
      success: true,
      message: `تم اعتماد وتخزين ${createdIssues.length} بلاغ في قاعدة البيانات بنجاح`,
      data: createdIssues,
    });
  } catch (error: any) {
    console.error("خطأ أثناء اعتماد المشاكل:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}