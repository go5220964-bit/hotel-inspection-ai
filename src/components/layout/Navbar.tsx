"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Building2, 
  ClipboardCheck, 
  AlertTriangle, 
  BedDouble, 
  BarChart3, 
  Settings, 
  Sparkles,
  MessageSquare,
  Layers,
  MapPin
} from "lucide-react";
import BranchSwitcher from "./BranchSwitcher";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "الرئيسية", icon: Building2 },
    { href: "/inspections/new", label: "جولة التفتيش الذكية", icon: Sparkles, highlight: true },
    { href: "/issues", label: "البلاغات", icon: AlertTriangle },
    { href: "/rooms", label: "الشقق", icon: BedDouble },
    { href: "/reports", label: "التقارير", icon: BarChart3 },
    { href: "/branches", label: "الفروع", icon: MapPin },
    { href: "/settings/gemini", label: "إعدادات AI", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black text-slate-900 tracking-tight leading-none">
                  Hotel Inspection <span className="text-amber-600">AI</span>
                </span>
                <span className="text-[10px] text-slate-500 font-medium mt-0.5">نظام التفتيش الفندقي الذكي</span>
              </div>
            </Link>

            {/* Branch Switcher Component */}
            <div className="hidden sm:block">
              <BranchSwitcher />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));

              if (item.highlight) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-sm transition-all"
                  >
                    <Icon className="w-3.5 h-3.5 text-slate-950" />
                    <span>{item.label}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    isActive
                      ? "bg-slate-100 text-amber-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile Branch Switcher + User Profile */}
          <div className="flex items-center gap-2">
            <div className="block sm:hidden">
              <BranchSwitcher />
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-amber-500 flex items-center justify-center font-bold text-slate-700 text-xs">
              ع
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}