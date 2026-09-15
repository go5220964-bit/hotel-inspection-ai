"use client";

import React, { useEffect, useState } from "react";
import { useBranch } from "@/components/layout/BranchContext";
import Link from "next/link";
import {
  DoorClosed,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Printer,
  Download,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  Building,
  Calendar,
  Layers,
  Sparkles,
  ChevronDown
} from "lucide-react";

export default function ReportByRoomPage() {
  const { currentBranch } = useBranch();
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [data, setData] = useState<{
    apartment: any;
    apartmentsList: any[];
    issues: any[];
    groupedByRoom?: Record<string, any[]>;
    metrics: any;
  } | null>(null);

  const fetchReport = async (room: string) => {
    setLoading(true);
    try {
      const branchParam = currentBranch?.id ? `branchId=${currentBranch.id}&` : "";
      const roomParam = room !== "all" ? `roomNumber=${encodeURIComponent(room)}` : "roomNumber=all";
      const res = await fetch(`/api/reports/by-room?${branchParam}${roomParam}`);
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
    fetchReport(selectedRoom);
  }, [currentBranch?.id, selectedRoom]);

  const filteredApartments = data?.apartmentsList?.filter((apt) =>
    apt.number.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handlePrint = () => {
    window.print();
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "مكتمل":
      case "مغلق":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "قيد المعالجة":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-purple-100 text-purple-800 border-purple-200";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Breadcrumb & Print/Export Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 print:hidden">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Link href="/reports" className="flex items-center gap-1 hover:text-amber-600 transition font-medium">
            <ArrowRight className="w-4 h-4" />
            <span>مركز التقارير</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-slate-900">تقرير برقم الشقة والأعطال المسجلة</span>
          {currentBranch && (
            <span className="mr-2 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
              فرع: {currentBranch.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير / PDF</span>
          </button>

          <a
            href={`/api/export/excel?reportType=room&branchId=${currentBranch?.id || "all"}&roomNumber=${selectedRoom}`}
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition"
          >
            <Download className="w-4 h-4" />
            <span>تصدير Excel</span>
          </a>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-3xl shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
              <DoorClosed className="w-4 h-4" />
              <span>فحص تفصيلي للوحدات السكنية</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              تقرير برقم الشقة وجميع الأعطال المسجلة فيها
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              سجل كامل وتاريخي لكافة الملاحظات، البلاغات الفنية، قطع الغيار المطلوبة، ونسب الجاهزية للتسكين لكل شقة بشكل مستقل.
            </p>
          </div>

          {/* Quick Stats overview */}
          {data?.metrics && (
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 shrink-0">
              <div className="text-center px-3 border-l border-white/10">
                <span className="block text-2xl font-black text-amber-400">
                  {selectedRoom === "all" ? data.metrics.totalIssues : data.metrics.totalCount}
                </span>
                <span className="text-[11px] text-slate-300">إجمالي الأعطال</span>
              </div>
              <div className="text-center px-3 border-l border-white/10">
                <span className="block text-2xl font-black text-rose-400">
                  {selectedRoom === "all" ? data.metrics.openIssues : data.metrics.openCount}
                </span>
                <span className="text-[11px] text-slate-300">أعطال نشطة</span>
              </div>
              <div className="text-center px-3">
                <span className="block text-2xl font-black text-emerald-400">
                  {selectedRoom === "all" ? (data.metrics.totalIssues - data.metrics.openIssues) : data.metrics.closedCount}
                </span>
                <span className="text-[11px] text-slate-300">أعطال مغلقة</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Room Selector Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-bold text-slate-900">اختيار الشقة المعنية:</span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="ابحث برقم الشقة (مثلاً: 101)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-9 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Room Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 max-h-36 overflow-y-auto">
          <button
            onClick={() => setSelectedRoom("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              selectedRoom === "all"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <span>عرض كافة الشقق ({data?.apartmentsList?.length || 0})</span>
          </button>

          {filteredApartments.map((apt) => {
            const hasIssues = (apt._count?.issues || 0) > 0;
            const isSelected = selectedRoom === apt.number;

            return (
              <button
                key={apt.id}
                onClick={() => setSelectedRoom(apt.number)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  isSelected
                    ? "bg-amber-600 border-amber-600 text-white shadow-sm"
                    : !apt.isReady
                    ? "bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100"
                    : hasIssues
                    ? "bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span>شقة {apt.number}</span>
                {hasIssues && (
                  <span
                    className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${
                      isSelected ? "bg-white text-amber-700" : "bg-amber-600 text-white"
                    }`}
                  >
                    {apt._count.issues}
                  </span>
                )}
                {!apt.isReady && (
                  <span className="w-2 h-2 rounded-full bg-rose-500" title="غير جاهزة للتسكين" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">جاري تجميع بيانات الأعطال وتاريخ الشقة...</p>
        </div>
      ) : selectedRoom !== "all" && data?.apartment ? (
        /* Single Apartment Detailed View */
        <div className="space-y-6">
          {/* Apartment Header Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner ${
                  data.apartment.isReady
                    ? "bg-emerald-50 border-2 border-emerald-300 text-emerald-700"
                    : "bg-rose-50 border-2 border-rose-300 text-rose-700"
                }`}
              >
                {data.apartment.number}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900">
                    شقة رقم {data.apartment.number}
                  </h2>
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
                      data.apartment.isReady
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : "bg-rose-100 text-rose-800 border-rose-300"
                    }`}
                  >
                    {data.apartment.isReady ? "✓ جاهزة للتسكين" : "⚠ غير جاهزة (محظورة)"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    المبنى: {data.apartment.building?.name || "الرئيسي"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    الطابق: {data.apartment.floor?.number || "غير محدد"}
                  </span>
                  <span className="flex items-center gap-1">
                    <DoorClosed className="w-3.5 h-3.5 text-slate-400" />
                    النوع: {data.apartment.type || "جناح فندقي"}
                  </span>
                </div>
              </div>
            </div>

            {/* Metrics Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <span className="block text-lg font-black text-slate-900">{data.metrics.totalCount}</span>
                <span className="text-[10px] text-slate-500 font-bold">إجمالي الأعطال</span>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
                <span className="block text-lg font-black text-rose-700">{data.metrics.openCount}</span>
                <span className="text-[10px] text-rose-600 font-bold">بلاغات قيد الحل</span>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <span className="block text-lg font-black text-emerald-700">{data.metrics.closedCount}</span>
                <span className="text-[10px] text-emerald-600 font-bold">أعطال تم إصلاحها</span>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <span className="block text-lg font-black text-amber-700">{data.metrics.criticalCount}</span>
                <span className="text-[10px] text-amber-600 font-bold">حرجة / عالية</span>
              </div>
            </div>
          </div>

          {/* Table of Registered Issues in This Apartment */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>كافة الأعطال المسجلة في الشقة ({data.issues.length})</span>
              </h3>
              <span className="text-xs text-slate-500">مرتبة من الأحدث إلى الأقدم</span>
            </div>

            {data.issues.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-black text-slate-800">لا توجد أي أعطال مسجلة لهذه الشقة!</h4>
                <p className="text-xs text-slate-500">الوحدة نظيفة ومطابقة للمواصفات الفندقية بالكامل.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">المكان / المنطقة</th>
                      <th className="py-3 px-4">وصف العطل</th>
                      <th className="py-3 px-4">القسم المسؤول</th>
                      <th className="py-3 px-4">نوع الاحتياج</th>
                      <th className="py-3 px-4">الأولوية</th>
                      <th className="py-3 px-4">الحالة</th>
                      <th className="py-3 px-4">الإجراء الموصى به</th>
                      <th className="py-3 px-4">تاريخ التسجيل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {data.issues.map((issue, idx) => (
                      <tr key={issue.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{issue.area || "عام"}</td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="font-bold text-slate-900">{issue.description}</p>
                          {issue.isRecurring && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                              عطل متكرر
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold border border-slate-200">
                            {issue.department}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{issue.needType || "صيانة فورية"}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${getPriorityBadge(issue.priority)}`}>
                            {issue.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${getStatusBadge(issue.status)}`}>
                            {issue.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs">{issue.recommendedAction || "-"}</td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(issue.createdAt).toLocaleDateString("ar-SA")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* All Apartments Grouped Overview */
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900">
              استعراض كافة شقق الفرع والأعطال المسجلة فيها ({Object.keys(data?.groupedByRoom || {}).length} شقة متأثرة)
            </h3>
            <span className="text-xs text-slate-500">انقر على أي شقة لعرض تفاصيلها المعمقة</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(data?.groupedByRoom || {}).map(([roomNum, roomIssues]) => {
              const aptInfo = data?.apartmentsList?.find((a) => a.number === roomNum);
              const unready = aptInfo ? !aptInfo.isReady : roomIssues.some((i) => !i.isRoomReady);
              const openCount = roomIssues.filter((i) => !["مكتمل", "مغلق"].includes(i.status)).length;

              return (
                <div
                  key={roomNum}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${
                            unready
                              ? "bg-rose-100 text-rose-800 border border-rose-300"
                              : "bg-amber-100 text-amber-900 border border-amber-300"
                          }`}
                        >
                          {roomNum}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-base">شقة {roomNum}</h4>
                          <span className="text-[11px] text-slate-500">
                            {aptInfo?.floor?.number ? `الطابق ${aptInfo.floor.number}` : "الطابق غير محدد"}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          unready
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {unready ? "غير جاهزة" : "جاهزة للتسكين"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                        إجمالي: {roomIssues.length} عطل
                      </span>
                      {openCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                          {openCount} نشطة
                        </span>
                      )}
                    </div>

                    {/* Brief list of issues */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {roomIssues.slice(0, 3).map((iss) => (
                        <div key={iss.id} className="text-xs flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                          <div className="flex-1 truncate">
                            <span className="font-bold text-slate-800">{iss.department}: </span>
                            <span className="text-slate-600">{iss.description}</span>
                          </div>
                        </div>
                      ))}
                      {roomIssues.length > 3 && (
                        <p className="text-[11px] font-bold text-amber-600">
                          + {roomIssues.length - 3} أعطال وملاحظات أخرى...
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedRoom(roomNum)}
                    className="w-full py-2 bg-slate-100 hover:bg-amber-600 hover:text-white text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <span>عرض كافة أعطال الشقة ({roomIssues.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
