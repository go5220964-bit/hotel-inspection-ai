"use client";

import React, { useEffect, useState } from "react";
import { useBranch } from "@/components/layout/BranchContext";
import Link from "next/link";
import {
  BarChart3,
  Zap,
  Utensils,
  Droplets,
  Wind,
  Sparkles,
  Armchair,
  ShieldAlert,
  Printer,
  Download,
  ArrowRight,
  CheckCircle2,
  AlertOctagon,
  Building2,
  TrendingUp,
  Percent,
  BedDouble
} from "lucide-react";

export default function AggregateCountsReportPage() {
  const { currentBranch } = useBranch();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchAggregateData = async () => {
    setLoading(true);
    try {
      const branchParam = currentBranch?.id ? `branchId=${currentBranch.id}` : "";
      const res = await fetch(`/api/reports/aggregate-counts?${branchParam}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAggregateData();
  }, [currentBranch?.id]);

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case "Zap":
        return <Zap className="w-5 h-5 text-amber-500" />;
      case "Utensils":
        return <Utensils className="w-5 h-5 text-emerald-500" />;
      case "Droplets":
        return <Droplets className="w-5 h-5 text-blue-500" />;
      case "Wind":
        return <Wind className="w-5 h-5 text-sky-500" />;
      case "Sparkles":
        return <Sparkles className="w-5 h-5 text-purple-500" />;
      case "Armchair":
        return <Armchair className="w-5 h-5 text-orange-500" />;
      case "ShieldAlert":
        return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      default:
        return <BarChart3 className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 print:hidden">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Link href="/reports" className="flex items-center gap-1 hover:text-amber-600 transition font-medium">
            <ArrowRight className="w-4 h-4" />
            <span>مركز التقارير</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-slate-900">تقرير الأعداد الإجمالي</span>
          {currentBranch && (
            <span className="mr-2 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
              فرع: {currentBranch.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير / PDF</span>
          </button>

          <a
            href={`/api/export/excel?reportType=aggregate&branchId=${currentBranch?.id || "all"}`}
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition"
          >
            <Download className="w-4 h-4" />
            <span>تصدير إجمالي Excel</span>
          </a>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-l from-slate-950 via-slate-900 to-amber-950 text-white p-6 sm:p-8 rounded-3xl shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
              <TrendingUp className="w-4 h-4" />
              <span>مؤشرات إجمالية لحظية</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              التقرير الإجمالي: إحصائيات وأعداد الشقق المتأثرة
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              حصر كمي مباشر لأعداد الشقق التي بها أعطال كهرباء، نقص مستلزمات مطبخ وضيافة، سباكة، وتكييف مع جاهزية التسكين الشاملة.
            </p>
          </div>

          {/* Readiness Gauge */}
          {data && (
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 min-w-[240px] text-center space-y-2">
              <span className="text-[11px] text-slate-300 font-bold block">مؤشر الجاهزية للتسكين</span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-black text-amber-400">{data.readinessRate}%</span>
                <span className="text-xs text-slate-300 font-medium">({data.readyApartments} من {data.totalApartments} شقة)</span>
              </div>
              <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${data.readinessRate}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">جاري احتساب أعداد الشقق ومؤشرات الصيانة...</p>
        </div>
      ) : data ? (
        <div className="space-y-8">
          {/* Requested Prominent Counter Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: الكهرباء */}
            <div className="bg-white rounded-3xl border-2 border-amber-200/80 p-5 shadow-sm hover:shadow-md transition space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="text-xs font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  كهرباء
                </span>
              </div>

              <div>
                <span className="text-3xl font-black text-slate-900 block">{data.rawCounts.electricityCount}</span>
                <h3 className="text-xs font-bold text-slate-600 mt-0.5">عدد الشقق التي فيها عطل كهرباء</h3>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 block mb-1.5 font-bold">أرقام الشقق المتأثرة:</span>
                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                  {data.categoriesSummary[0]?.rooms?.length > 0 ? (
                    data.categoriesSummary[0].rooms.map((r: string) => (
                      <Link
                        key={r}
                        href={`/reports/by-room?roomNumber=${r}`}
                        className="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-600 hover:text-white text-amber-900 text-[11px] font-black transition"
                        title="انقر لفتح تقرير الشقة"
                      >
                        {r}
                      </Link>
                    ))
                  ) : (
                    <span className="text-[11px] text-emerald-600 font-bold">لا توجد أعطال كهرباء</span>
                  )}
                </div>
              </div>
            </div>

            {/* Card 2: نقص مطبخ ومستلزمات */}
            <div className="bg-white rounded-3xl border-2 border-emerald-200/80 p-5 shadow-sm hover:shadow-md transition space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Utensils className="w-5 h-5" />
                </div>
                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  مطبخ ونواقص
                </span>
              </div>

              <div>
                <span className="text-3xl font-black text-slate-900 block">{data.rawCounts.kitchenShortageCount}</span>
                <h3 className="text-xs font-bold text-slate-600 mt-0.5">عدد الشقق التي فيها نقص مطبخ</h3>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 block mb-1.5 font-bold">أرقام الشقق المتأثرة:</span>
                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                  {data.categoriesSummary[1]?.rooms?.length > 0 ? (
                    data.categoriesSummary[1].rooms.map((r: string) => (
                      <Link
                        key={r}
                        href={`/reports/by-room?roomNumber=${r}`}
                        className="px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-600 hover:text-white text-emerald-900 text-[11px] font-black transition"
                        title="انقر لفتح تقرير الشقة"
                      >
                        {r}
                      </Link>
                    ))
                  ) : (
                    <span className="text-[11px] text-emerald-600 font-bold">المستلزمات مكتملة</span>
                  )}
                </div>
              </div>
            </div>

            {/* Card 3: عطل سباكة */}
            <div className="bg-white rounded-3xl border-2 border-blue-200/80 p-5 shadow-sm hover:shadow-md transition space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Droplets className="w-5 h-5" />
                </div>
                <span className="text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  سباكة
                </span>
              </div>

              <div>
                <span className="text-3xl font-black text-slate-900 block">{data.rawCounts.plumbingCount}</span>
                <h3 className="text-xs font-bold text-slate-600 mt-0.5">عدد الشقق التي فيها عطل سباكة</h3>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 block mb-1.5 font-bold">أرقام الشقق المتأثرة:</span>
                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                  {data.categoriesSummary[2]?.rooms?.length > 0 ? (
                    data.categoriesSummary[2].rooms.map((r: string) => (
                      <Link
                        key={r}
                        href={`/reports/by-room?roomNumber=${r}`}
                        className="px-2 py-0.5 rounded-lg bg-blue-100 hover:bg-blue-600 hover:text-white text-blue-900 text-[11px] font-black transition"
                        title="انقر لفتح تقرير الشقة"
                      >
                        {r}
                      </Link>
                    ))
                  ) : (
                    <span className="text-[11px] text-emerald-600 font-bold">لا توجد أعطال سباكة</span>
                  )}
                </div>
              </div>
            </div>

            {/* Card 4: عطل تكييف */}
            <div className="bg-white rounded-3xl border-2 border-sky-200/80 p-5 shadow-sm hover:shadow-md transition space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                  <Wind className="w-5 h-5" />
                </div>
                <span className="text-xs font-black text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                  تكييف
                </span>
              </div>

              <div>
                <span className="text-3xl font-black text-slate-900 block">{data.rawCounts.acCount}</span>
                <h3 className="text-xs font-bold text-slate-600 mt-0.5">عدد الشقق التي فيها عطل تكييف</h3>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 block mb-1.5 font-bold">أرقام الشقق المتأثرة:</span>
                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                  {data.categoriesSummary[3]?.rooms?.length > 0 ? (
                    data.categoriesSummary[3].rooms.map((r: string) => (
                      <Link
                        key={r}
                        href={`/reports/by-room?roomNumber=${r}`}
                        className="px-2 py-0.5 rounded-lg bg-sky-100 hover:bg-sky-600 hover:text-white text-sky-900 text-[11px] font-black transition"
                        title="انقر لفتح تقرير الشقة"
                      >
                        {r}
                      </Link>
                    ))
                  ) : (
                    <span className="text-[11px] text-emerald-600 font-bold">التكييف يعمل بكفاءة</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Blocked vs Ready Rooms Highlights */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-black text-slate-900">
                  الشقق المحظورة عن التسكين حالياً ({data.blockedApartments} شقة)
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                شقق تم تعطيل جاهزيتها فندورياً لوجود أعطال حرجة أو نقص مستلزمات أساسية تمنع تسكين النزيل.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 items-center">
              {data.blockedRoomNumbers.length > 0 ? (
                data.blockedRoomNumbers.map((rm: string) => (
                  <Link
                    key={rm}
                    href={`/reports/by-room?roomNumber=${rm}`}
                    className="px-3 py-1 bg-rose-100 hover:bg-rose-600 hover:text-white text-rose-800 rounded-xl text-xs font-black transition border border-rose-200"
                  >
                    شقة {rm}
                  </Link>
                ))
              ) : (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black">
                  كافة الشقق جاهزة ومتاحة للتسكين 100%
                </span>
              )}
            </div>
          </div>

          {/* Master Breakdown Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  جدول التوزيع الإجمالي للأعطال والنواقص الفندقية
                </h3>
                <p className="text-xs text-slate-500">
                  بيان كمي بعدد الشقق المتأثرة والنسبة المئوية من مجمل شقق الفرع ({data.totalApartments} شقة)
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">نوع العطل / الاحتياج</th>
                    <th className="py-3.5 px-4 text-center">عدد الشقق المتأثرة</th>
                    <th className="py-3.5 px-4 text-center">نسبة التأثير</th>
                    <th className="py-3.5 px-4">أرقام الشقق المعنية</th>
                    <th className="py-3.5 px-4">الإجراء التشغيلي الموصى به</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {data.categoriesSummary.map((cat: any) => (
                    <tr key={cat.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
                            {getCategoryIcon(cat.icon)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{cat.title}</span>
                            <span className="text-[11px] text-slate-500">القسم: {cat.department}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-base font-black text-slate-900">{cat.count}</span>
                        <span className="text-[10px] text-slate-500 block">شقة</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 font-black text-slate-800">
                          <span>{cat.percentage}%</span>
                        </div>
                        <div className="w-20 bg-slate-200 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                          <div
                            className="bg-amber-500 h-full rounded-full"
                            style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {cat.rooms?.length > 0 ? (
                            cat.rooms.map((rm: string) => (
                              <Link
                                key={rm}
                                href={`/reports/by-room?roomNumber=${rm}`}
                                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 text-[11px] font-bold transition"
                              >
                                {rm}
                              </Link>
                            ))
                          ) : (
                            <span className="text-emerald-600 font-bold text-[11px]">لا يوجد</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-sm font-medium">
                        {cat.actionNeeded}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
