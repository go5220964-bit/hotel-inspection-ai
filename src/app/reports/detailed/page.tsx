"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Printer, 
  Download, 
  ArrowRight, 
  DoorOpen, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Image as ImageIcon,
  Loader2,
  ArrowUpDown,
  Filter
} from "lucide-react";

export default function DetailedReportPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [totalIssues, setTotalIssues] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("roomNumber");
  const [activeSectionKey, setActiveSectionKey] = useState<string>("all");

  const fetchDetailedData = (sort: string) => {
    setLoading(true);
    fetch(`/api/reports/detailed?sortBy=${sort}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSections(data.sections);
          setTotalIssues(data.totalIssues);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDetailedData(sortBy);
  }, [sortBy]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <span className="text-xs font-semibold text-slate-500">جاري إعداد التقرير التفصيلي المصنف (11 قسماً)...</span>
      </div>
    );
  }

  const displayedSections = activeSectionKey === "all"
    ? sections
    : sections.filter((s) => s.key === activeSectionKey);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Bar (Hidden during print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/reports" className="hover:text-amber-600 flex items-center gap-1">
            <ArrowRight className="w-3.5 h-3.5" />
            <span>مركز التقارير</span>
          </Link>
          <span>/</span>
          <span className="font-bold text-slate-800">التقرير التفصيلي (11 قسماً)</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sorting Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500 font-semibold">ترتيب حسب:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="roomNumber">رقم الشقة</option>
              <option value="priority">الأولوية</option>
              <option value="department">القسم المسؤول</option>
              <option value="mainType">نوع المشكلة</option>
              <option value="status">الحالة</option>
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة / PDF</span>
          </button>
          <a
            href="/api/export/excel"
            download
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير Excel</span>
          </a>
        </div>
      </div>

      {/* Section Filter Pills (Hidden during print) */}
      <div className="print:hidden flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveSectionKey("all")}
          className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
            activeSectionKey === "all" ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          عرض كافة الأقسام الـ 11
        </button>
        {sections.map((sec) => (
          <button
            key={sec.key}
            onClick={() => setActiveSectionKey(sec.key)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeSectionKey === sec.key ? "bg-blue-600 text-white shadow-sm" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <span>{sec.title.split(". ")[1] || sec.title}</span>
            <span className="mr-1 opacity-70">({sec.issuesCount})</span>
          </button>
        ))}
      </div>

      {/* Document Content */}
      <div className="space-y-8 bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b border-slate-200 pb-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                DET
              </span>
              <span className="text-xl font-black text-slate-900">فندق الأندلس رويال بالاس</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 pt-2">التقرير التفصيلي المصنف لاحتياجات الشقق والغرف</h1>
            <p className="text-xs text-slate-500">
              إجمالي البلاغات المدرجة: {totalIssues} بلاغ | ترتيب البيانات: وفق {sortBy === "roomNumber" ? "رقم الشقة" : sortBy} | التاريخ: {new Date().toLocaleDateString("ar-SA")}
            </p>
          </div>

          <div className="text-left border border-slate-200 p-3 rounded-xl bg-slate-50 text-xs">
            <span className="block font-bold text-slate-700">تقرير تشغيلي مصنف</span>
            <span className="block text-[10px] text-slate-400 font-mono">11 فئة فندقية معتمدة</span>
          </div>
        </div>

        {/* Render 11 Sections */}
        {displayedSections.map((section, idx) => (
          <div key={section.key} className="space-y-4 pt-4 border-t border-slate-100 first:border-none first:pt-0 page-break-inside-avoid">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <h2 className="text-base font-black text-slate-900">{section.title}</h2>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span>عدد الشقق المتأثرة: <strong className="text-slate-800">{section.roomsCount}</strong></span>
                  <span>•</span>
                  <span>عدد المشاكل: <strong className="text-amber-600">{section.issuesCount}</strong></span>
                </div>
              </div>

              {/* Affected Rooms Badges */}
              {section.rooms.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-semibold">الشقق:</span>
                  {section.rooms.map((r: string) => (
                    <span key={r} className="px-2 py-0.5 bg-white border border-slate-200 rounded font-bold text-slate-800 text-xs">
                      {r}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Issues Table / Cards for this Section */}
            {section.issues.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 bg-white border border-dashed border-slate-200 rounded-xl">
                لا توجد أي ملاحظات أو مشاكل مسجلة في هذا القسم.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                {section.issues.map((iss: any, issueIdx: number) => {
                  const isCritical = iss.priority === "حرجة";
                  const isHigh = iss.priority === "عالية";
                  const priorityColor = isCritical
                    ? "bg-rose-100 text-rose-800 border-rose-200"
                    : isHigh
                    ? "bg-orange-100 text-orange-800 border-orange-200"
                    : "bg-slate-100 text-slate-700 border-slate-200";

                  return (
                    <div key={iss.id} className="p-4 space-y-2 hover:bg-slate-50/60 transition">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                            {issueIdx + 1}
                          </span>
                          <span className="px-2.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded font-black text-xs">
                            الشقة {iss.roomNumber}
                          </span>
                          {iss.area && (
                            <span className="text-xs text-slate-500 font-medium">({iss.area})</span>
                          )}
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[11px] font-bold">
                            {iss.department}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]">
                            {iss.mainType} {iss.subType ? `(${iss.subType})` : ""}
                          </span>
                          <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${priorityColor}`}>
                            {iss.priority}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-bold">
                            الحالة: {iss.status}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${iss.isRoomReady ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                            {iss.isRoomReady ? "جاهزة للتسكين" : "غير جاهزة"}
                          </span>
                        </div>

                        <span className="text-[11px] text-slate-400">
                          SLA: {iss.estimatedSlaHours} ساعة
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-900 leading-relaxed">
                        {iss.description}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 pt-1">
                        {iss.recommendedAction && (
                          <div>
                            <strong className="text-slate-700">الإجراء المطلوب: </strong>
                            <span>{iss.recommendedAction}</span>
                          </div>
                        )}
                        {iss.attachments?.length > 0 && (
                          <div className="flex items-center gap-1 text-blue-600 font-medium">
                            <ImageIcon className="w-3 h-3" />
                            <span>يوجد {iss.attachments.length} مرفقات</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}