import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FONTS_DIR = path.join(__dirname, "..", "fonts");

interface WorkPermitDecisionData {
  referenceNumber: string;
  firstName: string;
  lastName: string;
  nationality: string;
  dateOfBirth: string;
  passportNumber: string;
  approvedAt: Date;
  validUntil: Date;
}

function fmtDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function fmtDOB(raw: string): string {
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[3]}.${iso[2]}.${iso[1]}`;
  return raw;
}

function spaced(s: string): string { return s.split("").join(" "); }

export async function generateWorkPermitDecisionPdf(data: WorkPermitDecisionData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0 });
    const chunks: Buffer[] = [];
    doc.on("data", c => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.registerFont("Regular", path.join(FONTS_DIR, "overpass-regular.ttf"));
    doc.registerFont("Bold", path.join(FONTS_DIR, "overpass-bold.ttf"));
    const PW = 595.28, ML = 50, MR = 545, CW = 495;
    doc.moveTo(ML,45).lineTo(MR,45).lineWidth(1.8).strokeColor("#000").stroke();
    doc.rect(ML,50,36,36).lineWidth(.7).strokeColor("#555").stroke();
    doc.font("Regular").fontSize(4.5).fillColor("#555").text("SEAL",ML+9,65);
    doc.rect(MR-36,50,36,36).lineWidth(.7).strokeColor("#555").stroke();
    doc.font("Regular").fontSize(4.5).text("IGM",MR-27,65);
    const hdrLeft=ML+42,hdrW=CW-84;
    doc.font("Bold").fontSize(9.5).fillColor("#000")
      .text("Ministerul Afacerilor Interne al Republicii Moldova",hdrLeft,53,{width:hdrW,align:"center",lineGap:1})
      .text("Inspectoratul General Pentru Migratie",hdrLeft,doc.y,{width:hdrW,align:"center",lineGap:1})
      .text("Directia regionala Centru",hdrLeft,doc.y,{width:hdrW,align:"center"});
    const rule2Y=94;
    doc.moveTo(ML,rule2Y).lineTo(MR,rule2Y).lineWidth(1.8).strokeColor("#000").stroke();
    doc.moveTo(ML,rule2Y+2.5).lineTo(MR,rule2Y+2.5).lineWidth(.6).strokeColor("#000").stroke();
    doc.font("Regular").fontSize(7.5).fillColor("#111")
      .text("MD 2012, mun. Chisinau, bd. Stefan cel Mare 124  tel: 0-22-265-607",ML,102,{width:CW,align:"center"})
      .text("e-mail: centru@igm.gov.md",ML,113,{width:CW,align:"center"});
    doc.font("Bold").fontSize(17).fillColor("#000").text(spaced("DECIZIE")+"  nr.  "+data.referenceNumber,ML,168,{width:CW,align:"center"});
    doc.font("Regular").fontSize(10.5).fillColor("#000")
      .text("cu privire la dreptul de sedere provizori in scope de munca",ML,197,{width:CW,align:"center"})
      .text("lurator imigrant",ML,211,{width:CW,align:"center"});
    const dateY=252;
    doc.font("Bold").fontSize(10).text(fmtDate(data.approvedAt),ML,dateY);
    doc.font("Bold").fontSize(10).text("mun. Chisinau",ML,dateY,{width:CW,align:"right"});
    const preambleY=272;
    doc.font("Regular").fontSize(9.5).fillColor("#000").text(
      "  In temeiul art. 32, 43¹din Legea nr. 200 din 16.07.2010 privind regimul strainilor in Republica Moldova si demersului \"                                                \", prin care se solicita acordarea dreptului de sedere provizore pentru munca",
      ML,preambleY,{width:CW,align:"justify",lineGap:2});
    const ab1Y=328,natCol=ML+32,nameX=ML;
    doc.font("Bold").fontSize(9.5).text("cet.",ML,ab1Y);
    doc.font("Bold").fontSize(9.5).text("REPUBLICA POPULARA",natCol,ab1Y).text(data.nationality.toUpperCase(),natCol,ab1Y+13);
    const fullName=(data.firstName+" "+data.lastName).toUpperCase();
    doc.font("Bold").fontSize(9.5).text(fullName,nameX,ab1Y,{width:CW,align:"right"});
    doc.moveTo(natCol,ab1Y+25).lineTo(natCol+120,ab1Y+25).lineWidth(.5).strokeColor("#000").stroke();
    const nameW=Math.min(doc.widthOfString(fullName)+4,180);
    doc.moveTo(MR-nameW,ab1Y+25).lineTo(MR,ab1Y+25).lineWidth(.5).strokeColor("#000").stroke();
    doc.font("Regular").fontSize(7).text("cetatenia",natCol,ab1Y+28,{width:80}).text("mamelc, prenumele",nameX,ab1Y+28,{width:CW,align:"right"});
    const decidY=372;
    doc.font("Bold").fontSize(13).text(spaced("D E C I D")+":",ML,decidY,{width:CW,align:"center"});
    doc.font("Bold").fontSize(10).text("Se aprobare dreptul de sedere provizorie pentru munca in Republica Moldova",ML,392,{width:CW,align:"left",lineGap:2});
    const ab2Y=418;
    doc.font("Bold").fontSize(9.5).text("cet.",ML,ab2Y).text("REPUBLICA POPULARA",natCol,ab2Y).text(data.nationality.toUpperCase(),natCol,ab2Y+13).text(fullName,nameX,ab2Y,{width:CW,align:"right"});
    doc.moveTo(natCol,ab2Y+25).lineTo(natCol+120,ab2Y+25).lineWidth(.5).stroke();
    doc.moveTo(MR-nameW,ab2Y+25).lineTo(MR,ab2Y+25).lineWidth(.5).stroke();
    doc.font("Regular").fontSize(7).text("cet. aserii",natCol,ab2Y+28,{width:80}).text("mamelc, prenumele",nameX,ab2Y+28,{width:CW,align:"right"});
    const rowY=458,dobVal=fmtDOB(data.dateOfBirth);
    doc.font("Bold").fontSize(9.5).text("data nasterii",ML,rowY);
    doc.moveTo(ML+78,rowY+13).lineTo(ML+160,rowY+13).lineWidth(.5).stroke();
    doc.font("Regular").fontSize(9.5).text(dobVal,ML+80,rowY);
    doc.font("Bold").fontSize(9.5).text(",pasaport national seria",ML+162,rowY).text("A",ML+288,rowY).text("nr.",ML+302,rowY);
    doc.moveTo(ML+318,rowY+13).lineTo(MR,rowY+13).lineWidth(.5).stroke();
    doc.font("Regular").fontSize(9.5).text(data.passportNumber,ML+320,rowY);
    const valY=478;
    doc.font("Bold").fontSize(9.5).text("pe perioada de pana la",ML,valY);
    doc.moveTo(ML+148,valY+13).lineTo(ML+280,valY+13).lineWidth(.5).stroke();
    doc.font("Bold").fontSize(9.5).text(fmtDate(data.validUntil),ML+150,valY);
    const sigY=520;
    doc.font("Bold").fontSize(10).fillColor("#000").text("Sef Directie regionala",ML,sigY);
    doc.font("Bold").fontSize(10).fillColor("#000").text("Veaceslav PATRAS",ML,sigY,{width:CW,align:"right"});
    try { doc.image(path.join(FONTS_DIR,"stamp.png"),PW/2-55,sigY-15,{width:110}); } catch { doc.circle(PW/2,sigY+30,34).lineWidth(.9).strokeColor("#666").stroke(); }
    const footerRuleY=620;
    doc.moveTo(ML,footerRuleY).lineTo(MR,footerRuleY).lineWidth(.8).strokeColor("#000").stroke();
    doc.font("Regular").fontSize(7.5).fillColor("#111").text("  In conformitate cu prevederile art. 164, alin. (1) al Codului Administrativ al Republicii Moldova nr. 116 din 19.07.2018 sunteti in drept sa depuneti cererea prealabila in termen de 30 de zile la comunicare, pentru a contesta decizia Inspectoratului General pentru Migratie. Cererea prealabila se depune la secretariatul Inspectoratului General pentru Migratie, situat pe adresa: mun. Chisinau, str. Stefan cel Mare 124.",ML,footerRuleY+6,{width:CW,align:"justify",lineGap:1.5});
    const p2Y=doc.y+5;
    doc.font("Regular").fontSize(7.5).text("  Informatia din acest document contine date cu caracter personal si necesita a fi prelucrata si protejata in conformitate cu Legea nr. 133 din 08.07.2011 privind protectia datelor cu caracter personal.",ML,p2Y,{width:CW,align:"justify",lineGap:1.5});
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
    doc.registerFont("Regular", path.join(FONTS_DIR, "overpass-regular.ttf"));
    doc.registerFont("Bold", path.join(FONTS_DIR, "overpass-bold.ttf"));

    const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

    doc.font("Regular").fontSize(10).fillColor("#6b7280")
      .text("Moldova Visa Assist SRL", { align: "right" })
      .text("Stefan cel Mare si Sfant Boulevard 65", { align: "right" })
      .text("Chisinau, MD-2001, Republic of Moldova", { align: "right" })
      .text(`Date: ${today}`, { align: "right" })
      .moveDown(2);

    doc.font("Bold").fontSize(22).fillColor("#1a2744")
      .text("JOB OFFER LETTER", { align: "center" })
      .moveDown(0.5);

    doc.moveTo(60, doc.y).lineTo(535, doc.y)
      .strokeColor("#d4a029").lineWidth(2).stroke()
      .moveDown(1.5);

    doc.font("Regular").fontSize(11).fillColor("#111827")
      .text(`Dear ${data.applicantName},`)
      .moveDown(0.8)
      .text(`We are pleased to extend this formal offer of employment to you for the position of ${data.jobTitle} based in ${data.location}.`, { lineGap: 4 })
      .moveDown(1);

    const details: [string, string][] = [
      ["Position", data.jobTitle],
      ["Location", data.location],
      ["Salary Package", data.salary],
      ...(data.employerName ? [["Employer", data.employerName] as [string, string]] : []),
      ...(data.startDate ? [["Proposed Start Date", data.startDate] as [string, string]] : []),
    ];

    doc.font("Bold").fontSize(11).fillColor("#1a2744").text("Employment Details:").moveDown(0.5);
    for (const [label, value] of details) {
      doc.font("Bold").fillColor("#1a2744").text(`${label}: `, { continued: true })
        .font("Regular").fillColor("#111827").text(value);
    }
    doc.moveDown(1);

    if (data.adminNotes) {
      doc.font("Bold").fillColor("#1a2744").text("Additional Notes:").moveDown(0.3)
        .font("Regular").fillColor("#374151").text(data.adminNotes, { lineGap: 4 })
        .moveDown(1);
    }

    doc.font("Regular").fillColor("#111827")
      .text("This offer is contingent upon the successful completion of all visa, work permit, and pre-employment requirements. Moldova Visa Assist will guide you through each step of the process.", { lineGap: 4 })
      .moveDown(1.5)
      .text("Please confirm your acceptance of this offer by replying to this email within 5 business days.")
      .moveDown(1.5)
      .text("Congratulations and welcome to the team!")
      .moveDown(2);

    doc.font("Bold").text("Moldova Visa Assist SRL")
      .font("Regular")
      .text("Recruitment & Visa Assistance Team")
      .text("contact@moldova-visa-assist.replit.app");

    doc.end();
  });
}
