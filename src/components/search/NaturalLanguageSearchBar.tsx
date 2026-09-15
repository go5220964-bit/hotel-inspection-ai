"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Search, Loader2, ArrowLeft, DoorOpen, CheckCircle2, AlertTriangle } from "lucide-react";

export default function NaturalLanguageSearchBar() {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sampleQuestions = [
    "أظهر جميع الشقق التي تحتاج إلى كهرباء",
    "أظهر النواقص في المبنى A",
    "أظهر الشقق غير الجاهزة للتسكين",
    "أظهر المشاكل الحرجة التي تحتاج صيانة عاجلة",
  ];

  const handleSearch = async (queryText?: string) => {
    const q = queryText || question;
    if (!q.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "تعذر تنفيذ البحث الذكي");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900">البحث باللغة الطبيعية (Gemini AI Search)</h2>
            <p className="text-[11px] text-slate-500">
              اكتب سؤالك بالعربية بحرية وسيترجمه Gemini إلى استعلام آمن في قاعدة البيانات (بدون SQL خام)
            </p>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="اسأل باللغة الطبيعية... مثال: أظهر جميع الشقق التي تحتاج إلى كهرباء"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={isLoading}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-2.5 text-xs text-slate-900 outline-none focus:border-amber-500 focus:bg-white transition"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition shadow"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>جاري الفهم...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>بحث ذكي</span>
            </>
          )}
        </button>
      </form>

      {/* Quick Question Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[10px] font-bold text-slate-400">أسئلة شائعة:</span>
        {sampleQuestions.map((sq, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              setQuestion(sq);
              handleSearch(sq);
            }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200 border border-transparent rounded-lg text-[11px] text-slate-600 transition"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Result Box */}
      {result && (
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 animate-in fade-in">
          {/* AI Interpretation */}
          <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] block font-semibold">تفسير الذكاء الاصطناعي للسؤال:</span>
              <span className="font-bold text-slate-800">{result.interpretation}</span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs whitespace-nowrap">
              {result.count} نتائج مطابقة
            </span>
          </div>

          {/* Results List */}
          {result.count === 0 ? (
            <div className="text-center py-4 text-xs text-slate-400">
              لا توجد بلاغات مطابقة لمعايير الاستعلام في قاعدة البيانات.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {result.data.map((iss: any) => (
                <div
                  key={iss.id}
                  className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/rooms/${iss.roomNumber}`}
                        className="font-black text-slate-900 hover:text-amber-600 flex items-center gap-1"
                      >
                        <DoorOpen className="w-3.5 h-3.5 text-amber-500" />
                        <span>الشقة {iss.roomNumber}</span>
                      </Link>
                      <span className="px-2 py-0.2 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
                        {iss.department}
                      </span>
                      <span className="px-2 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px]">
                        {iss.mainType}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 text-[10px] font-bold">
                        {iss.priority}
                      </span>
                    </div>
                    <p className="text-slate-700 text-[11px] font-medium">{iss.description}</p>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                    {iss.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}