import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FONTS_DIR = path.join(__dirname, "..", "fonts");

function fmtDate(d: Date): string { const dd=String(d.getDate()).padStart(2,"0"); const mm=String(d.getMonth()+1).padStart(2,"0"); return `${dd}.${mm}.${d.getFullYear()}`; }
function fmtDOB(raw: string): string { const iso=raw.match(/^(\d{4})-(\d{2})-(\d{2})$/); return iso?`${iso[3]}.${iso[2]}.${iso[1]}`:raw; }
function spaced(s: string): string { return s.split("").join(" "); }

interface WorkPermitDecisionData { referenceNumber:string; firstName:string; lastName:string; nationality:string; dateOfBirth:string; passportNumber:string; approvedAt:Date; validUntil:Date; }

export async function generateWorkPermitDecisionPdf(data: WorkPermitDecisionData): Promise<Buffer> { return new Promise((resolve,reject)=>{
 const doc=new PDFDocument({size:"A4",margin:0}); const chunks:Buffer[]=[]; doc.on("data",c=>chunks.push(c)); doc.on("end",()=>resolve(Buffer.concat(chunks))); doc.on("error",reject);
 doc.registerFont("Regular",path.join(FONTS_DIR,"overpass-regular.ttf")); doc.registerFont("Bold",path.join(FONTS_DIR,"overpass-bold.ttf"));
 const PW=595.28,ML=50,MR=545,CW=495; doc.moveTo(ML,45).lineTo(MR,45).lineWidth(1.8).stroke();
 doc.rect(ML,50,36,36).lineWidth(.7).stroke(); doc.font("Regular").fontSize(4.5).fillColor("#555").text("SEAL",ML+9,65);
 doc.rect(MR-36,50,36,36).lineWidth(.7).stroke(); doc.fontSize(4.5).text("IGM",MR-27,65);
 const hdrLeft=ML+42,hdrW=CW-84; doc.font("Bold").fontSize(9.5).fillColor("#000").text("Ministerul Afacerilor Interne al Republicii Moldova",hdrLeft,53,{width:hdrW,align:"center",lineGap:1}).text("Inspectoratul General Pentru Migratie",hdrLeft,doc.y,{width:hdrW,align:"center",lineGap:1}).text("Directia regionala Centru",hdrLeft,doc.y,{width:hdrW,align:"center"});
 doc.moveTo(ML,94).lineTo(MR,94).lineWidth(1.8).stroke(); doc.moveTo(ML,96.5).lineTo(MR,96.5).lineWidth(.6).stroke();
 doc.font("Regular").fontSize(7.5).fillColor("#111").text("MD 2012, mun. Chisinau, bd. Stefan cel Mare 124  tel: 0-22-265-607",ML,102,{width:CW,align:"center"}).text("e-mail: centru@igm.gov.md",ML,113,{width:CW,align:"center"});
 doc.font("Bold").fontSize(17).fillColor("#000").text(spaced("DECIZIE")+"  nr.  "+data.referenceNumber,ML,168,{width:CW,align:"center"});
 doc.font("Regular").fontSize(10.5).text("cu privire la dreptul de sedere provizori in scope de munca",ML,197,{width:CW,align:"center"}).text("lurator imigrant",ML,211,{width:CW,align:"center"});
 doc.font("Bold").fontSize(10).text(fmtDate(data.approvedAt),ML,252).text("mun. Chisinau",ML,252,{width:CW,align:"right"});
 doc.font("Regular").fontSize(9.5).text("  In temeiul art. 32, 43¹din Legea nr. 200 din 16.07.2010 privind regimul strainilor in Republica Moldova si demersului \"                                                \", prin care se solicita acordarea dreptului de sedere provizore pentru munca",ML,272,{width:CW,align:"justify",lineGap:2});
 const natCol=ML+32,fullName=(data.firstName+" "+data.lastName).toUpperCase(),nameW=Math.min(doc.widthOfString(fullName)+4,180); const addApplicant=(y:number)=>{ doc.font("Bold").fontSize(9.5).text("cet.",ML,y).text("REPUBLICA POPULARA",natCol,y).text(data.nationality.toUpperCase(),natCol,y+13).text(fullName,ML,y,{width:CW,align:"right"}); doc.moveTo(natCol,y+25).lineTo(natCol+120,y+25).lineWidth(.5).stroke(); doc.moveTo(MR-nameW,y+25).lineTo(MR,y+25).lineWidth(.5).stroke(); doc.font("Regular").fontSize(7).text("cetatenia",natCol,y+28,{width:80}).text("numele, prenumele",ML,y+28,{width:CW,align:"right"}); };
 addApplicant(328); doc.font("Bold").fontSize(13).text(spaced("D E C I D")+":",ML,372,{width:CW,align:"center"}); doc.font("Bold").fontSize(10).text("Se aprobare dreptul de sedere provizorie pentru munca in Republica Moldova",ML,392,{width:CW,align:"left",lineGap:2}); addApplicant(418);
 doc.font("Bold").fontSize(9.5).text("data nasterii",ML,458); doc.moveTo(ML+78,471).lineTo(ML+160,471).lineWidth(.5).stroke(); doc.font("Regular").fontSize(9.5).text(fmtDOB(data.dateOfBirth),ML+80,458);
 doc.font("Bold").fontSize(9.5).text(",pasaport national seria",ML+162,458).text("A",ML+288,458).text("nr.",ML+302,458); doc.moveTo(ML+318,471).lineTo(MR,471).lineWidth(.5).stroke(); doc.font("Regular").fontSize(9.5).text(data.passportNumber,ML+320,458);
 doc.font("Bold").fontSize(9.5).text("pe perioada de pana la",ML,478); doc.moveTo(ML+148,491).lineTo(ML+280,491).lineWidth(.5).stroke(); doc.font("Bold").fontSize(9.5).text(fmtDate(data.validUntil),ML+150,478);
 doc.font("Bold").fontSize(10).text("Sef Directie regionala",ML,520).text("Veaceslav PATRAS",ML,520,{width:CW,align:"right"}); try{doc.image(path.join(FONTS_DIR,"stamp.png"),PW/2-55,505,{width:110});}catch{doc.circle(PW/2,550,34).lineWidth(.9).strokeColor("#666").stroke();}
 doc.moveTo(ML,620).lineTo(MR,620).lineWidth(.8).stroke(); doc.font("Regular").fontSize(7.5).fillColor("#111").text("  In conformitate cu prevederile art. 164, alin. (1) al Codului Administrativ al Republicii Moldova nr. 116 din 19.07.2018 sunteti in drept sa depuneti cererea prealabila in termen de 30 de zile la comunicare, pentru a contesta decizia Inspectoratului General pentru Migratie. Cererea prealabila se depune la secretariatul Inspectoratului General pentru Migratie, situat pe adresa: mun. Chisinau, str. Stefan cel Mare 124.",ML,626,{width:CW,align:"justify",lineGap:1.5}); doc.text("  Informatia din acest document contine date cu caracter personal si necesita a fi prelucrata si protejata in conformitate cu Legea nr. 133 din 08.07.2011 privind protectia datelor cu caracter personal.",ML,doc.y+5,{width:CW,align:"justify",lineGap:1.5}); doc.end();
}); }

