import PDFDocument from "pdfkit";

interface WorkPermitDecisionData {
  referenceNumber: string;
  firstName: string;
  lastName: string;
  nationality: string;
  dateOfBirth: string;    // stored as text e.g. "1990-05-20"
  passportNumber: string;
  approvedAt: Date;
  validUntil: Date;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("ro-MD", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, ".");
}

function spaced(text: string): string {
  return text.split("").join(" ");
}

export async function generateWorkPermitDecisionPdf(data: WorkPermitDecisionData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 55 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageW = 595.28;
    const marginX = 55;
    const contentW = pageW - marginX * 2;

    // ── Top rule ────────────────────────────────────────────────────────────
    doc.moveTo(marginX, 52).lineTo(pageW - marginX, 52).lineWidth(1.5).strokeColor("#000").stroke();

    // ── Institution header ───────────────────────────────────────────────────
    doc.y = 58;
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#000")
      .text("Ministerul Afacerilor Interne al Republicii Moldova", { align: "center", width: contentW, lineGap: 1 })
      .text("Inspectoratul General Pentru Migrație", { align: "center", width: contentW, lineGap: 1 })
      .text("Direcția regională Centru", { align: "center", width: contentW });

    doc.moveTo(marginX, doc.y + 6).lineTo(pageW - marginX, doc.y + 6).lineWidth(1.5).strokeColor("#000").stroke();

    doc.moveDown(0.8);
    doc.font("Helvetica").fontSize(8).fillColor("#333")
      .text("MD 2012, mun. Chișinău, bd. Ștefan cel Mare 124 tel: 0-22-265-607", { align: "center", width: contentW })
      .text("e-mail: centru@igm.gov.md", { align: "center", width: contentW });

    // ── DECIZIE title ────────────────────────────────────────────────────────
    doc.moveDown(2.2);
    doc.font("Helvetica-Bold").fontSize(16).fillColor("#000")
      .text(spaced("DECIZIE") + " nr.  " + data.referenceNumber, { align: "center", width: contentW });

    doc.moveDown(0.8);
    doc.font("Helvetica").fontSize(10.5).fillColor("#000")
      .text("cu privire la dreptul de ședere provizorie în scop de muncă", { align: "center", width: contentW })
      .text("lucrător imigrant", { align: "center", width: contentW });

    // ── Date / city ──────────────────────────────────────────────────────────
    doc.moveDown(1.8);
    const dateY = doc.y;
    doc.font("Helvetica-Bold").fontSize(10).text(formatDate(data.approvedAt), marginX, dateY);
    doc.text("mun. Chișinău", marginX, dateY, { align: "right", width: contentW });

    // ── Legal preamble ───────────────────────────────────────────────────────
    doc.moveDown(1.2);
    doc.font("Helvetica").fontSize(9.5).fillColor("#000")
      .text(
        "  În temeiul art. 32, 43¹din Legea nr. 200 din 16.07.2010 privind regimul străinilor " +
        "în Republica Moldova și demersului \"                                          \", " +
        "prin care se solicită acordarea dreptului de ședere provizorie pentru muncă",
        { lineGap: 3, width: contentW, align: "justify" }
      );

    // ── Applicant block (first mention) ─────────────────────────────────────
    doc.moveDown(0.8);
    const nationY = doc.y;
    doc.font("Helvetica-Bold").fontSize(10)
      .text("cet.", marginX, nationY)
      .text("REPUBLICA POPULARA", marginX + 30, nationY)
      .text(data.nationality.toUpperCase(), marginX + 30, nationY + 14);

    doc.font("Helvetica-Bold").fontSize(10)
      .text((data.firstName + " " + data.lastName).toUpperCase(), marginX, nationY, { align: "right", width: contentW });

    doc.y = nationY + 32;
    doc.font("Helvetica").fontSize(7.5)
      .text("cetățenia", marginX + 30, doc.y, { width: 120 });
    doc.text("numele, prenumele", marginX, doc.y - 10, { align: "right", width: contentW });

    // ── DECID: ───────────────────────────────────────────────────────────────
    doc.moveDown(1.2);
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#000")
      .text(spaced("D E C I D") + " :", { align: "center", width: contentW });

    doc.moveDown(0.5);
    doc.font("Helvetica-Bold").fontSize(10)
      .text(
        "Se aprobă dreptul de ședere provizorie pentru muncă în Republica Moldova",
        { align: "left", width: contentW, lineGap: 2 }
      );

    // ── Applicant block (second mention — formal) ────────────────────────────
    doc.moveDown(1);
    const n2Y = doc.y;
    doc.font("Helvetica-Bold").fontSize(10)
      .text("cet.", marginX, n2Y)
      .text("REPUBLICA POPULARA", marginX + 30, n2Y)
      .text(data.nationality.toUpperCase(), marginX + 30, n2Y + 14);

    doc.font("Helvetica-Bold").fontSize(10)
      .text((data.firstName + " " + data.lastName).toUpperCase(), marginX, n2Y, { align: "right", width: contentW });

    doc.y = n2Y + 32;
    doc.font("Helvetica").fontSize(7.5)
      .text("cet. ășerii", marginX + 30, doc.y, { width: 100 });
    doc.text("numele, prenumele", marginX, doc.y - 10, { align: "right", width: contentW });

    // ── DOB / Passport row ───────────────────────────────────────────────────
    doc.moveDown(0.8);
    const rowY = doc.y;
    // Format DOB: stored as YYYY-MM-DD or similar
    let dobDisplay = data.dateOfBirth;
    try {
      const parsed = new Date(data.dateOfBirth);
      if (!isNaN(parsed.getTime())) {
        dobDisplay = parsed.toLocaleDateString("ro-MD", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, ".");
      }
    } catch { /* keep original */ }

    doc.font("Helvetica-Bold").fontSize(9.5).text("data nașterii", marginX, rowY);
    doc.moveTo(marginX + 75, rowY + 12).lineTo(marginX + 155, rowY + 12).lineWidth(0.5).stroke();
    doc.font("Helvetica").fontSize(9.5).text(dobDisplay, marginX + 77, rowY);

    doc.font("Helvetica-Bold").fontSize(9.5).text(",pașaport național seria", marginX + 160, rowY);
    doc.font("Helvetica-Bold").fontSize(9.5).text("A", marginX + 285, rowY);
    doc.font("Helvetica-Bold").fontSize(9.5).text("nr.", marginX + 300, rowY);
    doc.moveTo(marginX + 315, rowY + 12).lineTo(marginX + contentW, rowY + 12).lineWidth(0.5).stroke();
    doc.font("Helvetica").fontSize(9.5).text(data.passportNumber, marginX + 318, rowY);

    // ── Validity row ─────────────────────────────────────────────────────────
    doc.moveDown(1.4);
    const valY = doc.y;
    doc.font("Helvetica-Bold").fontSize(9.5).text("pe perioada de până la", marginX, valY);
    doc.moveTo(marginX + 145, valY + 12).lineTo(marginX + 260, valY + 12).lineWidth(0.5).stroke();
    doc.font("Helvetica-Bold").fontSize(9.5).text(formatDate(data.validUntil), marginX + 148, valY);

    // ── Signature block ──────────────────────────────────────────────────────
    doc.moveDown(2.5);
    const sigY = doc.y;
    doc.font("Helvetica-Bold").fontSize(10)
      .text("Șef Direcție regională", marginX, sigY);

    // Stamp placeholder circle
    const stampCX = pageW / 2;
    const stampCY = sigY + 25;
    doc.circle(stampCX, stampCY, 32).lineWidth(0.8).strokeColor("#888").stroke();
    doc.font("Helvetica").fontSize(6).fillColor("#888")
      .text("ȘTAMPILA", stampCX - 14, stampCY - 6);

    doc.font("Helvetica-Bold").fontSize(10).fillColor("#000")
      .text("Veaceslav PATRAȘ", marginX, sigY, { align: "right", width: contentW });

    // ── Bottom rule + legal footer ────────────────────────────────────────────
    const footerY = Math.max(doc.y + 45, 680);
    doc.moveTo(marginX, footerY).lineTo(pageW - marginX, footerY).lineWidth(0.8).strokeColor("#000").stroke();

    doc.font("Helvetica").fontSize(7.5).fillColor("#222")
      .text(
        "  În conformitate cu prevederile art. 164, alin. (1) al Codului Administrativ al Republicii Moldova nr. 116 din " +
        "19.07.2018 sunteți în drept să depuneți cererea prealabilă în termen de 30 de zile la comunicare, pentru a contesta " +
        "decizia Inspectoratului General pentru Migrație. Cererea prealabila se depune la secretariatul Inspectoratului " +
        "General pentru Migrație, situat pe adresa: mun. Chișinău, str. Ștefan cel Mare 124.",
        { lineGap: 2, width: contentW, align: "justify", baseline: "top" },
        marginX, footerY + 6
      );

    doc.moveDown(0.8);
    doc.font("Helvetica").fontSize(7.5).fillColor("#222")
      .text(
        "  Informația din acest document conține date cu caracter personal și necesită a fi prelucrată și protejată în " +
        "conformitate cu Legea nr. 133 din 08.07.2011 privind protecția datelor cu caracter personal.",
        { lineGap: 2, width: contentW, align: "justify" }
      );

    doc.end();
  });
}

