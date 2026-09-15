"use client";

import { useBranch } from "./BranchContext";
import { Building2, ChevronDown, MapPin, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function BranchSwitcher() {
  const { currentBranch, setCurrentBranch, branches, loading } = useBranch();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition border border-slate-200"
      >
        <MapPin className="w-3.5 h-3.5 text-amber-600" />
        <span className="max-w-[150px] truncate">
          {currentBranch ? currentBranch.name : "كافة الفروع"}
        </span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
          <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span>اختر الفرع للفلترة والعزل:</span>
            <Link href="/branches" onClick={() => setIsOpen(false)} className="text-amber-600 hover:underline">
              إدارة الفروع
            </Link>
          </div>

          <button
            type="button"
            onClick={() => {
              setCurrentBranch(null);
              setIsOpen(false);
            }}
            className="w-full text-right px-3 py-2 text-xs font-bold hover:bg-slate-50 flex items-center justify-between text-slate-700"
          >
            <span>كافة الفروع (نظرة شاملة)</span>
            {!currentBranch && <Check className="w-4 h-4 text-amber-600" />}
          </button>

          {branches.map((b) => {
            const isSelected = currentBranch?.id === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  setCurrentBranch(b);
                  setIsOpen(false);
                }}
                className={`w-full text-right px-3 py-2 text-xs flex items-center justify-between transition ${
                  isSelected ? "bg-amber-50 text-amber-900 font-bold" : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div>
                  <span className="block">{b.name}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {b.city} ({b.apartmentsCount || 0} شقة)
                  </span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-amber-600 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}