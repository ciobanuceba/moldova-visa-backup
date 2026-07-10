import PDFDocument from "pdfkit";

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
