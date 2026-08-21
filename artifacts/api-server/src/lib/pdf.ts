import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";
import { db, applicationsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FONTS_DIR = path.join(__dirname, "..", "fonts");
const LOGO_PATH = path.join(FONTS_DIR, "moldova-coa.png");

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
      "  In temeiul art. 32, 43¹din Legea nr. 200 din 16.07.2010 privind regimul strainilor in Republica Moldova si demersului \\\"                                                \\\", prin care se solicita acordarea dreptului de sedere provizore pentru munca",
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
    doc.font("Bold").fontSize(10).text("Sef Directie regionala",ML,sigY).text("Veaceslav PATRAS",ML,sigY,{width:CW,align:"right"});
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
  referenceNumber?: string;
  applicationDate?: string;
  email?: string;
  phone?: string;
  nationality?: string;
  dateOfBirth?: string;
  passportNumber?: string;
  yearsExperience?: string;
  skills?: string;
  languages?: string;
  experience?: string;
  coverLetter?: string;
  resumeUrl?: string;
}

function val(value: unknown, fallback = "Not provided"): string {
  const s = String(value ?? "").trim();
  return s || fallback;
}

function displayDate(raw?: string, fallback = "Not provided"): string {
  if (!raw) return fallback;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
}

export async function generateOfferLetterPdf(data: OfferLetterData): Promise<Buffer> {
  try {
    const parts = String(data.applicantName || "").trim().split(/\s+/);
    const firstName = parts.shift() || "";
    const lastName = parts.join(" ");
    if (firstName && lastName) {
      const rows = await db.select().from(applicationsTable)
        .where(and(eq(applicationsTable.firstName, firstName), eq(applicationsTable.lastName, lastName)))
        .limit(1);
      const app = rows[0];
      if (app) {
        data = { ...data,
          email: data.email || app.email, phone: data.phone || app.phone,
          nationality: data.nationality || app.nationality || undefined,
          dateOfBirth: data.dateOfBirth || app.dateOfBirth || undefined,
          passportNumber: data.passportNumber || app.passportNumber || undefined,
          yearsExperience: data.yearsExperience || app.yearsExperience || undefined,
          skills: data.skills || app.skills || undefined, languages: data.languages || app.languages || undefined,
          experience: data.experience || app.experience || undefined, coverLetter: data.coverLetter || app.coverLetter || undefined,
          resumeUrl: data.resumeUrl || app.resumeUrl || undefined, applicationDate: data.applicationDate || app.createdAt.toISOString(),
        };
      }
    }
  } catch { /* keep the existing PDF flow working if enrichment is unavailable */ }

  return new Promise((resolve,reject)=>{
    const doc=new PDFDocument({size:"A4",margin:0});
    const chunks:Buffer[]=[];
    doc.on("data",c=>chunks.push(c)); doc.on("end",()=>resolve(Buffer.concat(chunks))); doc.on("error",reject);
    doc.registerFont("Regular",path.join(FONTS_DIR,"overpass-regular.ttf"));
    doc.registerFont("Bold",path.join(FONTS_DIR,"overpass-bold.ttf"));

    const PW=595.28, ML=48, MR=547, CW=MR-ML;
    const navy="#18324B", gold="#B58A3A", ink="#1F2933", muted="#64748B", light="#F4F6F8", border="#D7DEE5";
    const employer=val(data.employerName,"MOLDOVA VISA ASSIST SRL");
    const dateText=displayDate(new Date().toISOString());

    // Compact, polished one-page version based on the earlier layout.
    doc.rect(0,0,PW,92).fill(navy);
    try { doc.image(LOGO_PATH,ML,15,{fit:[54,54],align:"center",valign:"center"}); } catch {}
    doc.font("Bold").fontSize(16).fillColor("#FFFFFF").text(employer,116,20,{width:290});
    doc.font("Regular").fontSize(8).fillColor("#DCE6EE").text("Recruitment & Visa Assistance",116,43,{width:290});
    doc.font("Regular").fontSize(7.8).fillColor("#DCE6EE").text("Chisinau, Republic of Moldova",116,57,{width:290});
    doc.font("Bold").fontSize(7).fillColor("#FFFFFF").text("OFFICIAL EMPLOYMENT DOCUMENT",MR-190,25,{width:190,align:"right"});
    doc.font("Regular").fontSize(7.5).fillColor("#DCE6EE").text(dateText,MR-190,40,{width:190,align:"right"});
    doc.rect(0,92,PW,3).fill(gold);

    doc.font("Bold").fontSize(21).fillColor(navy).text("JOB OFFER LETTER",ML,116,{width:CW,align:"center"});
    doc.font("Regular").fontSize(7.5).fillColor(muted).text("FORMAL EMPLOYMENT OFFER",ML,143,{width:CW,align:"center",characterSpacing:1.2});
    doc.moveTo(ML,160).lineTo(MR,160).lineWidth(.6).strokeColor(border).stroke();

    doc.font("Regular").fontSize(9.5).fillColor(ink).text(`Dear ${val(data.applicantName)},`,ML,178);
    doc.font("Regular").fontSize(8.8).fillColor(ink).text(`We are pleased to extend this formal offer of employment to you for the position of ${val(data.jobTitle)} based in ${val(data.location)}.`,ML,197,{width:CW,lineGap:2});

    // Employment details: two compact columns to preserve the original one-page footprint.
    const cardY=232, gap=10, colW=(CW-gap)/2, rowH=28;
    const details:[string,string][]=[
      ["Applicant",val(data.applicantName)],
      ["Position",val(data.jobTitle)],
      ["Work Location",val(data.location)],
      ["Salary Package",val(data.salary)],
      ["Employer",employer],
      ["Start Date",displayDate(data.startDate)],
      ...(data.referenceNumber?[["Reference",val(data.referenceNumber)] as [string,string]]:[]),
      ...(data.applicationDate?[["Application Date",displayDate(data.applicationDate)] as [string,string]]:[]),
    ];
    doc.roundedRect(ML,cardY,CW,66+Math.ceil(details.length/2)*rowH,7).fill(light);
    doc.font("Bold").fontSize(9.2).fillColor(navy).text("EMPLOYMENT DETAILS",ML+13,cardY+12);
    for(let i=0;i<details.length;i++){
      const [label,value]=details[i]; const c=i%2, r=Math.floor(i/2); const x=ML+c*(colW+gap), y=cardY+34+r*rowH;
      doc.font("Bold").fontSize(6.2).fillColor(muted).text(label.toUpperCase(),x+10,y,{width:72});
      doc.font("Regular").fontSize(7.8).fillColor(ink).text(value,x+80,y,{width:colW-90,height:18,ellipsis:true});
    }

    let cursor=cardY+66+Math.ceil(details.length/2)*rowH+12;
    doc.font("Bold").fontSize(9.2).fillColor(navy).text("APPLICANT INFORMATION",ML,cursor); cursor+=15;
    const applicantRows:[string,string][]=[
      ["Email",val(data.email)], ["Phone",val(data.phone)], ["Nationality",val(data.nationality)],
      ["Date of Birth",displayDate(data.dateOfBirth)], ["Passport Number",val(data.passportNumber)],
    ];
    const half=(CW-10)/2, infoH=25;
    for(let i=0;i<applicantRows.length;i+=2){
      const left=applicantRows[i], right=applicantRows[i+1], y=cursor;
      const draw=(item:[string,string],x:number)=>{ doc.roundedRect(x,y,half,infoH,4).lineWidth(.45).strokeColor(border).stroke(); doc.font("Bold").fontSize(5.8).fillColor(muted).text(item[0].toUpperCase(),x+7,y+6,{width:68}); doc.font("Regular").fontSize(7.2).fillColor(ink).text(item[1],x+76,y+6,{width:half-84,height:14,ellipsis:true}); };
      draw(left,ML); if(right) draw(right,ML+half+10); cursor+=30;
    }

    doc.font("Bold").fontSize(9.2).fillColor(navy).text("PROFESSIONAL PROFILE",ML,cursor+2); cursor+=17;
    const profile:[string,string][]=[
      ["Experience",val(data.yearsExperience)], ["Skills",val(data.skills)],
      ["Languages",val(data.languages)], ["Experience Details",val(data.experience)],
    ];
    for(const [label,value] of profile){
      doc.font("Bold").fontSize(6.2).fillColor(muted).text(label.toUpperCase(),ML,cursor,{width:102});
      doc.font("Regular").fontSize(7.3).fillColor(ink).text(value,ML+105,cursor,{width:CW-105,height:15,ellipsis:true});
      cursor+=15;
    }

    if(data.adminNotes){
      doc.font("Bold").fontSize(8.8).fillColor(navy).text("ADDITIONAL NOTES",ML,cursor+2); cursor+=15;
      doc.font("Regular").fontSize(7.2).fillColor(ink).text(data.adminNotes,ML,cursor,{width:CW,height:24,ellipsis:true,lineGap:2}); cursor+=27;
    }

    doc.font("Bold").fontSize(9.2).fillColor(navy).text("TERMS & NEXT STEPS",ML,cursor+2); cursor+=17;
    doc.font("Regular").fontSize(7.4).fillColor(ink).text("This offer is subject to the applicable employment agreement and completion of required immigration, work permit, and pre-employment procedures. Please retain this letter and use the applicant details above for future correspondence.",ML,cursor,{width:CW,height:30,ellipsis:true,lineGap:2});

    // Intentionally no addPage(): the offer letter is kept to one A4 page.
    const footerY=805;
    doc.moveTo(ML,footerY).lineTo(MR,footerY).lineWidth(.6).strokeColor(border).stroke();
    doc.font("Bold").fontSize(7.5).fillColor(navy).text(employer,ML,814);
    doc.font("Regular").fontSize(6.8).fillColor(muted).text("Recruitment & Visa Assistance Team",ML,826);
    doc.font("Regular").fontSize(6.8).fillColor(muted).text("Please retain this letter for your records.",MR-210,817,{width:210,align:"right"});
    doc.end();
  });
}
