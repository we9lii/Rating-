// @ts-ignore - xlsx-js-style is a drop-in replacement for xlsx with style support
import * as XLSX from 'xlsx-js-style';
import { WeeklyReport } from '../types';
import { formatDate } from './date';

// ============================================================
// Color Palette (Matched to Screenshot)
// ============================================================
const C = {
  darkBlue: '1F4E78',    // Main Title & Table Headers
  medBlue: '2F75B5',     // Section Headers (مؤشرات الأداء, القسم الأول, etc)
  lightBlue: 'DDEBF7',   // Subtitle row & Metric Labels
  white: 'FFFFFF',
  text: '000000',
  greenText: '00B050',   // Completed checkmark color
  redText: 'C00000',     // Not completed color
  altBg: 'F2F2F2',       // Alternating row background
  borderColor: 'A6A6A6', // Subtle border color
};

// ============================================================
// Style Builders
// ============================================================
const thinBorder = {
  top: { style: 'thin', color: { rgb: C.borderColor } },
  bottom: { style: 'thin', color: { rgb: C.borderColor } },
  left: { style: 'thin', color: { rgb: C.borderColor } },
  right: { style: 'thin', color: { rgb: C.borderColor } },
};

const S = {
  title: {
    font: { name: 'Tahoma', sz: 12, bold: true, color: { rgb: C.white } },
    fill: { fgColor: { rgb: C.darkBlue } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: thinBorder,
  },
  subtitle: {
    font: { name: 'Tahoma', sz: 10, bold: true, color: { rgb: C.medBlue } },
    fill: { fgColor: { rgb: C.white } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: thinBorder,
  },
  sectionHeader: {
    font: { name: 'Tahoma', sz: 10, bold: true, color: { rgb: C.white } },
    fill: { fgColor: { rgb: C.medBlue } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: thinBorder,
  },
  colHeader: {
    font: { name: 'Tahoma', sz: 9, bold: true, color: { rgb: C.white } },
    fill: { fgColor: { rgb: C.darkBlue } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: thinBorder,
  },
  label: {
    font: { name: 'Tahoma', sz: 9, bold: true, color: { rgb: C.text } },
    fill: { fgColor: { rgb: C.white } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: thinBorder,
  },
  value: {
    font: { name: 'Tahoma', sz: 9, color: { rgb: C.text } },
    fill: { fgColor: { rgb: C.white } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: thinBorder,
  },
  metricHeader: {
    font: { name: 'Tahoma', sz: 9, bold: true, color: { rgb: C.text } },
    fill: { fgColor: { rgb: C.lightBlue } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: thinBorder,
  },
  metricValue: {
    font: { name: 'Tahoma', sz: 10, bold: true, color: { rgb: C.darkBlue } },
    fill: { fgColor: { rgb: C.white } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: thinBorder,
  },
  rowCenter: {
    font: { name: 'Tahoma', sz: 9, color: { rgb: C.text } },
    fill: { fgColor: { rgb: C.white } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: thinBorder,
  },
  altRowCenter: {
    font: { name: 'Tahoma', sz: 9, color: { rgb: C.text } },
    fill: { fgColor: { rgb: C.altBg } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: thinBorder,
  },
  completed: {
    font: { name: 'Tahoma', sz: 9, bold: true, color: { rgb: C.greenText } },
    fill: { fgColor: { rgb: C.white } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: thinBorder,
  },
  altCompleted: {
    font: { name: 'Tahoma', sz: 9, bold: true, color: { rgb: C.greenText } },
    fill: { fgColor: { rgb: C.altBg } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: thinBorder,
  },
  notCompleted: {
    font: { name: 'Tahoma', sz: 9, bold: true, color: { rgb: C.redText } },
    fill: { fgColor: { rgb: C.white } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: thinBorder,
  },
  altNotCompleted: {
    font: { name: 'Tahoma', sz: 9, bold: true, color: { rgb: C.redText } },
    fill: { fgColor: { rgb: C.altBg } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: thinBorder,
  },
} as const;

// ============================================================
// Helpers
// ============================================================
function setCell(ws: XLSX.WorkSheet, r: number, c: number, value: string | number, style: any): void {
  const ref = XLSX.utils.encode_cell({ r, c });
  ws[ref] = { v: value, t: typeof value === 'number' ? 'n' : 's', s: style };
}

function fillRow(ws: XLSX.WorkSheet, r: number, startC: number, endC: number, style: any): void {
  for (let c = startC; c <= endC; c++) {
    const ref = XLSX.utils.encode_cell({ r, c });
    if (!ws[ref]) ws[ref] = { v: '', t: 's', s: style };
  }
}

function merge(ws: XLSX.WorkSheet, sr: number, sc: number, er: number, ec: number): void {
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: sr, c: sc }, e: { r: er, c: ec } });
}

function setRowH(ws: XLSX.WorkSheet, r: number, h: number): void {
  if (!ws['!rows']) ws['!rows'] = [];
  ws['!rows'][r] = { hpt: h };
}

// Columns A to H = 8 columns
const FULL_PAGE_COLS = [
  { wch: 5 },   // A: #
  { wch: 35 },  // B: اسم المهمة
  { wch: 30 },  // C: الوصف
  { wch: 12 },  // D: الأهمية / الحالة
  { wch: 15 },  // E: حالة التنفيذ
  { wch: 12 },  // F: التقييم
  { wch: 25 },  // G: سبب عدم الإنجاز
  { wch: 20 },  // H: ملاحظات
];

const MAX_COL = 7; // Column H is index 7

// ============================================================
// Export Single Report
// ============================================================
export function exportWeeklyReport(report: WeeklyReport): void {
  const wb = XLSX.utils.book_new();
  const ws: XLSX.WorkSheet = {};
  const weekNum = report.weekId.split('-W')[1];
  const completed = report.previousWeekTasks.filter(t => t.status === 'completed').length;
  const total = report.previousWeekTasks.length;

  ws['!cols'] = FULL_PAGE_COLS;
  let r = 0;

  // ── Row 1: Title ──
  setCell(ws, r, 0, 'تقرير الأعمال الأسبوعية', S.title);
  fillRow(ws, r, 1, MAX_COL, S.title);
  merge(ws, r, 0, r, MAX_COL);
  setRowH(ws, r, 26);
  r++;

  // ── Row 2: Subtitle dates ──
  setCell(ws, r, 0, `${report.employeeName} | أسبوع ${weekNum} | ${formatDate(report.weekStartDate)} إلى ${formatDate(report.weekEndDate)}`, S.subtitle);
  fillRow(ws, r, 1, MAX_COL, S.subtitle);
  merge(ws, r, 0, r, MAX_COL);
  setRowH(ws, r, 20);
  r++;

  // ── Row 3: Employee Info ──
  setCell(ws, r, 0, '', S.value);
  setCell(ws, r, 1, report.employeeName, S.value);
  setCell(ws, r, 2, 'الاسم', S.label); // Match image layout
  setCell(ws, r, 3, report.weekId.split('-W')[1], S.value);
  setCell(ws, r, 4, 'الأسبوع', S.label);
  setCell(ws, r, 5, report.submittedAt ? formatDate(report.submittedAt) : '-', S.value);
  merge(ws, r, 5, r, 6);
  fillRow(ws, r, 6, 6, S.value);
  setCell(ws, r, 7, 'التسليم', S.label);
  setRowH(ws, r, 18);
  r++;

  // ── Row 4: Metrics Header ──
  setCell(ws, r, 0, 'مؤشرات الأداء', S.sectionHeader);
  fillRow(ws, r, 1, MAX_COL, S.sectionHeader);
  merge(ws, r, 0, r, MAX_COL);
  setRowH(ws, r, 20);
  r++;

  // ── Row 5: Metric Labels ──
  const mLabels = ['مؤشر الأداء', 'نسبة الإنجاز', 'متوسط التقييم', 'المنجزة', 'الإجمالي', 'المخططة', '', ''];
  mLabels.forEach((l, c) => setCell(ws, r, c, l, S.metricHeader));
  setRowH(ws, r, 18);
  r++;

  // ── Row 6: Metric Values ──
  const mVals: (string | number)[] = [
    `${report.metrics?.performanceIndicator || 0}%`,
    `${report.metrics?.completionRate || 0}%`,
    `${report.metrics?.averageEvaluation || 0}/10`,
    completed, total,
    report.currentWeekTasks.length, '', ''
  ];
  mVals.forEach((v, c) => setCell(ws, r, c, v, S.metricValue));
  setRowH(ws, r, 22);
  r++;

  // ── Row 7: Prev Week Section Header ──
  setCell(ws, r, 0, 'القسم الأول: ما تم إنجازه (تقييم خطة الأسبوع المنصرف)', S.sectionHeader);
  fillRow(ws, r, 1, MAX_COL, S.sectionHeader);
  merge(ws, r, 0, r, MAX_COL);
  setRowH(ws, r, 20);
  r++;

  // ── Row 8: Prev Week Table Headers ──
  const prevH = ['#', 'اسم المهمة', 'الوصف', 'الأهمية', 'حالة التنفيذ', 'التقييم', 'سبب عدم الإنجاز', 'ملاحظات'];
  prevH.forEach((h, c) => setCell(ws, r, c, h, S.colHeader));
  setRowH(ws, r, 22);
  r++;

  // ── Rows 9+: Prev Week Tasks ──
  if (report.previousWeekTasks.length > 0) {
    report.previousWeekTasks.forEach((task, i) => {
      const alt = i % 2 === 1;
      const cs = alt ? S.altRowCenter : S.rowCenter;
      const ssCompleted = alt ? S.altCompleted : S.completed;
      const ssNotCompleted = alt ? S.altNotCompleted : S.notCompleted;
      const ss = task.status === 'completed' ? ssCompleted : ssNotCompleted;

      setCell(ws, r, 0, i + 1, cs);
      setCell(ws, r, 1, task.name + (task.isUnplanned ? ' ★' : ''), cs);
      setCell(ws, r, 2, task.description || '-', cs);
      setCell(ws, r, 3, `${task.importance}/10`, cs);
      setCell(ws, r, 4, task.status === 'completed' ? 'منجز ✓' : 'لم يتم ✗', ss);
      setCell(ws, r, 5, task.evaluationScore !== undefined ? `${task.evaluationScore}/10` : '-', cs);
      setCell(ws, r, 6, task.reasonNotCompleted || '-', cs);
      setCell(ws, r, 7, task.isUnplanned ? 'مهمة إضافية' : '-', cs);
      setRowH(ws, r, 20);
      r++;
    });
  } else {
    setCell(ws, r, 0, '', S.rowCenter);
    setCell(ws, r, 1, 'لا توجد مهام من الأسبوع الماضي', S.rowCenter);
    fillRow(ws, r, 2, MAX_COL, S.rowCenter);
    r++;
  }

  // ── Current Week Section Header ──
  setCell(ws, r, 0, 'القسم الثاني: خطة الأسبوع الحالي', S.sectionHeader);
  fillRow(ws, r, 1, MAX_COL, S.sectionHeader);
  merge(ws, r, 0, r, MAX_COL);
  setRowH(ws, r, 20);
  r++;

  // ── Current Week Table Headers ──
  const curH = ['#', 'اسم المهمة', 'الوصف', 'الأهمية', 'الحالة', 'الأولوية', 'ملاحظات', ''];
  curH.forEach((h, c) => setCell(ws, r, c, h, S.colHeader));
  setRowH(ws, r, 22);
  r++;

  // ── Current Week Tasks ──
  if (report.currentWeekTasks.length > 0) {
    report.currentWeekTasks.forEach((task, i) => {
      const alt = i % 2 === 1;
      const cs = alt ? S.altRowCenter : S.rowCenter;

      setCell(ws, r, 0, i + 1, cs);
      setCell(ws, r, 1, task.name, cs);
      setCell(ws, r, 2, task.description || '-', cs);
      setCell(ws, r, 3, `${task.importance}/10`, cs);
      setCell(ws, r, 4, 'مخطط', cs);
      setCell(ws, r, 5, task.importance >= 8 ? 'عالية' : task.importance >= 5 ? 'متوسطة' : 'منخفضة', cs);
      setCell(ws, r, 6, '-', cs);
      setCell(ws, r, 7, '', cs);
      setRowH(ws, r, 20);
      r++;
    });
  } else {
    setCell(ws, r, 0, '', S.rowCenter);
    setCell(ws, r, 1, 'لا توجد مهام مخططة', S.rowCenter);
    fillRow(ws, r, 2, MAX_COL, S.rowCenter);
    r++;
  }

  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: r - 1, c: MAX_COL } });

  XLSX.utils.book_append_sheet(wb, ws, `تقرير أسبوع ${weekNum}`);

  // Apply RTL Workbook-wide
  if (!wb.Workbook) wb.Workbook = {};
  if (!wb.Workbook.Views) wb.Workbook.Views = [];
  if (!wb.Workbook.Views[0]) wb.Workbook.Views[0] = {};
  wb.Workbook.Views[0].RTL = true;

  // Browser-compatible file save
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `تقرير_أسبوع_${weekNum}_${report.employeeName}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// ============================================================
// Export Multiple Reports
// ============================================================
export function exportMultipleReports(reports: WeeklyReport[]): void {
  const wb = XLSX.utils.book_new();

  // ── Summary Sheet ──
  const sws: XLSX.WorkSheet = {};
  sws['!cols'] = [
    { wch: 5 }, { wch: 20 }, { wch: 10 }, { wch: 28 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 18 },
  ];

  let sr = 0;
  setCell(sws, sr, 0, 'ملخص تقارير الأداء الأسبوعية', S.title);
  fillRow(sws, sr, 1, MAX_COL, S.title);
  merge(sws, sr, 0, sr, MAX_COL);
  setRowH(sws, sr, 28);
  sr++;

  const sHeaders = ['#', 'الموظف', 'الأسبوع', 'الفترة', 'الأداء', 'الإنجاز', 'التقييم', 'التسليم'];
  sHeaders.forEach((h, c) => setCell(sws, sr, c, h, S.colHeader));
  setRowH(sws, sr, 18);
  sr++;

  reports.forEach((rpt, i) => {
    const alt = i % 2 === 1;
    const rs = alt ? S.altRow : S.row;
    const cs = alt ? S.altRowCenter : S.rowCenter;

    setCell(sws, sr, 0, i + 1, cs);
    setCell(sws, sr, 1, rpt.employeeName, rs);
    setCell(sws, sr, 2, `ع${rpt.weekId.split('-W')[1]}`, cs);
    setCell(sws, sr, 3, `${formatDate(rpt.weekStartDate)} - ${formatDate(rpt.weekEndDate)}`, rs);
    setCell(sws, sr, 4, `${rpt.metrics?.performanceIndicator || 0}%`, cs);
    setCell(sws, sr, 5, `${rpt.metrics?.completionRate || 0}%`, cs);
    setCell(sws, sr, 6, `${rpt.metrics?.averageEvaluation || 0}/10`, cs);
    setCell(sws, sr, 7, rpt.submittedAt ? formatDate(rpt.submittedAt) : '-', cs);
    setRowH(sws, sr, 16);
    sr++;
  });

  sws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: sr - 1, c: MAX_COL } });
  XLSX.utils.book_append_sheet(wb, sws, 'ملخص');

  // ── Individual Sheets ──
  reports.forEach((report) => {
    const weekNum = report.weekId.split('-W')[1];
    const ws: XLSX.WorkSheet = {};
    ws['!cols'] = FULL_PAGE_COLS;
    const comp = report.previousWeekTasks.filter(t => t.status === 'completed').length;
    let r = 0;

    // Title
    setCell(ws, r, 0, `${report.employeeName} - أسبوع ${weekNum}`, S.title);
    fillRow(ws, r, 1, MAX_COL, S.title);
    merge(ws, r, 0, r, MAX_COL);
    setRowH(ws, r, 25);
    r++;

    setCell(ws, r, 0, `${formatDate(report.weekStartDate)} - ${formatDate(report.weekEndDate)}`, S.subtitle);
    fillRow(ws, r, 1, MAX_COL, S.subtitle);
    merge(ws, r, 0, r, MAX_COL);
    setRowH(ws, r, 18);
    r++;

    // Metrics
    const ml = ['الأداء', 'الإنجاز', 'التقييم', 'المنجزة', 'الإجمالي', 'التسليم', '', ''];
    ml.forEach((l, c) => setCell(ws, r, c, l, S.colHeader));
    setRowH(ws, r, 16);
    r++;

    const mv: (string | number)[] = [
      `${report.metrics?.performanceIndicator || 0}%`,
      `${report.metrics?.completionRate || 0}%`,
      `${report.metrics?.averageEvaluation || 0}/10`,
      comp, report.previousWeekTasks.length,
      report.submittedAt ? formatDate(report.submittedAt) : '-', '', ''
    ];
    mv.forEach((v, c) => setCell(ws, r, c, v, S.metric));
    setRowH(ws, r, 22);
    r++;

    // Previous tasks
    setCell(ws, r, 0, 'ما تم إنجازه', S.sectionHeader);
    fillRow(ws, r, 1, MAX_COL, S.sectionHeader);
    merge(ws, r, 0, r, MAX_COL);
    r++;

    ['#', 'المهمة', 'الوصف', 'الأهمية', 'الحالة', 'التقييم', 'الملاحظات', ''].forEach((h, c) => setCell(ws, r, c, h, S.colHeader));
    r++;

    report.previousWeekTasks.forEach((task, i) => {
      const alt = i % 2 === 1;
      const rs = alt ? S.altRow : S.row;
      const cs = alt ? S.altRowCenter : S.rowCenter;
      const ss = task.status === 'completed' ? S.completed : S.notCompleted;
      setCell(ws, r, 0, i + 1, cs);
      setCell(ws, r, 1, task.name + (task.isUnplanned ? ' ★' : ''), rs);
      setCell(ws, r, 2, task.description || '', rs);
      setCell(ws, r, 3, `${task.importance}/10`, cs);
      setCell(ws, r, 4, task.status === 'completed' ? '✓' : '✗', ss);
      setCell(ws, r, 5, task.evaluationScore !== undefined ? `${task.evaluationScore}/10` : '-', cs);
      setCell(ws, r, 6, task.reasonNotCompleted || '', rs);
      setCell(ws, r, 7, '', rs);
      r++;
    });

    // Current plan
    setCell(ws, r, 0, 'خطة الأسبوع', S.sectionHeader);
    fillRow(ws, r, 1, MAX_COL, S.sectionHeader);
    merge(ws, r, 0, r, MAX_COL);
    r++;

    ['#', 'المهمة', 'الوصف', 'الأهمية', '', '', '', ''].forEach((h, c) => setCell(ws, r, c, h, S.colHeader));
    r++;

    report.currentWeekTasks.forEach((task, i) => {
      const alt = i % 2 === 1;
      const rs = alt ? S.altRow : S.row;
      const cs = alt ? S.altRowCenter : S.rowCenter;
      setCell(ws, r, 0, i + 1, cs);
      setCell(ws, r, 1, task.name, rs);
      setCell(ws, r, 2, task.description || '', rs);
      setCell(ws, r, 3, `${task.importance}/10`, cs);
      fillRow(ws, r, 4, MAX_COL, rs);
      r++;
    });

    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: r - 1, c: MAX_COL } });
    const name = `${report.employeeName.substring(0, 18)}_ع${weekNum}`.substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, name);
  });

  // Apply RTL Workbook-wide
  if (!wb.Workbook) wb.Workbook = {};
  if (!wb.Workbook.Views) wb.Workbook.Views = [];
  if (!wb.Workbook.Views[0]) wb.Workbook.Views[0] = {};
  wb.Workbook.Views[0].RTL = true;

  const now = new Date();
  const d = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

  // Browser-compatible file save
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `تقارير_الأداء_${d}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
