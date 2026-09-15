"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, Trash2, Volume2, Loader2, Check } from "lucide-react";

interface AudioRecorderProps {
  onAudioRecorded: (file: { blob: Blob; base64: string; mimeType: string; fileName: string; duration: number }) => void;
  onAudioRemoved: () => void;
}

export default function AudioRecorder({ onAudioRecorded, onAudioRemoved }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/ogg";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // تحويل الصوت إلى Base64 لـ Gemini
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(",")[1];
          onAudioRecorded({
            blob: audioBlob,
            base64: base64String,
            mimeType,
            fileName: `تسجيل_تفتيش_${Date.now()}.${mimeType.includes("webm") ? "webm" : "mp4"}`,
            duration: recordingTime,
          });
        };

        // إيقاف جميع المسارات لتحرير الميكروفون
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250); // تجميع كل 250ms
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("تعذر الوصول إلى الميكروفون:", err);
      setHasPermission(false);
      alert("تعذر الوصول إلى الميكروفون. يرجى التأكد من منح الإذن في المتصفح.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleRemoveAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingTime(0);
    onAudioRemoved();
  };

  const togglePlayback = () => {
    if (!audioElementRef.current && audioUrl) {
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => setIsPlaying(false);
    }

    if (audioElementRef.current) {
      if (isPlaying) {
        audioElementRef.current.pause();
        setIsPlaying(false);
      } else {
        audioElementRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? "0" : ""}${remaining}`;
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
      {/* Recording State */}
      {!audioUrl && !isRecording && (
        <button
          type="button"
          onClick={startRecording}
          className="flex items-center gap-2 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition shadow-sm"
        >
          <Mic className="w-4 h-4 text-rose-600 animate-pulse" />
          <span>بدء التسجيل الصوتي للملاحظة</span>
        </button>
      )}

      {/* Live Recording Indicator */}
      {isRecording && (
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
          </span>
          <span className="text-xs font-mono font-bold text-rose-700">
            جاري التسجيل: {formatTime(recordingTime)}
          </span>
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow transition"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>إيقاف وحفظ الصوت</span>
          </button>
        </div>
      )}

      {/* Audio Playback & Actions */}
      {audioUrl && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlayback}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? "إيقاف مؤقت" : "استماع للتسجيل"}</span>
          </button>
          <span className="text-xs font-mono text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
            {formatTime(recordingTime)}
          </span>
          <button
            type="button"
            onClick={handleRemoveAudio}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="حذف التسجيل"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      <span className="text-[11px] text-slate-400">
        يتم إرسال التسجيل الصوتي مباشرة لـ Gemini لتحليله واستخراج المشاكل تلقائياً
      </span>
    </div>
  );
}