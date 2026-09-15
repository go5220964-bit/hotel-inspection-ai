import Link from "next/link";
import prisma from "@/lib/prisma";
import { 
  Sparkles, 
  DoorClosed, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowLeft,
  Building2, 
  FileSpreadsheet,
  Layers,
  ChevronLeft
} from "lucide-react";
import NaturalLanguageSearchBar from "@/components/search/NaturalLanguageSearchBar";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const totalApartments = await prisma.apartment.count();
  const readyApartments = await prisma.apartment.count({ where: { isReady: true } });
  const unreadyApartments = totalApartments - readyApartments;
  
  const totalIssues = await prisma.issue.count();
  const criticalIssues = await prisma.issue.count({ where: { priority: "حرجة" } });
  const openIssues = await prisma.issue.count({ 
    where: { status: { notIn: ["مكتمل", "مغلق", "مرفوض"] } } 
  });

  const recentInspections = await prisma.inspection.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      issues: true,
      attachments: true,
    },
  });

  const hasApiKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 5;

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white p-8 md:p-10 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>نظام الذكاء الاصطناعي متعدد الوسائط للتفتيش الفندقي</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
            Hotel Inspection <span className="text-amber-400">AI</span>
          </h1>
          <p className="text-sm md:text-base text-slate-300 leading-relaxed font-normal">
            سجل ملاحظاتك الميدانية العشوائية أثناء تفتيش الشقق والغرف عبر الصوت، الصور، الفيديو، أو النص.
            يقوم Gemini بفهم وتفكيك الملاحظات، استخراج البلاغات وربطها بالأقسام، ورفع تقارير فورية بدقة متناهية.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/30 transition hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>بدء التفتيش والمحادثة الذكية</span>
            </Link>
            <Link
              href="/issues"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition"
            >
              <span>استعراض جميع البلاغات</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Link
              href="/reports"
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition"
            >
              <span>مركز التقارير</span>
            </Link>
          </div>
        </div>

        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Natural Language AI Search Bar */}
      <NaturalLanguageSearchBar />

      {/* API Key Status Notice if Missing */}
      {!hasApiKey && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 text-sm">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span>
              <strong>تنبيه:</strong> يرجى ضبط مفتاح <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">GEMINI_API_KEY</code> في ملف <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono">.env</code> لتفعيل التحليل المباشر بواسطة Gemini.
            </span>
          </div>
          <Link
            href="/settings/gemini"
            className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap self-start sm:self-auto"
          >
            إعداد المفتاح والنموذج
          </Link>
        </div>
      )}

      {/* Quick KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Rooms */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>إجمالي الشقق</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{totalApartments}</div>
          <div className="text-[11px] text-slate-500">
            جاهزة: <strong className="text-emerald-600">{readyApartments}</strong> | غير جاهزة: <strong className="text-rose-600">{unreadyApartments}</strong>
          </div>
        </div>

        {/* Ready Percentage */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>نسبة الجاهزية للتسكين</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600">
            {totalApartments > 0 ? Math.round((readyApartments / totalApartments) * 100) : 100}%
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${totalApartments > 0 ? (readyApartments / totalApartments) * 100 : 100}%` }}
            />
          </div>
        </div>

        {/* Open Issues */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>البلاغات المفتوحة</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600">{openIssues}</div>
          <div className="text-[11px] text-slate-500">
            إجمالي المشاكل: <strong>{totalIssues}</strong>
          </div>
        </div>

        {/* Critical Issues */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>المشاكل الحرجة</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-rose-600">{criticalIssues}</div>
          <div className="text-[11px] text-rose-600 font-medium">
            تتطلب تدخلاً فورياً
          </div>
        </div>
      </div>

      {/* Recent Inspections Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">آخر جولات التفتيش المسجلة</h2>
            <p className="text-xs text-slate-500">الجولات الميدانية المحفوظة في قاعدة بيانات PostgreSQL</p>
          </div>
          <Link
            href="/chat"
            className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            <span>الشات والتفتيش الذكي</span>
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>

        {recentInspections.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-3">
            <Building2 className="w-10 h-10 mx-auto opacity-40" />
            <p className="text-sm font-medium">لم يتم تسجيل أي جولات تفتيش بعد.</p>
            <Link
              href="/chat"
              className="inline-block px-4 py-2 bg-amber-500 text-slate-900 font-bold rounded-xl text-xs hover:bg-amber-600 transition"
            >
              ابدأ التفتيش عبر الشات الآن
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentInspections.map((insp) => (
              <Link
                key={insp.id}
                href={`/inspections/${insp.id}`}
                className="py-4 flex items-center justify-between hover:bg-slate-50/80 px-3 rounded-xl transition group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition">
                      جولة #{insp.id.slice(-6)}
                    </span>
                    <span className="text-xs text-slate-400">بواسطة {insp.supervisorName}</span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        insp.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : insp.status === "COMPLETED"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {insp.status === "APPROVED" ? "معتمد" : insp.status === "COMPLETED" ? "مكتمل التحليل" : "بانتظار التحليل"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1 max-w-xl">
                    {insp.summary || insp.notes || "لا توجد ملاحظات"}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                    {insp.issues.length} بلاغات
                  </span>
                  <span>{new Date(insp.createdAt).toLocaleDateString("ar-SA")}</span>
                  <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:-translate-x-1 transition" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}