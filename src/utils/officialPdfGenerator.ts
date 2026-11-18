import { jsPDF } from 'jspdf';
import { StudentPortalRecord } from '../types/program';

function formatCurrency(amount: number): string {
  const abs = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return amount < 0 ? `($${abs})` : `$${abs}`;
}

function formatIssueDate(): string {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function drawUniversityCrest(doc: jsPDF, x: number, y: number, university: string) {
  const isBerea = university.toLowerCase().includes('berea');
  const shieldColor: [number, number, number] = isBerea ? [0, 76, 151] : [12, 35, 64];
  const goldColor: [number, number, number] = [229, 158, 22];

  // Outer light crest frame
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.roundedRect(x, y, 18, 20, 2, 2, 'FD');

  // Inner shield polygon
  doc.setFillColor(...shieldColor);
  doc.setDrawColor(12, 35, 64);
  doc.setLineWidth(0.3);
  doc.lines(
    [
      [12, 0],
      [0, 7.5],
      [-6, 5.5],
      [-6, -5.5],
    ],
    x + 3,
    y + 3.2,
    [1, 1],
    'FD',
    true
  );

  // Horizontal white bar across upper shield
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.9);
  doc.line(x + 4.4, y + 6.4, x + 13.6, y + 6.4);

  // Gold academic beacon triangle inside shield
  doc.setFillColor(...goldColor);
  doc.triangle(x + 9, y + 8.1, x + 6.3, y + 12.8, x + 11.7, y + 12.8, 'F');
}

