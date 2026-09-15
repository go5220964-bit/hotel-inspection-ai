"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Printer, 
  Download, 
  ArrowRight, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Sparkles,
  Layers,
  Loader2,
  FileText
} from "lucide-react";

export default function ExecutiveReportPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/executive")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        <span className="text-xs font-semibold text-slate-500">جاري إعداد التقرير الإداري المختصر...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Controls Bar (Hidden during print) */}
      <div className="print:hidden flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/reports" className="hover:text-amber-600 flex items-center gap-1">
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة لمركز التقارير</span>
          </Link>
          <span>/</span>
          <span className="font-bold text-slate-800">التقرير الإداري المختصر</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة / تصدير PDF</span>
          </button>
          <a
            href="/api/export/excel"
            download
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow"
          >
            <Download className="w-4 h-4" />
            <span>تصدير Excel</span>
          </a>
        </div>
      </div>

      {/* Printable Report Document */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
                AI
              </span>
              <span className="text-xl font-black text-slate-900">فندق الأندلس رويال بالاس</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 pt-2">التقرير الإداري المختصر لجولات التفتيش</h1>
            <p className="text-xs text-slate-500">الفترة الزمنية: {data.period} | تاريخ التقرير: {new Date().toLocaleDateString("ar-SA")}</p>
          </div>

          <div className="text-left border border-slate-200 p-3 rounded-xl bg-slate-50 text-xs space-y-1">
            <span className="block font-bold text-slate-700">اعتماد إدارة الجودة</span>
            <span className="block text-[11px] text-emerald-700 font-semibold">نظام Hotel Inspection AI</span>
            <span className="block text-[10px] text-slate-400 font-mono">ID: REP-EXEC-{Date.now().toString().slice(-6)}</span>
          </div>
        </div>

        {/* Executive Summary Metrics Grid */}
        <div>
          <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-amber-500" />
            <span>1. المؤشرات التشغيلية ونسبة الجاهزية (KPIs)</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <span className="block text-slate-500 text-xs font-semibold">الشقق المفحوصة</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{data.apartmentsWithInspections} / {data.totalApartments}</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
              <span className="block text-emerald-700 text-xs font-semibold">نسبة الجاهزية</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">{data.readinessPercentage}%</span>
            </div>
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl">
              <span className="block text-rose-700 text-xs font-semibold">شقق غير جاهزة</span>
              <span className="text-2xl font-black text-rose-700 mt-1 block">{data.unreadyApartments}</span>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
              <span className="block text-amber-700 text-xs font-semibold">إجمالي البلاغات</span>
              <span className="text-2xl font-black text-amber-700 mt-1 block">{data.totalIssues}</span>
            </div>
          </div>
        </div>

        {/* Issues by Department & Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* By Dept */}
          <div className="border border-slate-200 rounded-2xl p-5 space-y-3 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-800">2. توزيع المشاكل حسب القسم المسؤول</h3>
            <div className="space-y-2">
              {Object.entries(data.issuesByDept).map(([dept, count]: any) => (
                <div key={dept} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-700">{dept}</span>
                  <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{count} بلاغ</span>
                </div>
              ))}
            </div>
          </div>

          {/* By Type */}
          <div className="border border-slate-200 rounded-2xl p-5 space-y-3 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-800">3. توزيع المشاكل حسب نوع المشكلة</h3>
            <div className="space-y-2">
              {Object.entries(data.issuesByType).map(([type, count]: any) => (
                <div key={type} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-700">{type}</span>
                  <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">{count} بلاغ</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Critical & Overdue & Top Needing Rooms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top 5 Rooms */}
          <div className="border border-slate-200 rounded-2xl p-5 space-y-3 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-800">4. أعلى الشقق احتياجاً للصيانة والتأهيل</h3>
            <div className="space-y-2">
              {data.top5Rooms.map((room: any, i: number) => (
                <div key={room.roomNumber} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                      {i + 1}
                    </span>
                    <span className="font-bold text-slate-800">الشقة {room.roomNumber}</span>
                  </div>
                  <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">{room.count} ملاحظات</span>
                </div>
              ))}
            </div>
          </div>

          {/* Critical & Overdue Summary */}
          <div className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-slate-50/50 flex flex-col justify-between">
            <h3 className="text-xs font-bold text-slate-800">5. المشاكل الحرجة والمتأخرة عن الـ SLA</h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl">
                <span className="block text-rose-700 text-xs font-semibold">بلاغات حرجة</span>
                <span className="text-2xl font-black text-rose-700 mt-1 block">{data.criticalIssues}</span>
              </div>
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl">
                <span className="block text-orange-700 text-xs font-semibold">متأخرة عن الـ SLA</span>
                <span className="text-2xl font-black text-orange-700 mt-1 block">{data.overdueIssues}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              البلاغات المتأخرة والحرجة تتطلب توجيه فرق الصيانة الفورية لتفادي أي تأثير سلبي على تجربة الضيوف.
            </p>
          </div>
        </div>

        {/* Executive Recommendations */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 space-y-3">
          <h3 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>6. أهم التوصيات الإدارية الاستراتيجية</span>
          </h3>
          <ul className="space-y-2 text-xs text-amber-950 font-medium">
            {data.recommendations.map((rec: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-600 font-bold mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer & Signatures */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs text-slate-500">
          <div>
            <span className="block font-bold text-slate-700">مشرف التفتيش والجودة</span>
            <span className="block text-[11px] text-slate-400 mt-6">عمر المشرف</span>
          </div>
          <div>
            <span className="block font-bold text-slate-700">مدير إدارة الصيانة</span>
            <span className="block text-[11px] text-slate-400 mt-6">م. أحمد الغامدي</span>
          </div>
          <div>
            <span className="block font-bold text-slate-700">المدير العام للفندق</span>
            <span className="block text-[11px] text-slate-400 mt-6">م. عبدالعزيز المنصور</span>
          </div>
        </div>
      </div>
    </div>
  );
}