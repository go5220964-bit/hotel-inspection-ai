import prisma from "@/lib/prisma";
import { Building2, Users, Mail, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
  });

  const issues = await prisma.issue.findMany({
    select: {
      department: true,
      status: true,
      priority: true,
    },
  });

  const deptStats = departments.map((d) => {
    const deptIssues = issues.filter((i) => i.department === d.name);
    const openCount = deptIssues.filter((i) => !["مكتمل", "مغلق", "مرفوض"].includes(i.status)).length;
    const closedCount = deptIssues.filter((i) => ["مكتمل", "مغلق"].includes(i.status)).length;
    const criticalCount = deptIssues.filter((i) => i.priority === "حرجة" && !["مكتمل", "مغلق"].includes(i.status)).length;

    return {
      ...d,
      totalIssues: deptIssues.length,
      openCount,
      closedCount,
      criticalCount,
    };
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-amber-500" />
            <span>الأقسام التشغيلية والمسؤولين</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة فرق العمل الفندقية، اتفاقيات مستوى الخدمة (SLA)، وتوزيع البلاغات اللحظي
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deptStats.map((dept) => (
          <div key={dept.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{dept.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                {dept.code || "DEPT"}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <span>المسؤول: <strong>{dept.managerName || "غير محدد"}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>البريد: <span className="font-mono">{dept.managerEmail || "info@hotel.com"}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>اتفاقية الـ SLA الافتراضية: <strong>{dept.slaHoursDefault} ساعة</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="block text-slate-400 text-[10px]">إجمالي البلاغات</span>
                <span className="text-base font-black text-slate-900">{dept.totalIssues}</span>
              </div>
              <div className="bg-amber-50 p-2 rounded-lg border border-amber-100">
                <span className="block text-amber-600 text-[10px]">المفتوحة</span>
                <span className="text-base font-black text-amber-700">{dept.openCount}</span>
              </div>
              <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                <span className="block text-emerald-600 text-[10px]">المغلقة</span>
                <span className="text-base font-black text-emerald-700">{dept.closedCount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}