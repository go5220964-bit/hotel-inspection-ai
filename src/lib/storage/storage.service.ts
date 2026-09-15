import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface StoredFile {
  originalName: string;
  fileName: string;
  fileUrl: string;
  fileType: "image" | "audio" | "video" | "document";
  mimeType: string;
  fileSize: number;
  base64Data: string;
}

const ALLOWED_MIME_TYPES = new Set([
  // صور
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  // صوت
  "audio/webm",
  "audio/mp3",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/m4a",
  "audio/x-m4a",
  // فيديو
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB حد أقصى

export class StorageService {
  private static uploadsDir = path.join(process.cwd(), "public", "uploads");

  public static async saveUploadedFile(file: File): Promise<StoredFile> {
    // 1. التحقق من حجم الملف
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`حجم الملف كبير جداً (${Math.round(file.size / (1024 * 1024))}MB). الحد الأقصى المسموح به هو 50MB.`);
    }

    // 2. التحقق من نوع الملف لمنع رفع ملفات تنفيذية ضارة
    const mimeType = file.type || "application/octet-stream";
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new Error(`نوع الملف غير مسموح به (${mimeType}). يسمح فقط بالصور، التسجيلات الصوتية، ومقاطع الفيديو.`);
    }

    // 3. تحديد تصنيف الملف
    let fileType: "image" | "audio" | "video" | "document" = "document";
    if (mimeType.startsWith("image/")) fileType = "image";
    else if (mimeType.startsWith("audio/")) fileType = "audio";
    else if (mimeType.startsWith("video/")) fileType = "video";

    // 4. إنشاء اسم فريد وآمن للملف
    const ext = path.extname(file.name) || (fileType === "audio" ? ".webm" : fileType === "image" ? ".jpg" : ".mp4");
    const uniqueId = crypto.randomBytes(12).toString("hex");
    const safeFileName = `${Date.now()}_${uniqueId}${ext}`;

    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }

    const filePath = path.join(this.uploadsDir, safeFileName);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // حفظ الملف محلياً في مجلد uploads
    fs.writeFileSync(filePath, buffer);

    const base64Data = buffer.toString("base64");
    const fileUrl = `/uploads/${safeFileName}`;

    return {
      originalName: file.name,
      fileName: safeFileName,
      fileUrl,
      fileType,
      mimeType,
      fileSize: file.size,
      base64Data,
    };
  }

  public static async saveBase64File(base64Data: string, mimeType: string, originalName?: string): Promise<StoredFile> {
    const buffer = Buffer.from(base64Data, "base64");
    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error("حجم الملف يتجاوز 50MB");
    }

    let fileType: "image" | "audio" | "video" | "document" = "document";
    if (mimeType.startsWith("image/")) fileType = "image";
    else if (mimeType.startsWith("audio/")) fileType = "audio";
    else if (mimeType.startsWith("video/")) fileType = "video";

    const ext = mimeType.includes("jpeg") || mimeType.includes("jpg") ? ".jpg" :
                mimeType.includes("png") ? ".png" :
                mimeType.includes("webp") ? ".webp" :
                mimeType.includes("webm") ? (fileType === "audio" ? ".webm" : ".webm") :
                mimeType.includes("mp4") ? ".mp4" :
                mimeType.includes("wav") ? ".wav" :
                mimeType.includes("mp3") || mimeType.includes("mpeg") ? ".mp3" : ".bin";

    const uniqueId = crypto.randomBytes(12).toString("hex");
    const safeFileName = `${Date.now()}_${uniqueId}${ext}`;

    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }

    const filePath = path.join(this.uploadsDir, safeFileName);
    fs.writeFileSync(filePath, buffer);

    return {
      originalName: originalName || safeFileName,
      fileName: safeFileName,
      fileUrl: `/uploads/${safeFileName}`,
      fileType,
      mimeType,
      fileSize: buffer.length,
      base64Data,
    };
  }
}