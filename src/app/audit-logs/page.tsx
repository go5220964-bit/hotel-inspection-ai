import prisma from "@/lib/prisma";
import { History, ShieldAlert, FileText, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <History className="w-7 h-7 text-amber-500" />
            <span>سجل التعديلات والتدقيق (Audit Trail)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            توثيق تاريخي آمن لكل عملية إنشاء، تعديل، اعتماد، أو إغلاق بلاغ في النظام لضمان الامتثال والجودة
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">لا توجد سجلات تدقيق حتى الآن.</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 transition">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px] font-bold">
                    {log.action}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    الكيان: {log.entityType} #{log.entityId.slice(-6)}
                  </span>
                  <span className="text-xs text-amber-600 font-medium">بواسطة: {log.performedBy}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{log.details}</p>
              </div>

              <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap self-start sm:self-auto">
                {new Date(log.createdAt).toLocaleTimeString("ar-SA")} - {new Date(log.createdAt).toLocaleDateString("ar-SA")}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}