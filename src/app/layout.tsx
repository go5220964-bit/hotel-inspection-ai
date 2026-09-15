import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { BranchProvider } from "@/components/layout/BranchContext";

export const metadata: Metadata = {
  title: "Hotel Inspection AI - نظام التفتيش الفندقي الذكي",
  description: "نظام شات ذكي للتفتيش الفندقي وإدارة جودة الشقق والغرف بالذكاء الاصطناعي متعدد الوسائط",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900">
        <BranchProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
            نظام Hotel Inspection AI &copy; {new Date().getFullYear()} - فروع فندقية مستقلة ومدعومة بـ Gemini Multimodal AI
          </footer>
        </BranchProvider>
      </body>
    </html>
  );
}