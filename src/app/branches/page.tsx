"use client";

import { useEffect, useState } from "react";
import { 
  Building2, 
  Plus, 
  Edit3, 
  Trash2, 
  MapPin, 
  Phone, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Save, 
  Loader2 
} from "lucide-react";
import { useBranch } from "@/components/layout/BranchContext";

export default function BranchesPage() {
  const { branches, refreshBranches } = useBranch();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [managerName, setManagerName] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditingBranch(null);
    setName("");
    setCode("");
    setCity("");
    setAddress("");
    setPhone("");
    setManagerName("");
    setStatus("ACTIVE");
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (b: any) => {
    setEditingBranch(b);
    setName(b.name);
    setCode(b.code);
    setCity(b.city || "");
    setAddress(b.address || "");
    setPhone(b.phone || "");
    setManagerName(b.managerName || "");
    setStatus(b.status || "ACTIVE");
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setFormError("اسم الفرع والرمز مطلوبان");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const url = editingBranch ? `/api/branches/${editingBranch.id}` : "/api/branches";
      const method = editingBranch ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim(),
          city: city.trim(),
          address: address.trim(),
          phone: phone.trim(),
          managerName: managerName.trim(),
          status,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "فشلت العملية");

      setModalOpen(false);
      refreshBranches();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (b: any) => {
    if (!confirm(`هل أنت متأكد من حذف الفرع "${b.name}"؟ سيتم حذف كافة الشقق والبلاغات التابعة له.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/branches/${b.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "فشل الحذف");
      refreshBranches();
    } catch (err: any) {
      alert("خطأ أثناء الحذف: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-amber-500" />
            <span>إدارة فروع الفندق واستقلالية البيانات</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إضافة، تعديل، وحذف الفروع؛ مع عزل تام للبيانات والبلاغات والشات لكل فرع فندقي على حدة
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 transition self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة فرع فندقي جديد</span>
        </button>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {branches.map((b: any) => (
          <div
            key={b.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 hover:shadow-md transition flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-black text-slate-900">{b.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px] font-bold">
                      {b.code}
                    </span>
                    <span className="text-xs text-slate-500">{b.city || "المدينة"}</span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    b.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {b.status === "ACTIVE" ? "نشط" : "معطل"}
                </span>
              </div>

              {/* Branch Details */}
              <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {b.managerName && (
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>المدير المسؤول: <strong>{b.managerName}</strong></span>
                  </div>
                )}
                {b.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-mono">{b.phone}</span>
                  </div>
                )}
                {b.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span className="truncate">{b.address}</span>
                  </div>
                )}
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="block text-slate-400 text-[10px]">الشقق</span>
                  <span className="text-base font-black text-slate-900">{b.apartmentsCount || 0}</span>
                </div>
                <div className="bg-amber-50 p-2 rounded-lg border border-amber-100">
                  <span className="block text-amber-600 text-[10px]">بلاغات مفتوحة</span>
                  <span className="text-base font-black text-amber-700">{b.openIssuesCount || 0}</span>
                </div>
                <div className="bg-rose-50 p-2 rounded-lg border border-rose-100">
                  <span className="block text-rose-600 text-[10px]">غير جاهزة</span>
                  <span className="text-base font-black text-rose-700">{b.unreadyCount || 0}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => openEditModal(b)}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                title="تعديل الفرع"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(b)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="حذف الفرع"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Branch Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingBranch ? "تعديل بيانات الفرع" : "إضافة فرع فندقي جديد"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الفرع (مطلوب):</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فندق الأندلس - فرع مكة المكرمة"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رمز الفرع (فريد ومطلوب):</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: MAK-01"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المدينة:</label>
                  <input
                    type="text"
                    placeholder="مثال: مكة المكرمة"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المدير المسؤول:</label>
                  <input
                    type="text"
                    placeholder="مثال: أ. فيصل السبيعي"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الهاتف:</label>
                  <input
                    type="text"
                    placeholder="+966 ..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">العنوان التفصيلي:</label>
                <input
                  type="text"
                  placeholder="شارع إبراهيم الخليل، حي أجياد"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold shadow"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{editingBranch ? "حفظ التعديلات" : "إضافة الفرع"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}