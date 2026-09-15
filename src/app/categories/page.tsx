import prisma from "@/lib/prisma";
import { Layers, CheckCircle2, Plus, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-7 h-7 text-amber-500" />
            <span>التصنيفات المرجعية المعتمدة</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            قوائم التصنيفات التي يستند إليها Gemini API ديناميكياً أثناء فهم واستخراج البلاغات (دون أي if/else ثابت)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const subs = cat.subCategories ? cat.subCategories.split(",") : [];
          const needs = cat.needTypes ? cat.needTypes.split(",") : [];

          return (
            <div key={cat.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <h2 className="text-base font-black text-slate-900">{cat.name}</h2>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold">
                  القسم: {cat.departmentDefault || "الصيانة"}
                </span>
              </div>

              {/* Sub Categories */}
              <div>
                <span className="block text-[11px] font-bold text-slate-500 mb-1.5">التصنيفات الفرعية الشائعة:</span>
                <div className="flex flex-wrap gap-1">
                  {subs.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]">
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Need Types */}
              <div>
                <span className="block text-[11px] font-bold text-slate-500 mb-1.5">أنواع الاحتياج:</span>
                <div className="flex flex-wrap gap-1">
                  {needs.map((n, i) => (
                    <span key={i} className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded text-[11px] font-semibold">
                      {n.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}