"use client";

import { useEffect, useState } from "react";
import { Settings, Sparkles, Key, CheckCircle2, AlertCircle, Save, ExternalLink } from "lucide-react";

export default function GeminiSettingsPage() {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gemini-2.5-flash");
  const [hasKey, setHasKey] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setHasKey(data.hasKey);
          setModel(data.currentModel || "gemini-2.5-flash");
        }
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, model }),
      });
      const data = await res.json();
      if (data.success) {
        setHasKey(data.hasKey);
        setMessage("تم حفظ الإعدادات بنجاح في الجلسة الحالية!");
        setApiKey("");
      }
    } catch (e: any) {
      setMessage("خطأ في الحفظ: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-200 flex items-center justify-center text-amber-600">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">إعدادات محرك Gemini AI</h1>
            <p className="text-xs text-slate-500">تكوين النموذج، المفاتيح، والربط الذكي للتفتيش الفندقي</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border">
          <span className={`w-2 h-2 rounded-full ${hasKey ? "bg-emerald-500" : "bg-amber-500 animate-ping"}`} />
          <span>حالة المفتاح: {hasKey ? "متصل ونشط" : "غير مدخل"}</span>
        </div>
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        {/* Model Selection */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1">
            اسم نموذج Gemini (من المتغير GEMINI_MODEL):
          </label>
          <p className="text-xs text-slate-500 mb-2">
            يمكنك كتابة أي نموذج متاح في Google AI Studio (غير مثبت في الكود إطلاقاً)
          </p>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="gemini-2.5-flash أو gemini-1.5-flash أو gemini-2.5-pro"
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-900 outline-none focus:border-amber-500"
          />
        </div>

        {/* API Key Input */}
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1">
            مفتاح Google Gemini API Key:
          </label>
          <p className="text-xs text-slate-500 mb-2">
            احصل على مفتاح مجاني من{" "}
            <a
              href="https://aistudio.google.com/"
              target="_blank"
              rel="noreferrer"
              className="text-amber-600 underline font-semibold inline-flex items-center gap-1"
            >
              <span>Google AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
          <div className="relative">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={hasKey ? "•••••••••••••••••••••••• (المفتاح محفوظ بالفعل، اكتب هنا لتغييره)" : "AIzaSy..."}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-900 outline-none focus:border-amber-500"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            ملاحظة: يمكنك أيضاً تعيين المفتاح بشكل دائم في ملف <code className="bg-slate-100 px-1 py-0.5 rounded">.env</code> عبر <code className="bg-slate-100 px-1 py-0.5 rounded">GEMINI_API_KEY</code>.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl shadow transition cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>حفظ التعديلات</span>
        </button>
      </form>
    </div>
  );
}