interface OfferLetterData { applicantName:string; jobTitle:string; location:string; salary:string; startDate?:string; employerName?:string; adminNotes?:string; referenceNumber?:string; }

export async function generateOfferLetterPdf(data: OfferLetterData): Promise<Buffer> { return new Promise((resolve,reject)=>{
 const doc=new PDFDocument({size:"A4",margin:54}); const chunks:Buffer[]=[]; doc.on("data",c=>chunks.push(c)); doc.on("end",()=>resolve(Buffer.concat(chunks))); doc.on("error",reject); doc.registerFont("Regular",path.join(FONTS_DIR,"overpass-regular.ttf")); doc.registerFont("Bold",path.join(FONTS_DIR,"overpass-bold.ttf"));
 const ref=data.referenceNumber || `MVA-APP-${createHash("sha256").update([data.applicantName,data.jobTitle,data.location,data.salary,data.startDate||""].join("|")).digest("hex").slice(0,10).toUpperCase()}`; const brand=data.employerName||"Moldova Visa Assist";
 doc.lineWidth(1.2).moveTo(54,54).lineTo(541,54).stroke(); try{doc.image(path.join(FONTS_DIR,"stamp.png"),54,68,{width:62,height:62,fit:[62,62],align:"left",valign:"center"});}catch{}
 doc.font("Bold").fontSize(18).fillColor("#111827").text(brand,130,74,{width:320}); doc.font("Regular").fontSize(9).fillColor("#6b7280").text("Employment / Job Offer Letter",130,98,{width:320}); doc.font("Bold").fontSize(9).fillColor("#111827").text(`Reference: ${ref}`,395,75,{width:146,align:"right"}); doc.font("Regular").fontSize(8).fillColor("#6b7280").text(`Issued: ${new Date().toLocaleDateString("en-GB")}`,395,92,{width:146,align:"right"});
 doc.moveTo(54,145).lineTo(541,145).lineWidth(.6).strokeColor("#d1d5db").stroke(); doc.font("Bold").fontSize(15).fillColor("#111827").text("JOB OFFER",54,170,{width:487,align:"center"}); doc.font("Regular").fontSize(10).fillColor("#374151").text(`Dear ${data.applicantName},`,54,210,{width:487}); doc.text(`We are pleased to present this employment offer for the position of ${data.jobTitle}. The details below summarize the proposed employment terms.`,54,232,{width:487,lineGap:3});
 const rows:[string,string][]=[["Applicant",data.applicantName],["Position",data.jobTitle],["Employer",brand],["Work location",data.location],["Salary",data.salary],["Proposed start date",data.startDate||"To be confirmed"],["Reference number",ref]]; let y=285; const labelX=70,valX=210,rowH=35;
 for(const [label,value] of rows){doc.roundedRect(54,y-5,487,rowH-4,3).fillColor("#f8fafc").fill(); doc.font("Bold").fontSize(9).fillColor("#374151").text(label,labelX,y+4,{width:130}); doc.font("Regular").fontSize(9.5).fillColor("#111827").text(String(value),valX,y+4,{width:315}); y+=rowH;}
 doc.font("Bold").fontSize(10).fillColor("#111827").text("Terms and next steps",54,y+18); doc.font("Regular").fontSize(9).fillColor("#374151").text("This letter is issued by the employer/agency identified above and is subject to the applicable employment contract and immigration requirements. Please retain the reference number for future correspondence.",54,y+40,{width:487,lineGap:3}); if(data.adminNotes){doc.font("Bold").fontSize(9).fillColor("#111827").text("Additional note",54,y+92); doc.font("Regular").fontSize(9).fillColor("#374151").text(data.adminNotes,54,y+110,{width:487,lineGap:3});}
 const sigY=Math.min(690,y+(data.adminNotes?165:125)); doc.font("Regular").fontSize(9).fillColor("#374151").text("Authorized representative",54,sigY); doc.moveTo(54,sigY+28).lineTo(235,sigY+28).lineWidth(.6).stroke(); try{doc.image(path.join(FONTS_DIR,"stamp.png"),400,sigY-10,{width:90,height:90,fit:[90,90],align:"center",valign:"center"});}catch{} doc.font("Regular").fontSize(7.5).fillColor("#6b7280").text(`Reference ${ref} • Keep this number when contacting ${brand}.`,54,760,{width:487,align:"center"}); doc.end();
}); }