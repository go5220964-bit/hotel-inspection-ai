"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  DoorOpen, 
  Search, 
  Filter, 
  Sparkles, 
  ShieldAlert, 
  Wrench, 
  X, 
  Check, 
  ExternalLink,
  ChevronDown,
  Loader2,
  Calendar,
  Layers,
  FileSpreadsheet
} from "lucide-react";

export default function AllIssuesPage() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("الكل");
  const [selectedPriority, setSelectedPriority] = useState("الكل");
  const [selectedStatus, setSelectedStatus] = useState("الكل");

  // Close Issue Modal State
  const [closingIssue, setClosingIssue] = useState<any | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolutionProofUrl, setResolutionProofUrl] = useState("");
  const [isSubmittingClose, setIsSubmittingClose] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  const fetchIssues = () => {
    setLoading(true);
    fetch("/api/issues")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setIssues(data.data);
        } else {
          setError(data.error || "تعذر جلب البلاغات");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  // Quick Preset Tabs
  const quickTabs = [
    { id: "all", label: "جميع البلاغات" },
    { id: "electricity", label: "⚡ مشاكل الكهرباء", filter: (i: any) => i.mainType === "كهرباء" },
    { id: "plumbing", label: "🚰 مشاكل السباكة", filter: (i: any) => i.mainType === "سباكة" },
    { id: "hvac", label: "❄️ مشاكل التكييف", filter: (i: any) => i.mainType === "تكييف" },
    { id: "shortages", label: "📦 النواقص والمستلزمات", filter: (i: any) => i.mainType === "نقص مستلزمات" || i.needType === "توريد" },
    { id: "furnishing", label: "🪑 احتياجات التأثيث", filter: (i: any) => i.mainType === "تأثيث" || i.needType === "تأثيث" },
    { id: "unready", label: "🚫 شقق غير جاهزة", filter: (i: any) => !i.isRoomReady },
    { id: "critical", label: "🔥 بلاغات حرجة", filter: (i: any) => i.priority === "حرجة" },
  ];

  // Filtered Issues Computation
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      // Tab filter
      const tabObj = quickTabs.find((t) => t.id === activeTab);
      if (tabObj && tabObj.filter && !tabObj.filter(issue)) return false;

      // Department filter
      if (selectedDept !== "الكل" && issue.department !== selectedDept) return false;

      // Priority filter
      if (selectedPriority !== "الكل" && issue.priority !== selectedPriority) return false;

      // Status filter
      if (selectedStatus !== "الكل" && issue.status !== selectedStatus) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchRoom = issue.roomNumber.toLowerCase().includes(query);
        const matchDesc = issue.description.toLowerCase().includes(query);
        const matchArea = (issue.area || "").toLowerCase().includes(query);
        const matchAction = (issue.recommendedAction || "").toLowerCase().includes(query);
        if (!matchRoom && !matchDesc && !matchArea && !matchAction) return false;
      }

      return true;
    });
  }, [issues, activeTab, selectedDept, selectedPriority, selectedStatus, searchQuery]);

  // Quick Status Update
  const handleStatusChange = async (issueId: string, newStatus: string) => {
    if (newStatus === "مكتمل" || newStatus === "مغلق") {
      const target = issues.find((i) => i.id === issueId);
      setClosingIssue(target);
      setResolutionNotes("");
      setResolutionProofUrl("");
      setCloseError(null);
      return;
    }

    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setIssues((prev) => prev.map((i) => (i.id === issueId ? { ...i, status: newStatus } : i)));
      }
    } catch (err: any) {
      alert("خطأ في تحديث الحالة: " + err.message);
    }
  };

  // Submit Issue Closure with mandatory resolution notes
  const handleSubmitClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      setCloseError("يرجى كتابة الإجراء المنفذ لحل المشكلة قبل الإغلاق");
      return;
    }

    setIsSubmittingClose(true);
    setCloseError(null);

    try {
      const res = await fetch(`/api/issues/${closingIssue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "مغلق",
          resolutionNotes: resolutionNotes.trim(),
          resolutionProofUrl: resolutionProofUrl.trim() || undefined,
          performedBy: "مشرف الصيانة",
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "فشل إغلاق البلاغ");
      }

      setIssues((prev) =>
        prev.map((i) => (i.id === closingIssue.id ? { ...i, status: "مغلق", resolutionNotes } : i))
      );
      setClosingIssue(null);
    } catch (err: any) {
      setCloseError(err.message);
    } finally {
      setIsSubmittingClose(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
            <span>مركز إدارة البلاغات والمشاكل</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            استعراض، تصفية، وتحديث حالة البلاغات المستخرجة آلياً عبر الذكاء الاصطناعي وإدارتها حسب الأقسام
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/inspections/new"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow transition"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>تسجيل جولة جديدة</span>
          </Link>
        </div>
      </div>

      {/* Quick Category / Operational View Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {quickTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="بحث برقم الشقة، الوصف، أو المكان..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-slate-900 outline-none focus:border-amber-500"
          />
        </div>

        {/* Department Filter */}
        <div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 outline-none"
          >
            <option value="الكل">كل الأقسام المسؤولـة</option>
            <option value="الصيانة">الصيانة</option>
            <option value="التدبير الفندقي">التدبير الفندقي</option>
            <option value="المستودع">المستودع</option>
            <option value="المشتريات">المشتريات</option>
            <option value="الأمن والسلامة">الأمن والسلامة</option>
            <option value="تقنية المعلومات">تقنية المعلومات</option>
            <option value="إدارة الأصول">إدارة الأصول</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 outline-none"
          >
            <option value="الكل">كافة الأولويات</option>
            <option value="حرجة">حرجة 🔥</option>
            <option value="عالية">عالية</option>
            <option value="متوسطة">متوسطة</option>
            <option value="منخفضة">منخفضة</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 outline-none"
          >
            <option value="الكل">كافة الحالات</option>
            <option value="جديد">جديد</option>
            <option value="معتمد">معتمد</option>
            <option value="قيد التنفيذ">قيد التنفيذ</option>
            <option value="بانتظار قطعة غيار">بانتظار قطعة غيار</option>
            <option value="مكتمل">مكتمل</option>
            <option value="مغلق">مغلق</option>
          </select>
        </div>
      </div>

      {/* Issues Count & Result Info */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          عرض <strong className="text-slate-900">{filteredIssues.length}</strong> بلاغ من إجمالي{" "}
          <strong>{issues.length}</strong>
        </span>
      </div>

      {/* Issues List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <span className="text-xs font-semibold text-slate-500">جاري تحميل البلاغات من PostgreSQL...</span>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto opacity-70" />
          <h3 className="text-base font-bold text-slate-800">لا توجد بلاغات مطابقة لمعايير البحث</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            جميع الشقق بحالة ممتازة وفق الفلاتر المختارة، أو يمكنك إزالة الفلترة لعرض كافة البيانات.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredIssues.map((issue) => {
            const isClosed = issue.status === "مغلق" || issue.status === "مكتمل";
            const isCritical = issue.priority === "حرجة";
            const isHigh = issue.priority === "عالية";

            const priorityBadge = isCritical
              ? "bg-rose-100 text-rose-800 border-rose-200"
              : isHigh
              ? "bg-orange-100 text-orange-800 border-orange-200"
              : issue.priority === "متوسطة"
              ? "bg-amber-100 text-amber-800 border-amber-200"
              : "bg-slate-100 text-slate-700 border-slate-200";

            return (
              <div
                key={issue.id}
                className={`bg-white rounded-2xl border ${
                  isClosed ? "border-slate-200 opacity-80" : isCritical ? "border-rose-300 shadow-rose-50" : "border-slate-200"
                } p-5 shadow-sm space-y-3 hover:shadow-md transition`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Room Link */}
                    <Link
                      href={`/rooms/${issue.roomNumber}`}
                      className="flex items-center gap-1 px-3 py-1 bg-slate-900 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition group"
                    >
                      <DoorOpen className="w-3.5 h-3.5 text-amber-400 group-hover:text-white" />
                      <span>الشقة {issue.roomNumber}</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </Link>

                    {issue.area && (
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs">
                        {issue.area}
                      </span>
                    )}

                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-semibold">
                      القسم: {issue.department}
                    </span>

                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs">
                      {issue.mainType} {issue.subType ? `(${issue.subType})` : ""}
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-md border text-xs font-bold ${priorityBadge}`}>
                      {issue.priority}
                    </span>

                    {/* Room Ready State */}
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        issue.isRoomReady
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {issue.isRoomReady ? "جاهزة للتسكين" : "غير جاهزة"}
                    </span>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">الحالة:</span>
                    <select
                      value={issue.status}
                      onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border outline-none cursor-pointer transition ${
                        isClosed
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : "bg-amber-50 text-amber-900 border-amber-300"
                      }`}
                    >
                      <option value="جديد">جديد</option>
                      <option value="معتمد">معتمد</option>
                      <option value="قيد التنفيذ">قيد التنفيذ</option>
                      <option value="بانتظار قطعة غيار">بانتظار قطعة غيار</option>
                      <option value="مكتمل">مكتمل (يتطلب تقرير إصلاح)</option>
                      <option value="مغلق">مغلق (إغلاق نهائي)</option>
                      <option value="مرفوض">مرفوض</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                  {issue.description}
                </p>

                {/* Recommended Action & Evidence */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap gap-4">
                    {issue.recommendedAction && (
                      <div>
                        <strong className="text-slate-700">الإجراء المقترح: </strong>
                        <span>{issue.recommendedAction}</span>
                      </div>
                    )}
                    {issue.resolutionNotes && (
                      <div className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                        <strong>إجراء الحل: </strong>
                        <span>{issue.resolutionNotes}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span>SLA: {issue.estimatedSlaHours} ساعة</span>
                    <span>{new Date(issue.createdAt).toLocaleDateString("ar-SA")}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mandatory Issue Close Modal */}
      {closingIssue && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  إغلاق البلاغ للشقة {closingIssue.roomNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setClosingIssue(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <strong>وصف المشكلة:</strong> {closingIssue.description}
            </p>

            {closeError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-semibold">
                {closeError}
              </div>
            )}

            <form onSubmit={handleSubmitClose} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  إجراء الإصلاح المنفذ (إلزامي لإغلاق البلاغ):
                </label>
                <textarea
                  rows={3}
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="اكتب بالتفصيل ما تم إنجازه (مثال: تم تغيير جلدة الصنبور وإصلاح التسرب واختباره بنجاح)..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رابط صورة الإثبات بعد الإصلاح (اختياري):
                </label>
                <input
                  type="text"
                  value={resolutionProofUrl}
                  onChange={(e) => setResolutionProofUrl(e.target.value)}
                  placeholder="https://... أو /uploads/proof_123.jpg"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setClosingIssue(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingClose}
                  className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition"
                >
                  {isSubmittingClose ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>تأكيد الإصلاح وإغلاق البلاغ</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}