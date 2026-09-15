"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  DoorOpen, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Wrench, 
  ArrowRight, 
  Layers, 
  FileText, 
  Image as ImageIcon,
  History,
  Repeat,
  Loader2,
  ExternalLink
} from "lucide-react";

export default function RoomDetailPage() {
  const params = useParams();
  const roomNumber = params.roomNumber as string;

  const [room, setRoom] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"current" | "closed" | "recurring" | "media" | "logs">("current");

  useEffect(() => {
    fetch(`/api/rooms/${roomNumber}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRoom(data.data);
        } else {
          setError(data.error || "تعذر جلب تفاصيل الشقة");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [roomNumber]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <span className="text-xs font-semibold text-slate-500">جاري تحميل ملف الشقة الشامل 360°...</span>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-2xl max-w-md mx-auto text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-base font-bold">لم يتم العثور على الشقة</h2>
        <p className="text-xs">{error || "رقم الشقة غير موجود في سجل الفندق"}</p>
        <Link
          href="/rooms"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لقائمة الشقق</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-amber-600">الرئيسية</Link>
          <span>/</span>
          <Link href="/rooms" className="hover:text-amber-600">الشقق</Link>
          <span>/</span>
          <span className="font-bold text-slate-800">ملف الشقة {room.number}</span>
        </div>

        <Link
          href="/inspections/new"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-sm transition"
        >
          <span>بدء تفتيش لهذه الشقة</span>
        </Link>
      </div>

      {/* Hero Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-white flex items-center justify-center font-black text-2xl shadow-md">
              {room.number}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">الشقة {room.number}</h1>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    room.isReady
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  {room.isReady ? "جاهزة للتسكين" : "غير جاهزة (محظورة)"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {room.type} | {room.building?.name || "المبنى الرئيسي A"} - {room.floor?.name || "الطابق الخامس"}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
            <span className="block text-[11px] text-slate-400">آخر تاريخ تفتيش:</span>
            <span className="text-xs font-bold text-slate-700">
              {room.lastInspectionDate ? new Date(room.lastInspectionDate).toLocaleDateString("ar-SA") : "غير مسجل"}
            </span>
          </div>
        </div>

        {/* Issue Type Breakdown Stats Bar */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
          <span className="block text-xs font-bold text-slate-700">توزيع المشاكل المسجلة حسب النوع:</span>
          <div className="flex flex-wrap gap-2">
            {Object.keys(room.issuesByType).length === 0 ? (
              <span className="text-xs text-slate-400">لا توجد أي مشاكل مسجلة لهذه الشقة.</span>
            ) : (
              Object.entries(room.issuesByType).map(([type, count]) => (
                <span
                  key={type}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 shadow-2xs"
                >
                  {type}: <strong className="text-amber-600">{count as any}</strong>
                </span>
              ))
            )}
          </div>
        </div>

        {room.notes && (
          <p className="text-xs text-slate-600 italic bg-amber-50/60 p-3 rounded-xl border border-amber-100">
            <strong>ملاحظات المشرف:</strong> {room.notes}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 text-xs font-bold">
        <button
          onClick={() => setActiveTab("current")}
          className={`pb-2 px-3 border-b-2 transition ${
            activeTab === "current"
              ? "border-amber-500 text-amber-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          المشاكل الحالية المفتوحة ({room.openIssues.length})
        </button>
        <button
          onClick={() => setActiveTab("closed")}
          className={`pb-2 px-3 border-b-2 transition ${
            activeTab === "closed"
              ? "border-amber-500 text-amber-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          سجل الإصلاحات المغلقة ({room.closedIssues.length})
        </button>
        <button
          onClick={() => setActiveTab("recurring")}
          className={`pb-2 px-3 border-b-2 transition ${
            activeTab === "recurring"
              ? "border-amber-500 text-amber-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          المشاكل المتكررة ({room.recurringIssues.length})
        </button>
        <button
          onClick={() => setActiveTab("media")}
          className={`pb-2 px-3 border-b-2 transition ${
            activeTab === "media"
              ? "border-amber-500 text-amber-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          الصور والمرفقات ({room.attachments.length})
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-2 px-3 border-b-2 transition ${
            activeTab === "logs"
              ? "border-amber-500 text-amber-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          سجل العمليات والتدقيق ({room.auditLogs.length})
        </button>
      </div>

      {/* Tab 1: Current Open Issues */}
      {activeTab === "current" && (
        <div className="space-y-3">
          {room.openIssues.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <span>لا توجد أي مشاكل مفتوحة حالياً للشقة {room.number}.</span>
            </div>
          ) : (
            room.openIssues.map((issue: any) => (
              <div key={issue.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-bold">
                      {issue.department}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">
                      {issue.mainType} {issue.subType ? `(${issue.subType})` : ""}
                    </span>
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded text-xs font-bold">
                      أولوية: {issue.priority}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                    الحالة: {issue.status}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900">{issue.description}</p>
                {issue.recommendedAction && (
                  <p className="text-[11px] text-slate-500">
                    <strong>الإجراء المقترح:</strong> {issue.recommendedAction}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Closed Issues & Repairs History */}
      {activeTab === "closed" && (
        <div className="space-y-3">
          {room.closedIssues.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
              <span>لا توجد مشاكل تم إغلاقها سابقاً لهذه الشقة.</span>
            </div>
          ) : (
            room.closedIssues.map((issue: any) => (
              <div key={issue.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-800">{issue.mainType}</span>
                    <span className="text-slate-400">({issue.department})</span>
                  </div>
                  <span className="text-slate-400">
                    أغلقت في: {new Date(issue.closedAt || issue.updatedAt).toLocaleDateString("ar-SA")}
                  </span>
                </div>
                <p className="text-xs text-slate-700">{issue.description}</p>
                {issue.resolutionNotes && (
                  <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 text-xs text-emerald-900">
                    <strong>إجراء الإصلاح المنفذ: </strong> {issue.resolutionNotes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Recurring Issues */}
      {activeTab === "recurring" && (
        <div className="space-y-3">
          {room.recurringIssues.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <span>لا توجد أي أعطال متكررة مرصودة في هذه الشقة.</span>
            </div>
          ) : (
            room.recurringIssues.map((issue: any) => (
              <div key={issue.id} className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <Repeat className="w-4 h-4 text-amber-600" />
                  <span>مشكلة متكررة: {issue.mainType} ({issue.subType || ""})</span>
                </div>
                <p className="text-xs text-amber-800">{issue.description}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 4: Photos & Media */}
      {activeTab === "media" && (
        <div>
          {room.attachments.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
              <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <span>لم يتم إرفاق أي صور أو مقاطع لهذه الشقة بعد.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {room.attachments.map((att: any, i: number) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={att.fileUrl} alt={att.fileName} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Audit Logs */}
      {activeTab === "logs" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 divide-y divide-slate-100 text-xs">
          {room.auditLogs.map((log: any) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">{log.action}: </span>
                <span className="text-slate-600">{log.details}</span>
              </div>
              <span className="text-[11px] text-slate-400">
                {new Date(log.createdAt).toLocaleTimeString("ar-SA")} - {new Date(log.createdAt).toLocaleDateString("ar-SA")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}