function drawOfficialSeal(doc: jsPDF, cx: number, cy: number, officeLabel: string, university: string) {
  doc.setDrawColor(12, 35, 64);
  doc.setLineWidth(0.6);
  doc.circle(cx, cy, 13.5, 'S');

  doc.setDrawColor(180, 125, 16);
  doc.setLineWidth(0.3);
  doc.circle(cx, cy, 11.2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(12, 35, 64);
  doc.text(university.toUpperCase().slice(0, 18), cx, cy - 5.5, { align: 'center' });

  doc.setFontSize(6.2);
  doc.setTextColor(180, 105, 0);
  doc.text('OFFICIAL SEAL', cx, cy + 0.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(71, 85, 105);
  doc.text(officeLabel.toUpperCase().slice(0, 20), cx, cy + 5.6, { align: 'center' });
}

function drawOfficialLetterhead(
  doc: jsPDF,
  portal: StudentPortalRecord,
  officeTitle: string,
  docRef: string
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Top navy accent strip
  doc.setFillColor(12, 35, 64);
  doc.rect(0, 0, pageWidth, 4.5, 'F');

  // Crest logo
  drawUniversityCrest(doc, margin, 11, portal.university);

  // University name & office header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15.5);
  doc.setTextColor(12, 35, 64);
  doc.text(portal.university.toUpperCase(), margin + 22, 16.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 58, 95);
  doc.text(officeTitle, margin + 22, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `${portal.universityLocation}  |  ScholarWork Global Verified Institutional Record`,
    margin + 22,
    27
  );

  // Right-side document reference block
  const rightX = pageWidth - margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(12, 35, 64);
  doc.text(`Ref: ${docRef}`, rightX, 15.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Issued: ${formatIssueDate()}`, rightX, 20.5, { align: 'right' });
  doc.text(`Student ID: ${portal.studentIdNumber}`, rightX, 25.5, { align: 'right' });

  // Double institutional divider line
  doc.setDrawColor(12, 35, 64);
  doc.setLineWidth(0.65);
  doc.line(margin, 34, pageWidth - margin, 34);

  doc.setDrawColor(229, 158, 22);
  doc.setLineWidth(0.35);
  doc.line(margin, 35.4, pageWidth - margin, 35.4);

  return 43;
}

function drawStudentInfoGrid(doc: jsPDF, portal: StudentPortalRecord, startY: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const boxWidth = pageWidth - margin * 2;
  const boxHeight = 36;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, startY, boxWidth, boxHeight, 1.5, 1.5, 'FD');

  // Vertical center divider inside info box
  const midX = margin + boxWidth / 2;
  doc.setDrawColor(226, 232, 240);
  doc.line(midX, startY + 3, midX, startY + boxHeight - 3);

  const leftRows: Array<[string, string]> = [
    ['Student Name', portal.studentName],
    ['Student ID', portal.studentIdNumber],
    ['School Email', portal.portalEmail],
    ['Sign-Up Email', portal.studentEmail],
    ['Course / Major', portal.course],
  ];

  const rightRows: Array<[string, string]> = [
    ['Status', `${portal.enrollmentStatus} (Studies Not Started)`],
    ['Expected Arrival', portal.expectedArrivalDate],
    ['Intake Term', portal.intakeTerm],
    ['Home Guardian', `${portal.homeGuardianName} (${portal.homeGuardianRelation})`],
    ['School Mentor', portal.schoolGuardianName],
  ];

  const renderCol = (rows: Array<[string, string]>, colX: number) => {
    let rowY = startY + 6.8;
    rows.forEach(([label, val]) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);
      doc.setTextColor(100, 116, 139);
      doc.text(`${label}:`, colX + 4, rowY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.2);
      doc.setTextColor(15, 36, 62);
      const clipped = doc.splitTextToSize(val, 54)[0] || val;
      doc.text(clipped, colX + 34, rowY);
      rowY += 6.2;
    });
  };

  renderCol(leftRows, margin);
  renderCol(rightRows, midX);

  return startY + boxHeight + 7;
}

function drawFooter(
  doc: jsPDF,
  portal: StudentPortalRecord,
  officeLabel: string,
  signerTitle: string,
  verificationCode: string
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  const sigY = pageHeight - 40;

  // Signature block on left
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.35);
  doc.line(margin, sigY + 11, margin + 68, sigY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(12, 35, 64);
  doc.text(signerTitle, margin, sigY + 15.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  doc.setTextColor(100, 116, 139);
  doc.text(`${portal.university} · ${portal.universityLocation}`, margin, sigY + 20);
  doc.text(`Electronic Verification Code: ${verificationCode}`, margin, sigY + 24.5);

  // Circular Seal on right
  drawOfficialSeal(doc, pageWidth - margin - 18, sigY + 12, officeLabel, portal.university);

  // Bottom border & legal footer
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 13, pageWidth - margin, pageHeight - 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Official Document — Issued solely for ${portal.studentName} (${portal.studentEmail})`,
    margin,
    pageHeight - 8.5
  );
  doc.text('Page 1 of 1', pageWidth - margin, pageHeight - 8.5, { align: 'right' });
}

export function downloadOfficialFeeStatementPdf(portal: StudentPortalRecord): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const isPreArrival = portal.enrollmentStatus === 'Pre-Arrival';

  let y = drawOfficialLetterhead(
    doc,
    portal,
    'Office of Student Financial Services & Bursar',
    `FIN-2027-${portal.studentIdNumber}`
  );

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(12, 35, 64);
  doc.text('OFFICIAL FEE STATEMENT & SPONSORSHIP ASSESSMENT', pageWidth / 2, y, {
    align: 'center',
  });
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    isPreArrival
      ? 'Pre-Arrival Assessment Notice — No funds have been credited prior to enrollment commencement'
      : `Official Financial Statement — ${portal.sponsorshipProgramme}`,
    pageWidth / 2,
    y,
    { align: 'center' }
  );
  y += 7;

  // Student Details Grid
  y = drawStudentInfoGrid(doc, portal, y);

  // 3 Summary Financial Assessment Boxes
  const cardGap = 4;
  const cardW = (contentWidth - cardGap * 2) / 3;
  const cardH = 21;

  const summaryBoxes = [
    {
      label: 'GROSS ANNUAL ASSESSMENT (100%)',
      value: `${formatCurrency(portal.grossAnnualFeeUsd)} USD`,
      sub: 'Assessed Tuition & Lab Fees',
      bg: [248, 250, 252] as [number, number, number],
      border: [203, 213, 225] as [number, number, number],
      valColor: [12, 35, 64] as [number, number, number],
    },
    {
      label: `EXPECTED GOV. COVERAGE (${portal.governmentCoveragePercent}%)`,
      value: `${formatCurrency(portal.governmentCoverageUsd)} USD`,
      sub: isPreArrival ? 'Expected Upon Enrollment' : 'Applied Sponsorship Aid',
      bg: [240, 249, 255] as [number, number, number],
      border: [186, 230, 253] as [number, number, number],
      valColor: [12, 74, 110] as [number, number, number],
    },
    {
      label: 'EXPECTED HOUSEHOLD FEE (20%)',
      value: `${formatCurrency(portal.householdFeeUsd)} USD`,
      sub: isPreArrival ? 'Amount Credited to Date: $0.00' : 'Net Student / Family Balance',
      bg: [255, 251, 235] as [number, number, number],
      border: [253, 230, 138] as [number, number, number],
      valColor: [146, 64, 14] as [number, number, number],
    },
  ];

  summaryBoxes.forEach((box, idx) => {
    const bx = margin + idx * (cardW + cardGap);
    doc.setFillColor(...box.bg);
    doc.setDrawColor(...box.border);
    doc.setLineWidth(0.35);
    doc.roundedRect(bx, y, cardW, cardH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    doc.text(box.label, bx + 3.5, y + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...box.valColor);
    doc.text(box.value, bx + 3.5, y + 12.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(71, 85, 105);
    doc.text(box.sub, bx + 3.5, y + 17.5);
  });

  y += cardH + 8;

  // Section Label: Itemized Ledger
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(12, 35, 64);
  doc.text('ITEMIZED FEE ASSESSMENT & EXPECTED SPONSORSHIP SCHEDULE', margin, y);
  y += 3.5;

  // Table Column Geometries (total = 180mm)
  const colWidths = [31, 74, 31, 22, 22];
  const colX = [
    margin,
    margin + colWidths[0],
    margin + colWidths[0] + colWidths[1],
    margin + colWidths[0] + colWidths[1] + colWidths[2],
    margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
  ];

  // Table Header
  doc.setFillColor(12, 35, 64);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.6);
  doc.setTextColor(255, 255, 255);
  doc.text('Period / Stage', colX[0] + 2.5, y + 5.3);
  doc.text('Assessment / Expected Item', colX[1] + 2.5, y + 5.3);
  doc.text('Category', colX[2] + 2.5, y + 5.3);
  doc.text('Status', colX[3] + 2.5, y + 5.3);
  doc.text('Amount (USD)', margin + contentWidth - 2.5, y + 5.3, { align: 'right' });
  y += 8;

  // Table Rows
  portal.feesLedger.forEach((item, idx) => {
    const descLines = doc.splitTextToSize(item.description, colWidths[1] - 5);
    const rowH = Math.max(9.5, descLines.length * 4 + 4.5);

    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.rect(margin, y, contentWidth, rowH, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.6);
    doc.setTextColor(71, 85, 105);
    doc.text(doc.splitTextToSize(item.date, colWidths[0] - 4)[0] || item.date, colX[0] + 2.5, y + 5.2);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 36, 62);
    doc.text(descLines, colX[1] + 2.5, y + 5.2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(item.category, colX[2] + 2.5, y + 5.2);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(item.status === 'Expected' ? 180 : 12, item.status === 'Expected' ? 83 : 35, item.status === 'Expected' ? 9 : 64);
    doc.text(item.status, colX[3] + 2.5, y + 5.2);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(12, 35, 64);
    const amountStr =
      item.amountUsd === 0 && item.category === 'Institutional Aid'
        ? 'Upkeep Only'
        : formatCurrency(item.amountUsd);
    doc.text(amountStr, margin + contentWidth - 2.5, y + 5.2, { align: 'right' });

    y += rowH;
  });

  // Table Total Footer Row
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(148, 163, 184);
  doc.rect(margin, y, contentWidth, 9, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(12, 35, 64);
  doc.text('NET EXPECTED HOUSEHOLD RESPONSIBILITY (AFTER 80% GOV. COVERAGE)', colX[0] + 2.5, y + 5.8);
  doc.text(`${formatCurrency(portal.householdFeeUsd)} USD`, margin + contentWidth - 2.5, y + 5.8, {
    align: 'right',
  });
  y += 15;

  // Work-Study Upkeep & Weekly Guardian Notice Box
  const weeklyPay =
    portal.workStudyHourlyUsd * portal.workStudyHoursPerDay * portal.workStudyDaysPerWeek;
  const noticeHeight = 32;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(12, 35, 64);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, y, contentWidth, noticeHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(12, 35, 64);
  doc.text('WORK-STUDY UPKEEP STIPEND & WEEKLY GUARDIAN DISBURSEMENT NOTICE', margin + 4, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.9);
  doc.setTextColor(51, 65, 85);
  const workNoticeText =
    `Assigned Role: ${portal.workStudyRole} at ${portal.workStudyLocation} ($${portal.workStudyHourlyUsd.toFixed(
      2
    )} USD/hr · ${portal.workStudyHoursPerDay} hrs/day · ${portal.workStudyDaysPerWeek} days/week = $${weeklyPay.toLocaleString()} USD/week).\n` +
    `Important Notice: Work-study earnings begin only after arrival and commencement of campus duties. These funds serve as ${portal.studentName}'s personal upkeep money (separate from tuition) and are disbursed directly to her student bank account on a weekly basis, with disbursement statements automatically sent via email to her guardian (${portal.homeGuardianName}).`;
  doc.text(doc.splitTextToSize(workNoticeText, contentWidth - 8), margin + 4, y + 12.2);

  drawFooter(
    doc,
    portal,
    'Office of the Bursar',
    'Authorized Student Financial Officer',
    `VER-${portal.studentIdNumber}-FIN`
  );

  doc.save(`${portal.studentIdNumber}_Official_Fee_Statement.pdf`);
}

export function downloadOfficialAcademicTranscriptPdf(portal: StudentPortalRecord): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  let y = drawOfficialLetterhead(
    doc,
    portal,
    'Office of the Registrar & Academic Records',
    `TR-2027-${portal.studentIdNumber}`
  );

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(12, 35, 64);
  doc.text('OFFICIAL STUDENT ACADEMIC TRANSCRIPT', pageWidth / 2, y, { align: 'center' });
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Programme: ${portal.course}  ·  ${portal.sponsorshipProgramme}`,
    pageWidth / 2,
    y,
    { align: 'center' }
  );
  y += 7;

  // Student Info Grid
  y = drawStudentInfoGrid(doc, portal, y);

  // Section Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(12, 35, 64);
  doc.text('ACADEMIC COURSEWORK & CUMULATIVE RECORD BY TERM', margin, y);
  y += 3.5;

  // Transcript Table Header (180mm)
  const cols = [30, 24, 62, 16, 14, 16, 18];
  const colPos = cols.reduce<number[]>((acc, _, idx) => {
    if (idx === 0) return [margin];
    return [...acc, acc[idx - 1] + cols[idx - 1]];
  }, []);

  doc.setFillColor(12, 35, 64);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Term / Year', colPos[0] + 2, y + 5.3);
  doc.text('Course Code', colPos[1] + 2, y + 5.3);
  doc.text('Course Title', colPos[2] + 2, y + 5.3);
  doc.text('Credits', colPos[3] + cols[3] - 2, y + 5.3, { align: 'right' });
  doc.text('Grade', colPos[4] + cols[4] - 2, y + 5.3, { align: 'right' });
  doc.text('GPA Pts', colPos[5] + cols[5] - 2, y + 5.3, { align: 'right' });
  doc.text('Status', colPos[6] + 2, y + 5.3);
  y += 8;

  if (portal.academicTranscript.length === 0) {
    const emptyBoxH = 44;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.rect(margin, y, contentWidth, emptyBoxH, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(12, 35, 64);
    doc.text(
      'PRE-ARRIVAL RECORD — NO ACADEMIC CREDITS OR GRADES ISSUED YET',
      pageWidth / 2,
      y + 12,
      { align: 'center' }
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(71, 85, 105);
    const statement =
      `${portal.studentName} (Student ID: ${portal.studentIdNumber}) is officially admitted to ${portal.university} in ${portal.course}. Expected arrival on campus is ${portal.expectedArrivalDate} (${portal.intakeTerm}). Because studies have not yet commenced, no coursework, credit hours, or GPA entries have been recorded. Term-by-term grades will appear on this transcript after her first academic semester concludes.`;
    doc.text(doc.splitTextToSize(statement, contentWidth - 18), pageWidth / 2, y + 20, {
      align: 'center',
    });

    y += emptyBoxH + 8;
  } else {
    portal.academicTranscript.forEach((row, idx) => {
      const titleLines = doc.splitTextToSize(row.courseTitle, cols[2] - 4);
      const rowH = Math.max(8.5, titleLines.length * 4 + 4);
      doc.setFillColor(
        idx % 2 === 0 ? 255 : 248,
        idx % 2 === 0 ? 255 : 250,
        idx % 2 === 0 ? 255 : 252
      );
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, y, contentWidth, rowH, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.6);
      doc.setTextColor(51, 65, 85);
      doc.text(row.term, colPos[0] + 2, y + 5.2);
      doc.text(row.courseCode, colPos[1] + 2, y + 5.2);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 36, 62);
      doc.text(titleLines, colPos[2] + 2, y + 5.2);
      doc.setFont('helvetica', 'normal');
      doc.text(row.credits.toFixed(1), colPos[3] + cols[3] - 2, y + 5.2, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.text(row.grade, colPos[4] + cols[4] - 2, y + 5.2, { align: 'right' });
      doc.text(row.gpaPoints.toFixed(2), colPos[5] + cols[5] - 2, y + 5.2, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.text(row.status, colPos[6] + 2, y + 5.2);

      y += rowH;
    });
    y += 8;
  }

  // Cumulative Academic Summary Strip
  const totalCredits = portal.academicTranscript.reduce((sum, r) => sum + r.credits, 0);
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 18, 1.5, 1.5, 'FD');

  const stats = [
    ['Attempted Credits', totalCredits.toFixed(2)],
    ['Earned Credits', totalCredits.toFixed(2)],
    ['Cumulative GPA', portal.academicTranscript.length === 0 ? 'Pending (Pre-Arrival)' : '—'],
    ['Academic Standing', portal.enrollmentStatus === 'Pre-Arrival' ? 'Admitted — Awaiting Arrival' : 'Good Standing'],
  ];

  const statW = contentWidth / 4;
  stats.forEach(([lbl, val], idx) => {
    const sx = margin + idx * statW + 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(lbl.toUpperCase(), sx, y + 6.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.8);
    doc.setTextColor(12, 35, 64);
    doc.text(val, sx, y + 13.2);
  });

  y += 25;

  // Institutional Grading Scale Legend
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 20, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(12, 35, 64);
  doc.text('INSTITUTIONAL GRADING SCALE & TRANSCRIPT AUTHENTICITY', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.4);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Standard 4.00 Scale:  A = 4.00   A- = 3.70   B+ = 3.30   B = 3.00   B- = 2.70   C+ = 2.30   C = 2.00   D = 1.00   F = 0.00   IP = In Progress',
    margin + 4,
    y + 11.5
  );
  doc.text(
    `Assigned Campus Mentor: ${portal.schoolGuardianName} (${portal.schoolGuardianRole}) · Home Guardian: ${portal.homeGuardianName}`,
    margin + 4,
    y + 16.5
  );

  drawFooter(
    doc,
    portal,
    'Office of the Registrar',
    'University Registrar & Academic Records',
    `VER-${portal.studentIdNumber}-TRN`
  );

  doc.save(`${portal.studentIdNumber}_Official_Academic_Transcript.pdf`);
}
