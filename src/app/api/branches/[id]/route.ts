import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const branch = await prisma.branch.findUnique({
      where: { id: params.id },
      include: {
        buildings: { include: { apartments: true } },
        _count: { select: { apartments: true, issues: true } },
      },
    });

    if (!branch) {
      return NextResponse.json({ success: false, error: "الفرع غير موجود" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: branch });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { name, code, city, address, phone, managerName, status } = body;

    const updated = await prisma.branch.update({
      where: { id: params.id },
      data: {
        name,
        code,
        city,
        address,
        phone,
        managerName,
        status,
      },
    });

    await prisma.auditLog.create({
      data: {
        entityType: "Branch",
        entityId: params.id,
        action: "UPDATE_BRANCH",
        performedBy: "مدير النظام",
        details: `تم تحديث بيانات الفرع: ${updated.name}`,
        branchId: params.id,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const branch = await prisma.branch.findUnique({ where: { id: params.id } });
    if (!branch) {
      return NextResponse.json({ success: false, error: "الفرع غير موجود" }, { status: 404 });
    }

    await prisma.branch.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: `تم حذف الفرع ${branch.name} بنجاح` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}