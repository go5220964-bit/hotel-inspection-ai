"use client";

import React, { useEffect, useState } from "react";
import { useBranch } from "@/components/layout/BranchContext";
import Link from "next/link";
import {
  Camera,
  MessageSquare,
  Printer,
  Download,
  ArrowRight,
  Sparkles,
  Building,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  ExternalLink,
  X,
  Clock,
  Filter
} from "lucide-react";

export default function DetailedVisualReportPage() {
  const { currentBranch } = useBranch();
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [selectedDept, setSelectedDept] = useState("الكل");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchVisualData = async () => {
    setLoading(true);
    try {
      const branchParam = currentBranch?.id ? `branchId=${currentBranch.id}&` : "";
      const deptParam = selectedDept !== "الكل" ? `department=${encodeURIComponent(selectedDept)}` : "";
      const res = await fetch(`/api/reports/detailed-visual?${branchParam}${deptParam}`);
      const json = await res.json();
      if (json.success) {
        setIssues(json.data.issues || []);
        setMetrics({
          totalIssues: json.data.totalIssues,
          totalPhotosCount: json.data.totalPhotosCount,
          criticalCount: json.data.criticalCount,
          unreadyCount: json.data.unreadyCount,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisualData();
  }, [currentBranch?.id, selectedDept]);

  const departments = [
    "الكل",
    "الكهرباء",
    "التكييف",
    "السباكة",
    "المستلزمات والنواقص",
    "النظافة",
    "الأثاث والتأثيث",
    "السلامة والأمان",
  ];

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
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 print:hidden">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Link href="/reports" className="flex items-center gap-1 hover:text-amber-600 transition font-medium">
            <ArrowRight className="w-4 h-4" />
            <span>مركز التقارير</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-slate-900">تقرير تفصيلي (الصور والملاحظات)</span>
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
            href={`/api/export/excel?reportType=visual&branchId=${currentBranch?.id || "all"}&department=${encodeURIComponent(selectedDept)}`}
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition"
          >
            <Download className="w-4 h-4" />
            <span>تصدير Excel تفصيلي</span>
          </a>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-l from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-2">
              <Camera className="w-4 h-4" />
              <span>توثيق مرئي وإثباتات ميدانية</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              التقرير التفصيلي: الصور وملاحظات المشرفين الميدانية
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              سجل بصري متكامل يحتوي على صور المعاينة المرفقة لكل عطل، ملاحظات المشرف الأصلية، التوصيات الهندسية، وإثباتات ما بعد الحل.
            </p>
          </div>

          {/* Metrics summary */}
          {metrics && (
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 shrink-0">
              <div className="text-center px-3 border-l border-white/10">
                <span className="block text-2xl font-black text-amber-400">{metrics.totalIssues}</span>
                <span className="text-[11px] text-slate-300">بلاغات مفصلة</span>
              </div>
              <div className="text-center px-3 border-l border-white/10">
                <span className="block text-2xl font-black text-white">{metrics.totalPhotosCount}</span>
                <span className="text-[11px] text-slate-300">صور وإثباتات</span>
              </div>
              <div className="text-center px-3">
                <span className="block text-2xl font-black text-rose-400">{metrics.unreadyCount}</span>
                <span className="text-[11px] text-slate-300">شقق محظورة</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 overflow-x-auto print:hidden">
        <Filter className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
        {departments.map((dept) => (
          <button
            key={dept}
            onClick={() => setSelectedDept(dept)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedDept === dept
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-50 text-slate-700 hover:bg-slate-100"
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* Main Visual Issues Cards */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">جاري تحميل الصور وملاحظات المشرفين...</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="bg-white p-16 rounded-3xl border border-slate-200 text-center space-y-3">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
          <h3 className="text-lg font-black text-slate-900">لا توجد بلاغات مسجلة وفق الفلتر المحدد</h3>
          <p className="text-xs text-slate-500">تم فحص كافة الشقق بنجاح ولم تسجل ملاحظات سلبية.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {issues.map((issue) => {
            const allPhotos = [
              ...(issue.attachments || []),
              ...(issue.inspection?.attachments || []),
            ].filter((a) => a.fileType?.includes("image") || a.mimeType?.includes("image") || a.fileUrl);

            return (
              <div
                key={issue.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-5"
              >
                {/* Card Top: Room & Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${
                        !issue.isRoomReady
                          ? "bg-rose-50 border-2 border-rose-300 text-rose-700"
                          : "bg-amber-50 border-2 border-amber-300 text-amber-800"
                      }`}
                    >
                      {issue.roomNumber}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-slate-900">شقة رقم {issue.roomNumber}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${getPriorityBadge(issue.priority)}`}>
                          أولوية: {issue.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          المبنى: {issue.apartment?.building?.name || "الرئيسي"}
                        </span>
                        <span>•</span>
                        <span>الطابق: {issue.apartment?.floor?.number || issue.floor || "غير محدد"}</span>
                        <span>•</span>
                        <span>المكان: {issue.area || "عام"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        !issue.isRoomReady
                          ? "bg-rose-50 text-rose-800 border-rose-200"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200"
                      }`}
                    >
                      {!issue.isRoomReady ? "⚠ الشقة محظورة للتسكين" : "✓ الشقة جاهزة للتسكين"}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
                      قسم: {issue.department}
                    </span>
                  </div>
                </div>

                {/* Problem Description & Supervisor Notes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Left: Issue Details */}
                  <div className="space-y-3">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 block">وصف العطل المسجل:</span>
                      <p className="text-sm font-bold text-slate-900 leading-relaxed">
                        {issue.description}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 text-[11px] font-bold">
                          التصنيف: {issue.mainType} {issue.subType ? `(${issue.subType})` : ""}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 text-[11px] font-bold">
                          الاحتياج: {issue.needType}
                        </span>
                      </div>
                    </div>

                    {/* AI & Engineering Recommendation */}
                    {issue.recommendedAction && (
                      <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-1">
                        <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>التوصية الفنية والإجراء المطلوب:</span>
                        </div>
                        <p className="text-xs text-slate-800 font-medium leading-relaxed">
                          {issue.recommendedAction}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: Supervisor's Original Inspection Notes */}
                  <div className="space-y-3">
                    <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200/70 space-y-2 h-full flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                            <span>ملاحظات المشرف الميداني أثناء الجولة:</span>
                          </div>
                          <span className="text-[10px] text-blue-700 font-medium flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {issue.inspection?.supervisorName || "المشرف الميداني"}
                          </span>
                        </div>

                        <p className="text-xs text-slate-800 font-medium leading-relaxed italic bg-white/80 p-3 rounded-xl border border-blue-100">
                          {issue.inspection?.notes || issue.evidenceDescription || "تم تسجيل الملاحظة ميدانياً وتصنيفها آلياً عبر الذكاء الاصطناعي."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-blue-100 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          تاريخ المعاينة: {new Date(issue.createdAt).toLocaleDateString("ar-SA")}
                        </span>
                        <span className="flex items-center gap-1 font-bold text-slate-700">
                          <Clock className="w-3 h-3 text-slate-400" />
                          SLA المتاح: {issue.estimatedSlaHours || 24} ساعة
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Photos & Evidence Gallery */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
                      <Camera className="w-4 h-4 text-slate-600" />
                      <span>صور المعاينة والإثباتات المرفقة ({allPhotos.length}):</span>
                    </div>
                    <span className="text-[11px] text-slate-400">انقر على أي صورة للتكبير</span>
                  </div>

                  {allPhotos.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {allPhotos.map((photo: any, idx: number) => (
                        <div
                          key={photo.id || idx}
                          onClick={() => setSelectedImage(photo.fileUrl)}
                          className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer hover:border-amber-500 transition shadow-sm"
                        >
                          <img
                            src={photo.fileUrl}
                            alt={photo.fileName || `صورة المعاينة ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                            <ExternalLink className="w-5 h-5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                      <ImageIcon className="w-4 h-4 text-slate-400" />
                      <span>تم توثيق هذا البلاغ صوتياً أو نصياً دون إرفاق صور كاميرا.</span>
                    </div>
                  )}
                </div>

                {/* Resolution Section if Closed/Resolved */}
                {(issue.status === "مكتمل" || issue.status === "مغلق" || issue.resolutionProofUrl) && (
                  <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>إجراء الإغلاق ومعالجة العطل:</span>
                      </div>
                      <p className="text-xs text-emerald-800 font-medium">
                        {issue.resolutionNotes || "تمت معالجة العطل بالكامل واعتماد مطابقة الشقة للمواصفات."}
                      </p>
                    </div>

                    {issue.resolutionProofUrl && (
                      <button
                        onClick={() => setSelectedImage(issue.resolutionProofUrl)}
                        className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold shadow-sm hover:bg-emerald-100 transition flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>عرض صورة بعد الحل</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal for Full Image View */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden p-2 shadow-2xl">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedImage}
              alt="صورة مكبرة"
              className="max-h-[85vh] w-auto mx-auto rounded-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
