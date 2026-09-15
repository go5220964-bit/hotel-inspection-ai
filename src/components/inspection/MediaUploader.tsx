"use client";

import { useState, useRef } from "react";
import { Image as ImageIcon, Video, Trash2, UploadCloud, Film, Camera, Loader2 } from "lucide-react";

export interface UploadedMediaItem {
  id: string;
  file: File;
  fileName: string;
  fileUrl?: string;
  fileType: "image" | "audio" | "video";
  mimeType: string;
  fileSize: number;
  previewUrl: string;
  base64Data: string;
}

interface MediaUploaderProps {
  mediaItems: UploadedMediaItem[];
  onMediaChanged: (items: UploadedMediaItem[]) => void;
}

export default function MediaUploader({ mediaItems, onMediaChanged }: MediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    const newItems: UploadedMediaItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let fileType: "image" | "audio" | "video" = "image";
      if (file.type.startsWith("video/")) fileType = "video";
      else if (file.type.startsWith("audio/")) fileType = "audio";

      const previewUrl = URL.createObjectURL(file);

      // تحويل الملف إلى Base64 لتقديمه لـ Gemini
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
      });

      newItems.push({
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        file,
        fileName: file.name,
        fileType,
        mimeType: file.type || (fileType === "image" ? "image/jpeg" : "video/mp4"),
        fileSize: file.size,
        previewUrl,
        base64Data,
      });
    }

    onMediaChanged([...mediaItems, ...newItems]);
    setIsUploading(false);
  };

  const handleRemove = (id: string) => {
    const item = mediaItems.find((m) => m.id === id);
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
    onMediaChanged(mediaItems.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-3">
      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => processFiles(e.target.files)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => processFiles(e.target.files)}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          capture="environment"
          className="hidden"
          onChange={(e) => processFiles(e.target.files)}
        />

        {/* Buttons */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          <UploadCloud className="w-4 h-4 text-blue-600" />
          <span>إرفاق صور أو فيديو</span>
        </button>

        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          <Camera className="w-4 h-4 text-amber-600" />
          <span>التقاط صورة بالكاميرا</span>
        </button>

        <button
          type="button"
          onClick={() => videoInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          <Film className="w-4 h-4 text-purple-600" />
          <span>تصوير فيديو تفتيش</span>
        </button>

        {isUploading && (
          <span className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>جاري تجهيز الملفات...</span>
          </span>
        )}
      </div>

      {/* Thumbnails Preview Grid */}
      {mediaItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
          {mediaItems.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square flex items-center justify-center shadow-sm"
            >
              {item.fileType === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.previewUrl}
                  alt={item.fileName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-2 text-center text-purple-700">
                  <Video className="w-8 h-8 mb-1 text-purple-600" />
                  <span className="text-[10px] font-bold line-clamp-1 max-w-[90px]">{item.fileName}</span>
                  <span className="text-[9px] text-slate-500">{Math.round(item.fileSize / 1024)} KB</span>
                </div>
              )}

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="absolute top-1.5 left-1.5 p-1 bg-black/60 hover:bg-rose-600 text-white rounded-lg transition"
                title="إلغاء المرفق"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <span className="absolute bottom-1 right-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                {item.fileType === "image" ? "صورة" : "فيديو"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}