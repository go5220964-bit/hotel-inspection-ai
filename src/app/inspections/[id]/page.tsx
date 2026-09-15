"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  DoorOpen, 
  Trash2,
  FileCheck,
  Loader2,
  HelpCircle,
  ArrowRight,
  Image as ImageIcon,
  Volume2,
  Video as VideoIcon
} from "lucide-react";
import { IssueParsed } from "@/lib/schemas/inspection.schema";

export default function InspectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [inspection, setInspection] = useState<any>(null);
  const [issues, setIssues] = useState<IssueParsed[]>([]);
  const [clarificationAnswer, setClarificationAnswer] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const departmentsList = [
    "الصيانة",
    "التدبير الفندقي",
    "المستودع",
    "المشتريات",
    "الأمن والسلامة",
    "تقنية المعلومات",
    "إدارة الأصول",
    "الإدارة",
  ];

  const priorityOptions = ["حرجة", "عالية", "متوسطة", "منخفضة"] as const;

  useEffect(() => {
    fetch(`/api/inspections/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setInspection(data.data);
          if (data.data.status === "APPROVED") {
            setIsApproved(true);
            setIssues(data.data.issues || []);
          } else if (data.data.parsedAiResponse?.issues) {
            setIssues(data.data.parsedAiResponse.issues);
          }
        } else {
          setError(data.error || "تعذر جلب تفاصيل التفتيش");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdateIssue = (index: number, field: keyof IssueParsed, value: any) => {
    const updated = [...issues];
    (updated[index] as any)[field] = value;
    setIssues(updated);
  };

  const handleDeleteIssue = (index: number) => {
    setIssues(issues.filter((_, i) => i !== index));
  };

  const handleApplyClarification = () => {
    if (!clarificationAnswer.trim()) return;
    const updated = issues.map((iss) => {
      if (!iss.roomNumber || iss.roomNumber === "غير محدد" || iss.roomNumber === "") {
        return { ...iss, roomNumber: clarificationAnswer.trim() };
      }
      return iss;
    });
    setIssues(updated);
    if (inspection?.parsedAiResponse) {
      inspection.parsedAiResponse.needsClarification = false;
    }
    setClarificationAnswer("");
  };

  const handleApproveAll = async () => {
    if (issues.length === 0) {
      setError("لا توجد مشاكل معتمدة للحفظ");
      return;
    }

    const missingRooms = issues.some((iss) => !iss.roomNumber || iss.roomNumber === "غير محدد");
    if (missingRooms) {
      setError("يرجى تحديد رقم الشقة/الغرفة لجميع البلاغات قبل الاعتماد");
      return;
    }

    setIsApproving(true);
    setError(null);

    try {
      const res = await fetch(`/api/inspections/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issues,
          approvedBy: inspection?.supervisorName || "عمر المشرف",
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "فشل اعتماد المشاكل");
      }

      setIsApproved(true);
      setSuccessMessage(data.message || "تم اعتماد البلاغات وإحالتها للأقسام بنجاح!");
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء الاعتماد");
    } finally {
      setIsApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <span className="text-sm font-semibold text-slate-600">جاري تحميل نتيجة تحليل Gemini...</span>
      </div>
    );
  }

  if (error && !inspection) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-2xl max-w-xl mx-auto text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold">خطأ في استرجاع التفتيش</h2>
        <p className="text-sm">{error}</p>
        <Link
          href="/inspections/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لجولة جديدة</span>
        </Link>
      </div>
    );
  }

  const aiData = inspection?.parsedAiResponse;
  const attachments = inspection?.attachments || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Breadcrumb & Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-amber-600">الرئيسية</Link>
          <span>/</span>
          <Link href="/inspections/new" className="hover:text-amber-600">الجولات</Link>
          <span>/</span>
          <span className="font-bold text-slate-800">نتيجة الفحص #{id.slice(-6)}</span>
        </div>

        <div className="flex items-center gap-2">
          {isApproved ? (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>معتمد ومسجل في قاعدة البيانات</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>بانتظار مراجعة واعتماد المشرف</span>
            </span>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-900 p-5 rounded-2xl shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FileCheck className="w-7 h-7 text-emerald-600 flex-shrink-0" />
            <div>
              <h3 className="text-base font-bold">اكتمل الاعتماد بنجاح!</h3>
              <p className="text-xs text-emerald-700 mt-0.5">{successMessage}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/issues"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition"
            >
              عرض قائمة البلاغات
            </Link>
          </div>
        </div>
      )}

      {/* AI Summary Card */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white p-6 rounded-2xl shadow-md space-y-4 border border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">ملخص جولة التفتيش (Gemini AI)</h2>
          </div>
          <span className="text-xs text-slate-300 font-medium">
            المشرف: {inspection?.supervisorName} | {new Date(inspection?.createdAt).toLocaleTimeString("ar-SA")}
          </span>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed font-normal">
          {aiData?.inspectionSummary || inspection?.summary || "تم تحليل الملاحظة واستخراج البلاغات الفنية والإدارية."}
        </p>

        {/* Original Note and Media Bar */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {inspection?.notes && (
            <div className="text-slate-400">
              <span className="font-semibold text-slate-300">النص المسجل: </span>
              <span className="italic">{inspection.notes}</span>
            </div>
          )}

          {/* Media Attachments Preview */}
          {attachments.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-amber-400 font-bold">المرفقات المحفوظة ({attachments.length}):</span>
              {attachments.map((att: any, i: number) => (
                <a
                  key={i}
                  href={att.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-slate-200 flex items-center gap-1 text-[11px]"
                >
                  {att.fileType === "image" ? <ImageIcon className="w-3 h-3" /> : att.fileType === "audio" ? <Volume2 className="w-3 h-3" /> : <VideoIcon className="w-3 h-3" />}
                  <span>{att.fileType === "image" ? `صورة ${i+1}` : att.fileType === "audio" ? "تسجيل صوتي" : "فيديو"}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Clarification Alert if needsClarification */}
      {aiData?.needsClarification && !isApproved && (
        <div className="bg-amber-50 border-2 border-amber-300 p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-900">سؤال توضيحي من الذكاء الاصطناعي:</h3>
              <p className="text-sm font-medium text-amber-800 mt-1">
                {aiData.clarificationQuestion || "لم يستطع النظام تحديد رقم الشقة بدقة من الملاحظة. يرجى تزويدنا برقم الشقة لتحديث البلاغات."}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="اكتب رقم الشقة هنا (مثال: 512)"
              value={clarificationAnswer}
              onChange={(e) => setClarificationAnswer(e.target.value)}
              className="w-64 bg-white border border-amber-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={handleApplyClarification}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow transition"
            >
              تطبيق على البلاغات
            </button>
          </div>
        </div>
      )}

      {/* Issues Review Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>البلاغات المستخرجة</span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
              {issues.length} مشكلة
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            راجع وصحح البيانات قبل الاعتماد لنقلها وإحالتها إلى الأقسام المسؤولة.
          </p>
        </div>

        {!isApproved && (
          <button
            onClick={handleApproveAll}
            disabled={isApproving || issues.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            {isApproving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري الحفظ والاعتماد...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>اعتماد وإحالة البلاغات للأقسام</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Extracted Issues Cards */}
      <div className="space-y-4">
        {issues.map((issue, idx) => {
          const isCritical = issue.priority === "حرجة";
          const isHigh = issue.priority === "عالية";
          const priorityColor = isCritical
            ? "bg-rose-100 text-rose-800 border-rose-200"
            : isHigh
            ? "bg-orange-100 text-orange-800 border-orange-200"
            : issue.priority === "متوسطة"
            ? "bg-amber-100 text-amber-800 border-amber-200"
            : "bg-slate-100 text-slate-800 border-slate-200";

          return (
            <div
              key={idx}
              className={`bg-white rounded-2xl border ${
                isCritical ? "border-rose-300 shadow-rose-50" : "border-slate-200"
              } p-5 shadow-sm space-y-4 transition hover:shadow-md`}
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>

                  {/* Room Badge */}
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-800">
                    <DoorOpen className="w-3.5 h-3.5 text-amber-600" />
                    <span>الشقة:</span>
                    {isApproved ? (
                      <span>{issue.roomNumber}</span>
                    ) : (
                      <input
                        type="text"
                        value={issue.roomNumber || ""}
                        onChange={(e) => handleUpdateIssue(idx, "roomNumber", e.target.value)}
                        className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs font-bold text-slate-900 w-16 text-center outline-none focus:border-amber-500"
                      />
                    )}
                  </div>

                  {/* Area */}
                  {issue.area && (
                    <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                      المكان: {issue.area}
                    </span>
                  )}

                  {/* Confidence */}
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                    دقة AI: {Math.round((issue.confidence || 1) * 100)}%
                  </span>

                  {/* Ready Badge */}
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      issue.isRoomReady
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {issue.isRoomReady ? "الشقة قابلة للتسكين" : "الشقة غير جاهزة (محظورة)"}
                  </span>
                </div>

                {/* Priority Selector & Delete */}
                <div className="flex items-center gap-2">
                  <div className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${priorityColor}`}>
                    {isApproved ? (
                      <span>أولوية: {issue.priority}</span>
                    ) : (
                      <select
                        value={issue.priority}
                        onChange={(e) => handleUpdateIssue(idx, "priority", e.target.value as any)}
                        className="bg-transparent font-bold outline-none cursor-pointer"
                      >
                        {priorityOptions.map((p) => (
                          <option key={p} value={p}>أولوية: {p}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {!isApproved && (
                    <button
                      type="button"
                      onClick={() => handleDeleteIssue(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="حذف البلاغ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Description Input / Text */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">وصف المشكلة:</label>
                {isApproved ? (
                  <p className="text-sm text-slate-900 font-medium bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {issue.description}
                  </p>
                ) : (
                  <textarea
                    rows={2}
                    value={issue.description}
                    onChange={(e) => handleUpdateIssue(idx, "description", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 font-medium outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                )}
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="block text-slate-500 font-semibold mb-1">القسم المسؤول:</span>
                  {isApproved ? (
                    <span className="font-bold text-slate-800">{issue.department}</span>
                  ) : (
                    <select
                      value={issue.department}
                      onChange={(e) => handleUpdateIssue(idx, "department", e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 font-bold text-slate-800 outline-none"
                    >
                      {departmentsList.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <span className="block text-slate-500 font-semibold mb-1">النوع الرئيسي:</span>
                  {isApproved ? (
                    <span className="font-bold text-slate-800">{issue.mainType} {issue.subType ? `(${issue.subType})` : ""}</span>
                  ) : (
                    <input
                      type="text"
                      value={issue.mainType}
                      onChange={(e) => handleUpdateIssue(idx, "mainType", e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 font-bold text-slate-800 outline-none"
                    />
                  )}
                </div>

                <div>
                  <span className="block text-slate-500 font-semibold mb-1">نوع الاحتياج:</span>
                  <span className="font-bold text-slate-800">{issue.needType}</span>
                </div>

                <div>
                  <span className="block text-slate-500 font-semibold mb-1">الزمن المتوقع (SLA):</span>
                  <span className="font-bold text-slate-800">{issue.estimatedSlaHours || 24} ساعة</span>
                </div>
              </div>

              {/* Recommended Action & Evidence */}
              {(issue.recommendedAction || issue.evidenceDescription) && (
                <div className="flex flex-wrap gap-4 text-xs text-slate-600 pt-1">
                  {issue.recommendedAction && (
                    <div>
                      <span className="font-bold text-slate-700">الإجراء الموصى به: </span>
                      <span>{issue.recommendedAction}</span>
                    </div>
                  )}
                  {issue.evidenceDescription && (
                    <div>
                      <span className="font-bold text-slate-700">الدليل المرصود: </span>
                      <span className="text-amber-700 font-medium">{issue.evidenceDescription}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Action */}
      {!isApproved && issues.length > 0 && (
        <div className="flex justify-end pt-4 pb-12">
          <button
            onClick={handleApproveAll}
            disabled={isApproving}
            className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-base rounded-xl shadow-lg shadow-emerald-600/25 transition cursor-pointer"
          >
            {isApproving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري الحفظ في PostgreSQL...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>اعتماد جميع البلاغات وحفظها في قاعدة البيانات</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}