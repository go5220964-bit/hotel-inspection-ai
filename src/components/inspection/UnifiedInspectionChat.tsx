"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  Send, 
  Mic, 
  Camera, 
  Loader2, 
  CheckCircle2, 
  DoorOpen, 
  AlertTriangle, 
  Building2, 
  Square, 
  Trash2, 
  Check, 
  X, 
  Clock, 
  ShieldAlert, 
  HelpCircle,
  RefreshCw,
  Layers,
  MapPin,
  ChevronDown
} from "lucide-react";
import { useBranch } from "@/components/layout/BranchContext";

export interface ChatIssue {
  id?: string;
  roomNumber: string;
  building?: string;
  floor?: string;
  area?: string;
  description: string;
  department: string;
  mainType?: string;
  subType?: string;
  needType?: string;
  priority: string;
  isRoomReady: boolean;
  recommendedAction?: string;
  estimatedSlaHours?: number;
  approved?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "gemini";
  text: string;
  images?: string[];
  audioUrl?: string;
  extractedIssues?: ChatIssue[];
  timestamp: string;
}

interface SelectedImage {
  name: string;
  mimeType: string;
  base64Data: string;
  previewUrl: string;
}

export default function UnifiedInspectionChat() {
  const { currentBranch } = useBranch();
  const [selectedBuilding, setSelectedBuilding] = useState<string>("المبنى الرئيسي");
  const [supervisorName, setSupervisorName] = useState("عمر المشرف");

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "gemini",
      text: `مرحباً بك في مساعد التفتيش الميداني الذكي!
أنا رفيقك التفاعلي أثناء فحص الغرف والشقق الفندقية:
• تحدث بالصوت 🎙️، التقط صور الأعطال بالكاميرا 📸، أو اكتب الملاحظات بحرية ✍️.
• سأتعرف تلقائياً على رقم الشقة وأفكك الأعطال إلى بطاقات منظمة ومصنفة لحظياً.
• يمكنك اعتماد وحفظ كل بلاغ بضغطة زر واحدة في قاعدة البيانات.
• إذا نسيت رقم الشقة، سأسألك تلقائياً لاستيضاحها فوراً.`,
      timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [approvingCardId, setApprovingCardId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Voice recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Quick Chips
  const quickChips = [
    "شقة 512 فيها تسرب ماء أسفل المغسلة واللمبة محروقة",
    "غرفة 302 التكييف لا يبرد ويوجد نقص مناشف",
    "المغسلة مسدودة والمكيف يصدر صوت عالي (بدون رقم)",
    "كم شقة محظورة عن التسكين حالياً؟",
  ];

  // Image Upload Handler
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64Data = result.split(",")[1];
        setSelectedImages((prev) => [
          ...prev,
          {
            name: file.name,
            mimeType: file.type,
            base64Data,
            previewUrl: result,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = "";
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Voice Recording Toggle
  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorder) mediaRecorder.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: "audio/webm" });
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(",")[1];
            setAudioBase64(base64);
          };
          stream.getTracks().forEach((t) => t.stop());
        };

        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
      } catch (e) {
        alert("تعذر تشغيل الميكروفون، يرجى منح الإذن في المتصفح.");
      }
    }
  };

  // Send message
  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() && !audioBase64 && selectedImages.length === 0) return;

    const currentImages = [...selectedImages];
    const userMsg: ChatMessage = {
      id: `${Date.now()}_user`,
      sender: "user",
      text: textToSend.trim() || (audioBase64 ? "🎤 تسجيل صوتي ميداني" : "📸 صور معاينة وتفتيش مرفقة"),
      images: currentImages.map((img) => img.previewUrl),
      timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    const currentAudio = audioBase64;
    setAudioBase64(null);
    setSelectedImages([]);
    setLoading(true);

    try {
      // Build history
      const history = messages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend.trim(),
          audioBase64: currentAudio,
          mediaFiles: currentImages.map((img) => ({
            mimeType: img.mimeType,
            base64Data: img.base64Data,
          })),
          branchId: currentBranch?.id,
          buildingName: selectedBuilding,
          supervisorName,
          history,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "تعذر إكمال المحادثة");
      }

      const geminiMsg: ChatMessage = {
        id: `${Date.now()}_gemini`,
        sender: "gemini",
        text: data.reply,
        extractedIssues: data.extractedIssues?.length > 0 ? data.extractedIssues : undefined,
        timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, geminiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}_err`,
          sender: "gemini",
          text: `عذراً، حدث خطأ: ${err.message}`,
          timestamp: new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Instant Single Issue Approval
  const handleApproveSingleCard = async (msgId: string, cardIdx: number, issue: ChatIssue) => {
    const cardUniqueKey = `${msgId}_${cardIdx}`;
    setApprovingCardId(cardUniqueKey);

    try {
      const res = await fetch("/api/issues/approve-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issue: {
            ...issue,
            building: issue.building || selectedBuilding,
          },
          branchId: currentBranch?.id,
          supervisorName,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id !== msgId || !msg.extractedIssues) return msg;
            const updated = [...msg.extractedIssues];
            updated[cardIdx] = { ...updated[cardIdx], approved: true };
            return { ...msg, extractedIssues: updated };
          })
        );
      } else {
        alert("تعذر اعتماد البلاغ: " + json.error);
      }
    } catch (e: any) {
      alert("خطأ أثناء الاعتماد: " + e.message);
    } finally {
      setApprovingCardId(null);
    }
  };

  // Approve all issues in a message
  const handleApproveAll = async (msgId: string, issues: ChatIssue[]) => {
    for (let i = 0; i < issues.length; i++) {
      if (!issues[i].approved) {
        await handleApproveSingleCard(msgId, i, issues[i]);
      }
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "حرجة":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "عالية":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "متوسطة":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-125px)] sm:h-[calc(100vh-135px)] max-w-4xl mx-auto bg-white sm:rounded-3xl sm:border border-slate-200 shadow-sm overflow-hidden">
      {/* 1. Header: Branch, Building Selector & Live Status */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white p-3.5 px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-tight">جولة التفتيش الفندقية التفاعلية</h1>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-300 flex items-center gap-2 mt-0.5">
              <span>الفرع: <strong>{currentBranch ? currentBranch.name : "كافة الفروع"}</strong></span>
              <span>•</span>
              <span>المشرف: <strong>{supervisorName}</strong></span>
            </p>
          </div>
        </div>

        {/* Building Selector */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-xs text-slate-200 w-full sm:w-auto">
            <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-400">المبنى:</span>
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer text-xs"
            >
              <option value="المبنى الرئيسي" className="bg-slate-900 text-white">المبنى الرئيسي</option>
              <option value="مبنى الأجنحة الملكية" className="bg-slate-900 text-white">مبنى الأجنحة الملكية</option>
              <option value="برج كبار الشخصيات VIP" className="bg-slate-900 text-white">برج كبار الشخصيات VIP</option>
              <option value="المبنى B - الشاليهات" className="bg-slate-900 text-white">المبنى B - الشاليهات</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/60">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 sm:gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-sm ${
                  isUser ? "bg-amber-500 text-slate-950" : "bg-slate-900 text-amber-400"
                }`}
              >
                {isUser ? "أنت" : <Sparkles className="w-4 h-4" />}
              </div>

              {/* Message Content */}
              <div className={`space-y-3 max-w-[88%] sm:max-w-[82%] ${isUser ? "items-end" : "items-start"}`}>
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? "bg-slate-900 text-white rounded-tl-none font-medium"
                      : "bg-white text-slate-800 border border-slate-200 rounded-tr-none shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Attached Images preview inside message */}
                  {msg.images && msg.images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2.5 pt-2 border-t border-slate-700/40">
                      {msg.images.map((imgUrl, i) => (
                        <div key={i} className="aspect-square rounded-xl overflow-hidden border border-white/20">
                          <img src={imgUrl} alt={`صورة ${i + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Real-time Extracted Defect Cards with 1-Click Approval */}
                {msg.extractedIssues && msg.extractedIssues.length > 0 && (
                  <div className="space-y-3 bg-amber-50/70 border border-amber-200/90 rounded-2xl p-3 sm:p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span>البلاغات المستخرجة آلياً ({msg.extractedIssues.length}):</span>
                      </div>

                      {msg.extractedIssues.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleApproveAll(msg.id, msg.extractedIssues!)}
                          className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                        >
                          اعتماد الكل دفعة واحدة
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {msg.extractedIssues.map((issue, idx) => {
                        const cardKey = `${msg.id}_${idx}`;
                        const isApproving = approvingCardId === cardKey;

                        return (
                          <div
                            key={idx}
                            className="bg-white rounded-2xl border border-amber-200/80 p-3.5 shadow-sm space-y-3"
                          >
                            {/* Card Top: Room, Department & Priority */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 font-black text-xs border border-amber-300">
                                  شقة {issue.roomNumber}
                                </div>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  الموقع: {issue.area || "عام"} {issue.floor ? `(طابق ${issue.floor})` : ""}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getPriorityBadge(issue.priority)}`}>
                                  {issue.priority}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                                  {issue.department}
                                </span>
                              </div>
                            </div>

                            {/* Description & Recommended Action */}
                            <div className="space-y-1.5 text-xs">
                              <p className="font-bold text-slate-900 leading-snug">
                                {issue.description}
                              </p>
                              {issue.recommendedAction && (
                                <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                  <span className="font-bold text-slate-800">الإجراء المقترح: </span>
                                  {issue.recommendedAction}
                                </p>
                              )}
                            </div>

                            {/* Room Readiness Warning Indicator */}
                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                              <span
                                className={`font-bold flex items-center gap-1 ${
                                  !issue.isRoomReady ? "text-rose-700" : "text-emerald-700"
                                }`}
                              >
                                {!issue.isRoomReady ? (
                                  <>
                                    <ShieldAlert className="w-3.5 h-3.5" />
                                    <span>محظورة عن التسكين (تمنع تسليم الغرفة)</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>الغرفة جاهزة للتسكين (عطل طفيف)</span>
                                  </>
                                )}
                              </span>

                              <span className="text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                SLA: {issue.estimatedSlaHours || 24} س
                              </span>
                            </div>

                            {/* 1-Click Instant Approval Button */}
                            <div className="pt-1">
                              {issue.approved ? (
                                <div className="w-full py-2 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                                  <Check className="w-4 h-4 text-emerald-600" />
                                  <span>تم حفظ واعتماد البلاغ بنجاح في قاعدة البيانات</span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isApproving}
                                  onClick={() => handleApproveSingleCard(msg.id, idx, issue)}
                                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
                                >
                                  {isApproving ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      <span>جاري التخزين في PostgreSQL...</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span>اعتماد وحفظ هذا البلاغ في قاعدة البيانات</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <span className="text-[10px] text-slate-400 block px-1">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 py-2 px-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            <span>المساعد الذكي يحلل الملاحظة ويستخرج بيانات البلاغ...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Selected Images Preview Bar */}
      {selectedImages.length > 0 && (
        <div className="bg-slate-100 p-2.5 px-4 border-t border-slate-200 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">الصور الملتقطة:</span>
          {selectedImages.map((img, idx) => (
            <div key={idx} className="relative group shrink-0">
              <img
                src={img.previewUrl}
                alt={img.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-300 shadow-xs"
              />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-600 text-white rounded-full flex items-center justify-center text-[10px] shadow"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quick Prompts Bar */}
      <div className="bg-white border-t border-slate-100 p-2 px-3 sm:px-4 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">اقتراحات سريعة:</span>
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(chip)}
            className="whitespace-nowrap px-2.5 py-1 bg-slate-100 hover:bg-amber-50 hover:text-amber-800 rounded-lg text-[11px] text-slate-600 transition shrink-0"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* 4. Bottom Interaction Bar (Audio, Camera, Text, Send) */}
      <div className="bg-white p-3 px-3 sm:px-4 border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Camera Button (Opens mobile camera directly) */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="p-2.5 rounded-2xl border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-amber-600 transition shrink-0"
            title="التقاط صورة بكاميرا الجوال"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Mic Button */}
          <button
            type="button"
            onClick={toggleRecording}
            className={`p-2.5 rounded-2xl border transition shrink-0 flex items-center gap-1.5 ${
              isRecording
                ? "bg-rose-600 text-white border-rose-600 animate-pulse px-3"
                : audioBase64
                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200"
            }`}
            title={isRecording ? "إيقاف التسجيل" : "تسجيل إملاء صوتي"}
          >
            {isRecording ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span className="text-[11px] font-bold font-mono">{recordingSeconds} ث</span>
              </>
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          {/* Voice recording ready chip */}
          {audioBase64 && (
            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 border border-emerald-200">
              <span>صوت جاهز</span>
              <button
                type="button"
                onClick={() => setAudioBase64(null)}
                className="text-slate-400 hover:text-rose-600"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Text Input */}
          <input
            type="text"
            placeholder="أملِ الملاحظات صوتياً، صوّر العطل، أو اكتب هنا..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 outline-none focus:border-amber-500 focus:bg-white transition"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={loading || (!input.trim() && !audioBase64 && selectedImages.length === 0)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-amber-600 disabled:opacity-40 text-white rounded-2xl text-xs sm:text-sm font-bold shadow transition cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5 rotate-180" />
            <span className="hidden sm:inline">إرسال</span>
          </button>
        </form>
      </div>
    </div>
  );
}
