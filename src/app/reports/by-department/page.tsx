"use client";

import React, { useEffect, useState } from "react";
import { useBranch } from "@/components/layout/BranchContext";
import Link from "next/link";
import {
  Layers,
  Zap,
  Wind,
  Droplets,
  Utensils,
  Sparkles,
  Armchair,
  ShieldAlert,
  Wrench,
  Printer,
  Download,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DoorClosed,
  Building
} from "lucide-react";

export default function ReportByDepartmentPage() {
  const { currentBranch } = useBranch();
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState("الكهرباء");
  const [data, setData] = useState<{
    selectedDepartment: string;
    departmentList: any[];
    affectedApartments: any[];
    totalIssues: number;
    totalApartmentsAffected: number;
    criticalIssuesCount: number;
    overdueCount: number;
  } | null>(null);

  const fetchDepartmentReport = async (dept: string) => {
    setLoading(true);
    try {
      const branchParam = currentBranch?.id ? `branchId=${currentBranch.id}&` : "";
      const deptParam = `department=${encodeURIComponent(dept)}`;
      const res = await fetch(`/api/reports/by-department?${branchParam}${deptParam}`);
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
    fetchDepartmentReport(selectedDept);
  }, [currentBranch?.id, selectedDept]);

  const getDeptIcon = (name: string) => {
    switch (name) {
      case "الكهرباء":
        return <Zap className="w-4 h-4 text-amber-500" />;
      case "التكييف":
        return <Wind className="w-4 h-4 text-sky-500" />;
      case "السباكة":
        return <Droplets className="w-4 h-4 text-blue-500" />;
      case "المستلزمات والنواقص":
        return <Utensils className="w-4 h-4 text-emerald-500" />;
      case "النظافة":
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      case "الأثاث والتأثيث":
        return <Armchair className="w-4 h-4 text-orange-500" />;
      case "السلامة والأمان":
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      default:
        return <Wrench className="w-4 h-4 text-slate-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "حرجة":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "عالية":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "متوسطة":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 print:hidden">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Link href="/reports" className="flex items-center gap-1 hover:text-amber-600 transition font-medium">
            <ArrowRight className="w-4 h-4" />
            <span>مركز التقارير</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-slate-900">تقرير بالأقسام والشقق المتأثرة</span>
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
            href={`/api/export/excel?reportType=department&branchId=${currentBranch?.id || "all"}&department=${encodeURIComponent(selectedDept)}`}
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition"
          >
            <Download className="w-4 h-4" />
            <span>تصدير Excel للقسم</span>
          </a>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-l from-slate-950 via-slate-900 to-blue-950 text-white p-6 rounded-3xl shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider mb-2">
              <Layers className="w-4 h-4" />
              <span>توزيع البلاغات حسب الإدارات الفنية</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              تقرير بالأقسام: الشقق التي تحتوي على مشكلة في قسم معين
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              توجيه مباشر لفرق الصيانة والتشغيل بكل قسم، يعرض حصر الشقق والغرف التي تحتاج لتدخل فوري مع تفاصيل العطل ومدى تعطيله للتسكين.
            </p>
          </div>

          {/* Quick Department Stats */}
          {data && (
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 shrink-0">
              <div className="text-center px-3 border-l border-white/10">
                <span className="block text-2xl font-black text-amber-400">{data.totalApartmentsAffected}</span>
                <span className="text-[11px] text-slate-300">شقق متأثرة</span>
              </div>
              <div className="text-center px-3 border-l border-white/10">
                <span className="block text-2xl font-black text-white">{data.totalIssues}</span>
                <span className="text-[11px] text-slate-300">أعطال مسجلة</span>
              </div>
              <div className="text-center px-3">
                <span className="block text-2xl font-black text-rose-400">{data.criticalIssuesCount}</span>
                <span className="text-[11px] text-slate-300">بلاغات حرجة</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Departments Tabs */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {data?.departmentList?.map((dept) => {
            const isSelected = selectedDept === dept.name;
            return (
              <button
                key={dept.name}
                onClick={() => setSelectedDept(dept.name)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                  isSelected
                    ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {getDeptIcon(dept.name)}
                <span>قسم {dept.name}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isSelected
                      ? "bg-amber-500 text-slate-950"
                      : dept.apartmentsCount > 0
                      ? "bg-rose-100 text-rose-800"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {dept.apartmentsCount} شقة
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">جاري تجميع بيانات قسم {selectedDept}...</p>
        </div>
      ) : data?.affectedApartments?.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center space-y-3">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
          <h3 className="text-lg font-black text-slate-900">ممتاز! لا توجد أي شقق متأثرة في قسم {selectedDept}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            جميع وحدات الفرع خالية من أعطال وملاحظات هذا القسم ومكتملة الجاهزية.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>قائمة الشقق التي بها أعطال تابعة لقسم: {selectedDept}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                {data?.totalApartmentsAffected} شقة
              </span>
            </h2>
            <span className="text-xs text-slate-500">تم الترتيب حسب رقم الشقة والأولوية</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.affectedApartments?.map((item) => (
              <div
                key={item.roomNumber}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Bar with Room and Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner ${
                          !item.isRoomReady
                            ? "bg-rose-50 border-2 border-rose-300 text-rose-700"
                            : "bg-amber-50 border-2 border-amber-300 text-amber-700"
                        }`}
                      >
                        {item.roomNumber}
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900">شقة {item.roomNumber}</h3>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {item.apartment?.floor?.number ? `الطابق ${item.apartment.floor.number}` : "الطابق غير محدد"}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        !item.isRoomReady
                          ? "bg-rose-100 text-rose-800 border-rose-300"
                          : "bg-emerald-100 text-emerald-800 border-emerald-300"
                      }`}
                    >
                      {!item.isRoomReady ? "⚠ محظورة للتسكين" : "✓ جاهزة للتسكين"}
                    </span>
                  </div>

                  {/* Issues Count Badge */}
                  <div className="flex items-center justify-between text-xs py-1 border-y border-slate-100">
                    <span className="text-slate-500 font-bold">أعطال قسم {selectedDept}:</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-black">
                      {item.issues.length} {item.issues.length === 1 ? "عطل" : "أعطال"}
                    </span>
                  </div>

                  {/* Issues List in this Department */}
                  <div className="space-y-2.5">
                    {item.issues.map((iss: any) => (
                      <div key={iss.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-xs text-slate-900 leading-snug">
                            {iss.description}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${getPriorityBadge(iss.priority)}`}>
                            {iss.priority}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                          {iss.area && (
                            <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-medium">
                              الموقع: {iss.area}
                            </span>
                          )}
                          {iss.needType && (
                            <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-medium">
                              {iss.needType}
                            </span>
                          )}
                        </div>

                        {iss.recommendedAction && (
                          <p className="text-[11px] text-slate-700 font-medium bg-amber-50/70 p-2 rounded-xl border border-amber-200/60">
                            <span className="font-bold text-amber-900">الإجراء: </span>
                            {iss.recommendedAction}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/reports/by-room?roomNumber=${item.roomNumber}`}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <span>فتح السجل الشامل للشقة {item.roomNumber}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
