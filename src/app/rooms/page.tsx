"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { BedDouble, CheckCircle2, AlertTriangle, Search, Filter, ArrowLeft, DoorOpen, Building2, Calendar, Loader2 } from "lucide-react";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterReady, setFilterReady] = useState("all"); // all, ready, unready

  useEffect(() => {
    fetch("/api/rooms")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setRooms(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (filterReady === "ready" && !r.isReady) return false;
      if (filterReady === "unready" && r.isReady) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNum = r.number.toLowerCase().includes(q);
        const matchType = (r.type || "").toLowerCase().includes(q);
        const matchBuilding = (r.building?.name || "").toLowerCase().includes(q);
        if (!matchNum && !matchType && !matchBuilding) return false;
      }
      return true;
    });
  }, [rooms, filterReady, search]);

  const readyCount = rooms.filter((r) => r.isReady).length;
  const unreadyCount = rooms.length - readyCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <BedDouble className="w-7 h-7 text-amber-500" />
            <span>سجل الشقق والغرف الفندقية</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            متابعة حالة الجاهزية اللحظية، المشاكل الفنية المفتوحة، وتاريخ آخر تفتيش لكل شقة
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            جاهزة للتسكين: {readyCount}
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
            غير جاهزة: {unreadyCount}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="بحث برقم الشقة أو المبنى..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-900 outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <button
            onClick={() => setFilterReady("all")}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              filterReady === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            الكل ({rooms.length})
          </button>
          <button
            onClick={() => setFilterReady("ready")}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              filterReady === "ready" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            جاهزة ({readyCount})
          </button>
          <button
            onClick={() => setFilterReady("unready")}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              filterReady === "unready" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            غير جاهزة ({unreadyCount})
          </button>
        </div>
      </div>

      {/* Grid of Rooms */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <span className="text-xs font-semibold text-slate-500">جاري تحميل قائمة الشقق...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredRooms.map((room) => {
            const hasCritical = room.criticalCount > 0;
            const hasOpen = room.openIssuesCount > 0;

            return (
              <Link
                key={room.id}
                href={`/rooms/${room.number}`}
                className={`bg-white rounded-2xl border ${
                  !room.isReady
                    ? "border-rose-300 shadow-rose-50 hover:border-rose-400"
                    : "border-slate-200 hover:border-amber-400"
                } p-5 shadow-sm space-y-3 transition hover:shadow-md block group`}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-amber-500 group-hover:text-white transition flex items-center justify-center font-black text-base text-slate-900">
                      {room.number}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900">{room.type}</span>
                      <span className="block text-[11px] text-slate-400">
                        {room.building?.name || "المبنى الرئيسي"}
                      </span>
                    </div>
                  </div>

                  {/* Readiness Status Icon */}
                  <span
                    className={`w-3 h-3 rounded-full ${
                      room.isReady ? "bg-emerald-500 shadow-emerald-200" : "bg-rose-500 shadow-rose-200 animate-pulse"
                    } shadow-md`}
                    title={room.isReady ? "جاهزة للتسكين" : "غير جاهزة"}
                  />
                </div>

                {/* Status Badge */}
                <div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                      room.isReady
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {room.isReady ? "جاهزة للتسكين" : "غير جاهزة (محظورة)"}
                  </span>
                </div>

                {/* Issues Info */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    {hasOpen ? (
                      <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                        {room.openIssuesCount} مشاكل مفتوحة
                      </span>
                    ) : (
                      <span className="font-semibold text-emerald-600">لا توجد ملاحظات</span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400">عرض التفاصيل &larr;</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}