interface OfferLetterData {
  applicantName: string;
  jobTitle: string;
  location: string;
  salary: string;
  startDate?: string;
  employerName?: string;
  adminNotes?: string;
}

export async function generateOfferLetterPdf(data: OfferLetterData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 60 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

    doc
      .fontSize(10)
      .fillColor("#6b7280")
      .text("Moldova Visa Assist SRL", { align: "right" })
      .text("Stefan cel Mare si Sfant Boulevard 65", { align: "right" })
      .text("Chisinau, MD-2001, Republic of Moldova", { align: "right" })
      .text(`Date: ${today}`, { align: "right" })
      .moveDown(2);

    doc
      .fontSize(22)
      .fillColor("#1a2744")
      .font("Helvetica-Bold")
      .text("JOB OFFER LETTER", { align: "center" })
      .moveDown(0.5);

    doc
      .moveTo(60, doc.y)
      .lineTo(535, doc.y)
      .strokeColor("#d4a029")
      .lineWidth(2)
      .stroke()
      .moveDown(1.5);

    doc
      .fontSize(11)
      .fillColor("#111827")
      .font("Helvetica")
      .text(`Dear ${data.applicantName},`)
      .moveDown(0.8);

    doc
      .text(
        `We are pleased to extend this formal offer of employment to you for the position of ` +
        `${data.jobTitle} based in ${data.location}.`,
        { lineGap: 4 }
      )
      .moveDown(1);

    const details = [
      ["Position", data.jobTitle],
      ["Location", data.location],
      ["Salary Package", data.salary],
      ...(data.employerName ? [["Employer", data.employerName] as [string, string]] : []),
      ...(data.startDate ? [["Proposed Start Date", data.startDate] as [string, string]] : []),
    ];

    doc.fontSize(11).font("Helvetica-Bold").text("Employment Details:").moveDown(0.5);

    for (const [label, value] of details) {
      doc
        .font("Helvetica-Bold")
        .fillColor("#1a2744")
        .text(`${label}: `, { continued: true })
        .font("Helvetica")
        .fillColor("#111827")
        .text(value);
    }

    doc.moveDown(1);

    if (data.adminNotes) {
      doc
        .font("Helvetica-Bold")
        .fillColor("#1a2744")
        .text("Additional Notes:")
        .moveDown(0.3)
        .font("Helvetica")
        .fillColor("#374151")
        .text(data.adminNotes, { lineGap: 4 })
        .moveDown(1);
    }

    doc
      .font("Helvetica")
      .fillColor("#111827")
      .text(
        "This offer is contingent upon the successful completion of all visa, work permit, and pre-employment requirements. " +
        "Moldova Visa Assist will guide you through each step of the process.",
        { lineGap: 4 }
      )
      .moveDown(1.5);

    doc
      .text("Please confirm your acceptance of this offer by replying to this email within 5 business days.")
      .moveDown(1.5);

    doc
      .text("Congratulations and welcome to the team!")
      .moveDown(2);

    doc
      .font("Helvetica-Bold")
      .text("Moldova Visa Assist SRL")
      .font("Helvetica")
      .text("Recruitment & Visa Assistance Team")
      .text("contact@moldova-visa-assist.replit.app");

    doc.end();
  });
}
