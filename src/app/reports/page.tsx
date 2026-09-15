"use client";

import React from "react";
import Link from "next/link";
import { useBranch } from "@/components/layout/BranchContext";
import {
  DoorClosed,
  Layers,
  BarChart3,
  Camera,
  Download,
  ArrowRight,
  Printer,
  Sparkles,
  Zap,
  Utensils,
  Droplets,
  Wind,
  FileSpreadsheet,
  Building2,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

export default function ReportsHubPage() {
  const { currentBranch } = useBranch();

  const reports = [
    {
      id: "by-room",
      href: "/reports/by-room",
      title: "تقرير برقم الشقة وجميع الأعطال المسجلة فيها",
      badge: "سجل الشقة والوحدات",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
      icon: DoorClosed,
      iconColor: "text-amber-600 bg-amber-50 border-amber-200",
      description:
        "استعراض تاريخي شامل لأي شقة بالفرع؛ يعرض كافة الأعطال، البلاغات المفتوحة والمغلقة، والأولويات، وتأثيرها على جاهزية التسكين.",
      features: [
        "سجل تاريخي كامل لكل شقة بمفردها.",
        "فرز فوري حسب رقم الغرفة وموقع العطل.",
        "توضيح حالة جاهزية التسكين (جاهزة / محظورة).",
        "تصدير وطباعة تقرير الشقة بنقرة واحدة.",
      ],
      excelType: "room",
      buttonText: "فتح تقرير الشقق",
    },
    {
      id: "by-department",
      href: "/reports/by-department",
      title: "تقرير بالأقسام والشقق المتأثرة",
      badge: "لفرق التشغيل والصيانة",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      icon: Layers,
      iconColor: "text-blue-600 bg-blue-50 border-blue-200",
      description:
        "توزيع البلاغات حسب الأقسام (كهرباء، تكييف، سباكة، نظافة، أثاث...) ويعرض قائمة الشقق التي تحتاج لتدخل كل قسم على حدة.",
      features: [
        "تصفح حسب القسم (كهرباء، تكييف، سباكة...).",
        "حصر مباشر لكافة الشقق المتأثرة بكل قسم.",
        "تحديد البلاغات الحرجة والمتأخرة عن SLA.",
        "توجيه مباشر لمهندسي وفنيي الأقسام.",
      ],
      excelType: "department",
      buttonText: "فتح تقرير الأقسام",
    },
    {
      id: "aggregate-counts",
      href: "/reports/aggregate-counts",
      title: "تقرير إجمالي بالأعداد وحصر النواقص والأعطال",
      badge: "مؤشرات وإحصائيات كمية",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: BarChart3,
      iconColor: "text-emerald-600 bg-emerald-50 border-emerald-200",
      description:
        "حصر كمي دقيق: عدد الشقق التي فيها عطل كهرباء، عدد الشقق التي فيها نقص مطبخ ومستلزمات، سباكة، تكييف، ومؤشر جاهزية التسكين.",
      features: [
        "عدد الشقق التي فيها عطل كهرباء مع أرقامها.",
        "عدد الشقق التي فيها نقص مطبخ ومستلزمات.",
        "عدد الشقق التي فيها عطل سباكة وتكييف.",
        "مؤشر الجاهزية للتسكين (% الشقق الجاهزة).",
      ],
      excelType: "aggregate",
      buttonText: "فتح التقرير الإجمالي بالأعداد",
    },
    {
      id: "detailed-visual",
      href: "/reports/detailed-visual",
      title: "تقرير تفصيلي يحتوي الصور والملاحظات",
      badge: "توثيق بالصور وملاحظات المشرفين",
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      icon: Camera,
      iconColor: "text-purple-600 bg-purple-50 border-purple-200",
      description:
        "تقرير مرئي عالي الدقة يجمع صور المعاينة الميدانية، ملاحظات المشرف الأصلية، التوصيات الهندسية، وإثباتات ما بعد المعالجة.",
      features: [
        "معرض صور فوتوغرافية عالية الجودة لكل عطل.",
        "نص ملاحظات المشرف الميداني الأصلية أثناء الجولة.",
        "توصيات الذكاء الاصطناعي الهندسية لمعالجة المشكلة.",
        "إثباتات وصور بعد إغلاق البلاغ والإصلاح.",
      ],
      excelType: "visual",
      buttonText: "فتح التقرير التفصيلي والمرئي",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-amber-500" />
              <span>مركز التقارير الفندقية المعتمدة</span>
            </h1>
            {currentBranch && (
              <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                فرع: {currentBranch.name}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            التقارير الأربعة الرئيسية المعتمدة مع استقلالية تامة لبيانات كل فرع ودعم كامل للطباعة وتصدير Excel.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <a
            href={`/api/export/excel?reportType=issues&branchId=${currentBranch?.id || "all"}`}
            download
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تصدير كافة البلاغات (Excel)</span>
          </a>
        </div>
      </div>

      {/* The 4 Main Dedicated Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <div
              key={report.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-lg transition-all space-y-5 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${report.iconColor}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${report.badgeColor}`}>
                    {report.badge}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-black text-slate-900 group-hover:text-amber-600 transition">
                    {report.title}
                  </h2>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed min-h-[40px]">
                  {report.description}
                </p>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1.5">أبرز محتويات التقرير:</span>
                  <ul className="text-xs text-slate-600 space-y-1">
                    {report.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link
                  href={report.href}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition group-hover:scale-[1.02]"
                >
                  <span>{report.buttonText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href={`/api/export/excel?reportType=${report.excelType}&branchId=${currentBranch?.id || "all"}`}
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                  title="تنزيل ملف Excel مخصص لهذا التقرير"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Excel</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Quick Access Banner */}
      <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black">الشات الذكي للاستعلام والتحليل الفوري</h4>
            <p className="text-xs text-slate-300">
              يمكنك أيضاً سؤال المساعد الذكي بأي استفسار تريده مثل: &quot;كم شقة محظورة بالفرع؟&quot; أو &quot;اعطني أعطال شقة 101&quot;.
            </p>
          </div>
        </div>

        <Link
          href="/chat"
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition whitespace-nowrap"
        >
          فتح الشات الذكي
        </Link>
      </div>
    </div>
  );
}