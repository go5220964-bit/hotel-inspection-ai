import * as XLSX from "xlsx";

export interface IssueExcelRow {
  "رقم الشقة": string;
  "المبنى": string;
  "الطابق": string;
  "المكان": string;
  "وصف المشكلة": string;
  "القسم المسؤول": string;
  "التصنيف الرئيسي": string;
  "التصنيف الفرعي": string;
  "نوع الاحتياج": string;
  "الأولوية": string;
  "الحالة": string;
  "جاهزية الشقة": string;
  "الإجراء الموصى به": string;
  "اتفاقية الـ SLA (ساعات)": number;
  "متأخرة عن SLA": string;
  "مشكلة متكررة": string;
  "إجراء الحل": string;
  "تاريخ التسجيل": string;
}

export class ExcelService {
  public static generateIssuesWorkbook(issues: any[], title: string = "تقرير البلاغات الفندقية"): Buffer {
    const rows: IssueExcelRow[] = issues.map((iss) => {
      const isOverdue = iss.slaDeadline && new Date(iss.slaDeadline) < new Date() && !["مكتمل", "مغلق"].includes(iss.status);

      return {
        "رقم الشقة": iss.roomNumber || "",
        "المبنى": iss.building || "الرئيسي",
        "الطابق": iss.floor || "",
        "المكان": iss.area || "عام",
        "وصف المشكلة": iss.description || "",
        "القسم المسؤول": iss.department || "",
        "التصنيف الرئيسي": iss.mainType || "",
        "التصنيف الفرعي": iss.subType || "",
        "نوع الاحتياج": iss.needType || "",
        "الأولوية": iss.priority || "متوسطة",
        "الحالة": iss.status || "جديد",
        "جاهزية الشقة": iss.isRoomReady ? "جاهزة للتسكين" : "غير جاهزة (محظورة)",
        "الإجراء الموصى به": iss.recommendedAction || "",
        "اتفاقية الـ SLA (ساعات)": iss.estimatedSlaHours || 24,
        "متأخرة عن SLA": isOverdue ? "نعم (متأخرة)" : "ضمن الوقت",
        "مشكلة متكررة": iss.isRecurring ? "نعم" : "لا",
        "إجراء الحل": iss.resolutionNotes || "",
        "تاريخ التسجيل": new Date(iss.createdAt).toLocaleDateString("ar-SA"),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!views"] = [{ RTL: true }];
    worksheet["!cols"] = [
      { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 14 },
      { wch: 35 }, { wch: 16 }, { wch: 14 }, { wch: 14 },
      { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 18 },
      { wch: 28 }, { wch: 14 }, { wch: 14 }, { wch: 12 },
      { wch: 25 }, { wch: 14 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, title.substring(0, 31));
    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  }

  public static generateAggregateWorkbook(data: any): Buffer {
    const summaryRows = [
      { "المؤشر": "اسم الفرع", "القيمة": data.branchName || "كافة الفروع", "أرقام الشقق المعنية": "-" },
      { "المؤشر": "إجمالي عدد الشقق في الفرع", "القيمة": data.totalApartments || 0, "أرقام الشقق المعنية": "-" },
      { "المؤشر": "الشقق الجاهزة للتسكين", "القيمة": data.readyApartments || 0, "أرقام الشقق المعنية": "-" },
      { "المؤشر": "الشقق غير الجاهزة (محظورة)", "القيمة": data.blockedApartments || 0, "أرقام الشقق المعنية": (data.blockedRoomNumbers || []).join(", ") },
      { "المؤشر": "نسبة الجاهزية العامة", "القيمة": `${data.readinessRate || 0}%`, "أرقام الشقق المعنية": "-" },
      { "المؤشر": "عدد الشقق التي فيها عطل كهرباء", "القيمة": data.electricityCount || 0, "أرقام الشقق المعنية": (data.electricityRooms || []).join(", ") },
      { "المؤشر": "عدد الشقق التي فيها نقص مطبخ ومستلزمات", "القيمة": data.kitchenShortageCount || 0, "أرقام الشقق المعنية": (data.kitchenRooms || []).join(", ") },
      { "المؤشر": "عدد الشقق التي فيها عطل سباكة", "القيمة": data.plumbingCount || 0, "أرقام الشقق المعنية": (data.plumbingRooms || []).join(", ") },
      { "المؤشر": "عدد الشقق التي فيها عطل تكييف", "القيمة": data.acCount || 0, "أرقام الشقق المعنية": (data.acRooms || []).join(", ") },
      { "المؤشر": "عدد الشقق التي تحتاج نظافة", "القيمة": data.cleaningCount || 0, "أرقام الشقق المعنية": (data.cleaningRooms || []).join(", ") },
      { "المؤشر": "عدد الشقق التي فيها تلف أثاث", "القيمة": data.furnitureCount || 0, "أرقام الشقق المعنية": (data.furnitureRooms || []).join(", ") },
    ];

    const worksheet = XLSX.utils.json_to_sheet(summaryRows);
    worksheet["!views"] = [{ RTL: true }];
    worksheet["!cols"] = [{ wch: 38 }, { wch: 18 }, { wch: 45 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "تقرير الأعداد الإجمالي");
    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  }

  public static generateVisualReportWorkbook(issues: any[], branchName?: string): Buffer {
    const rows = issues.map((iss) => {
      const photosCount = (iss.attachments || []).filter((a: any) => a.fileType?.includes("image") || a.mimeType?.includes("image")).length;
      return {
        "رقم الشقة": iss.roomNumber || "",
        "المبنى": iss.building || "الرئيسي",
        "الطابق": iss.floor || "",
        "المكان": iss.area || "عام",
        "القسم": iss.department || "",
        "الأولوية": iss.priority || "متوسطة",
        "الحالة": iss.status || "جديد",
        "وصف المشكلة": iss.description || "",
        "ملاحظات المشرف الميداني": iss.inspection?.notes || iss.evidenceDescription || "-",
        "عدد الصور المرفقة": photosCount,
        "الإجراء الموصى به": iss.recommendedAction || "",
        "جاهزية التسكين": iss.isRoomReady ? "جاهزة" : "غير جاهزة (محظورة)",
        "إجراء الحل المنفذ": iss.resolutionNotes || "قيد الانتظار",
        "تاريخ التفتيش": new Date(iss.createdAt).toLocaleDateString("ar-SA"),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!views"] = [{ RTL: true }];
    worksheet["!cols"] = [
      { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 14 },
      { wch: 16 }, { wch: 10 }, { wch: 12 }, { wch: 35 },
      { wch: 35 }, { wch: 15 }, { wch: 28 }, { wch: 18 },
      { wch: 25 }, { wch: 14 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "التقرير التفصيلي والصور");
    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  }
}