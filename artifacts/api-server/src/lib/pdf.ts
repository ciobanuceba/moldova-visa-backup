import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";
import { db, applicationsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FONTS_DIR = path.join(__dirname, "..", "fonts");
const LOGO_PATH = path.join(FONTS_DIR, "moldova-coa.png");

interface WorkPermitDecisionData { referenceNumber: string; firstName: string; lastName: string; nationality: string; dateOfBirth: string; passportNumber: string; approvedAt: Date; validUntil: Date; }

function fmtDate(d: Date): string { return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}.${d.getFullYear()}`; }
function fmtDOB(raw: string): string { const iso=String(raw||"").match(/^(\d{4})-(\d{2})-(\d{2})$/); return iso ? `${iso[3]}.${iso[2]}.${iso[1]}` : raw; }
function spaced(s: string): string { return s.split("").join(" "); }

export async function generateWorkPermitDecisionPdf(data: WorkPermitDecisionData): Promise<Buffer> {
  return new Promise((resolve,reject)=>{
    const doc=new PDFDocument({size:"A4",margin:0}); const chunks:Buffer[]=[];
    doc.on("data",c=>chunks.push(c)); doc.on("end",()=>resolve(Buffer.concat(chunks))); doc.on("error",reject);
    doc.registerFont("Regular",path.join(FONTS_DIR,"overpass-regular.ttf")); doc.registerFont("Bold",path.join(FONTS_DIR,"overpass-bold.ttf"));
    const PW=595.28,ML=50,MR=545,CW=495;
    doc.moveTo(ML,45).lineTo(MR,45).lineWidth(1.8).strokeColor("#000").stroke();
    doc.rect(ML,50,36,36).lineWidth(.7).strokeColor("#555").stroke(); doc.font("Regular").fontSize(4.5).fillColor("#555").text("SEAL",ML+9,65);
    doc.rect(MR-36,50,36,36).lineWidth(.7).strokeColor("#555").stroke(); doc.text("IGM",MR-27,65);
    const hdrLeft=ML+42,hdrW=CW-84;
    doc.font("Bold").fontSize(9.5).fillColor("#000").text("Ministerul Afacerilor Interne al Republicii Moldova",hdrLeft,53,{width:hdrW,align:"center",lineGap:1}).text("Inspectoratul General Pentru Migratie",hdrLeft,doc.y,{width:hdrW,align:"center",lineGap:1}).text("Directia regionala Centru",hdrLeft,doc.y,{width:hdrW,align:"center"});
    doc.moveTo(ML,94).lineTo(MR,94).lineWidth(1.8).strokeColor("#000").stroke(); doc.moveTo(ML,96.5).lineTo(MR,96.5).lineWidth(.6).strokeColor("#000").stroke();
    doc.font("Regular").fontSize(7.5).fillColor("#111").text("MD 2012, mun. Chisinau, bd. Stefan cel Mare 124  tel: 0-22-265-607",ML,102,{width:CW,align:"center"}).text("e-mail: centru@igm.gov.md",ML,113,{width:CW,align:"center"});
    doc.font("Bold").fontSize(17).fillColor("#000").text(spaced("DECIZIE")+"  nr.  "+data.referenceNumber,ML,168,{width:CW,align:"center"});
    doc.font("Regular").fontSize(10.5).text("cu privire la dreptul de sedere provizori in scope de munca",ML,197,{width:CW,align:"center"}).text("lurator imigrant",ML,211,{width:CW,align:"center"});
    doc.font("Bold").fontSize(10).text(fmtDate(data.approvedAt),ML,252).text("mun. Chisinau",ML,252,{width:CW,align:"right"});
    doc.font("Regular").fontSize(9.5).text("  In temeiul art. 32, 43¹din Legea nr. 200 din 16.07.2010 privind regimul strainilor in Republica Moldova si demersului \"                                                \", prin care se solicita acordarea dreptului de sedere provizore pentru munca",ML,272,{width:CW,align:"justify",lineGap:2});
    const natCol=ML+32,fullName=(data.firstName+" "+data.lastName).toUpperCase(),nameW=Math.min((doc.font("Bold").fontSize(9.5).widthOfString(fullName)+4),180);
    for(const y of [328,418]){
      doc.font("Bold").fontSize(9.5).text("cet.",ML,y).text("REPUBLICA POPULARA",natCol,y).text(data.nationality.toUpperCase(),natCol,y+13).text(fullName,ML,y,{width:CW,align:"right"});
      doc.moveTo(natCol,y+25).lineTo(natCol+120,y+25).lineWidth(.5).stroke(); doc.moveTo(MR-nameW,y+25).lineTo(MR,y+25).lineWidth(.5).stroke();
      doc.font("Regular").fontSize(7).text("cetatenia",natCol,y+28,{width:80}).text("mamelc, prenumele",ML,y+28,{width:CW,align:"right"});
    }
    doc.font("Bold").fontSize(13).text(spaced("D E C I D")+":",ML,372,{width:CW,align:"center"}); doc.font("Bold").fontSize(10).text("Se aprobare dreptul de sedere provizorie pentru munca in Republica Moldova",ML,392,{width:CW,align:"left",lineGap:2});
    const rowY=458; doc.font("Bold").fontSize(9.5).text("data nasterii",ML,rowY); doc.moveTo(ML+78,rowY+13).lineTo(ML+160,rowY+13).lineWidth(.5).stroke(); doc.font("Regular").fontSize(9.5).text(fmtDOB(data.dateOfBirth),ML+80,rowY); doc.font("Bold").fontSize(9.5).text(",pasaport national seria",ML+162,rowY).text("A",ML+288,rowY).text("nr.",ML+302,rowY); doc.moveTo(ML+318,rowY+13).lineTo(MR,rowY+13).lineWidth(.5).stroke(); doc.font("Regular").fontSize(9.5).text(data.passportNumber,ML+320,rowY);
    doc.font("Bold").fontSize(9.5).text("pe perioada de pana la",ML,478); doc.moveTo(ML+148,491).lineTo(ML+280,491).lineWidth(.5).stroke(); doc.font("Bold").fontSize(9.5).text(fmtDate(data.validUntil),ML+150,478);
    doc.font("Bold").fontSize(10).text("Sef Directie regionala",ML,520).text("Veaceslav PATRAS",ML,520,{width:CW,align:"right"}); try{doc.image(path.join(FONTS_DIR,"stamp.png"),PW/2-55,505,{width:110});}catch{doc.circle(PW/2,550,34).lineWidth(.9).strokeColor("#666").stroke();}
    doc.moveTo(ML,620).lineTo(MR,620).lineWidth(.8).strokeColor("#000").stroke(); doc.font("Regular").fontSize(7.5).fillColor("#111").text("  In conformitate cu prevederile art. 164, alin. (1) al Codului Administrativ al Republicii Moldova nr. 116 din 19.07.2018 sunteti in drept sa depuneti cererea prealabila in termen de 30 de zile la comunicare, pentru a contesta decizia Inspectoratului General pentru Migratie. Cererea prealabila se depune la secretariatul Inspectoratului General pentru Migratie, situat pe adresa: mun. Chisinau, str. Stefan cel Mare 124.",ML,626,{width:CW,align:"justify",lineGap:1.5}); doc.font("Regular").fontSize(7.5).text("  Informatia din acest document contine date cu caracter personal si necesita a fi prelucrata si protejata in conformitate cu Legea nr. 133 din 08.07.2011 privind protectia datelor cu caracter personal.",ML,doc.y+5,{width:CW,align:"justify",lineGap:1.5});
    doc.end();
  });
}

interface OfferLetterData { applicantName:string; jobTitle:string; location:string; salary:string; startDate?:string; employerName?:string; adminNotes?:string; referenceNumber?:string; applicationDate?:string; email?:string; phone?:string; nationality?:string; dateOfBirth?:string; passportNumber?:string; yearsExperience?:string; skills?:string; languages?:string; experience?:string; coverLetter?:string; resumeUrl?:string; }
function val(value:unknown,fallback="Not provided"):string{const s=String(value??"").trim();return s||fallback;}
function humanDate(value?:string):string{if(!value)return "Not provided"; const d=new Date(value); if(Number.isNaN(d.getTime())) return value; return d.toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"});}
function cleanJobTitle(value:string):string{return value.replace(/([a-z])([A-Z])/g,"$1 $2").replace(/\s+/g," ").trim();}
function cleanName(value:string):string{return value.replace(/\s+/g," ").trim().replace(/\b\w/g,c=>c.toUpperCase());}
function cleanResume(value?:string):string{if(!value)return "Not provided"; const name=value.split("/").pop()||value; return name.replace(/^resume-[a-z0-9]+-/i,"");}

export async function generateOfferLetterPdf(input:OfferLetterData):Promise<Buffer>{
  let data=input;
  try{
    const parts=String(data.applicantName||"").trim().split(/\s+/); const firstName=parts.shift()||""; const lastName=parts.join(" ");
    if(firstName&&lastName){const rows=await db.select().from(applicationsTable).where(and(eq(applicationsTable.firstName,firstName),eq(applicationsTable.lastName,lastName))).limit(1); const app=rows[0]; if(app)data={...data,email:data.email||app.email,phone:data.phone||app.phone,nationality:data.nationality||app.nationality||undefined,dateOfBirth:data.dateOfBirth||app.dateOfBirth||undefined,passportNumber:data.passportNumber||app.passportNumber||undefined,yearsExperience:data.yearsExperience||app.yearsExperience||undefined,skills:data.skills||app.skills||undefined,languages:data.languages||app.languages||undefined,experience:data.experience||app.experience||undefined,coverLetter:data.coverLetter||app.coverLetter||undefined,resumeUrl:data.resumeUrl||app.resumeUrl||undefined,applicationDate:data.applicationDate||app.createdAt.toISOString()};}
  }catch{}
  return new Promise((resolve,reject)=>{
    const doc=new PDFDocument({size:"A4",margin:0}); const chunks:Buffer[]=[]; doc.on("data",c=>chunks.push(c)); doc.on("end",()=>resolve(Buffer.concat(chunks))); doc.on("error",reject);
    doc.registerFont("Regular",path.join(FONTS_DIR,"overpass-regular.ttf")); doc.registerFont("Bold",path.join(FONTS_DIR,"overpass-bold.ttf"));
    const PW=595.28,ML=54,MR=541,CW=MR-ML,navy="#18324B",gold="#B58A3A",ink="#1F2933",muted="#64748B",light="#F4F6F8";
    const applicant=cleanName(val(data.applicantName)); const jobTitle=cleanJobTitle(val(data.jobTitle)); const employer=val(data.employerName,"MOLDOVA VISA ASSIST SRL"); const issueDate=humanDate(data.applicationDate)||new Date().toLocaleDateString("en-GB");
    const header=()=>{doc.rect(0,0,PW,108).fill(navy); try{doc.image(LOGO_PATH,ML,18,{fit:[58,58],align:"center",valign:"center"});}catch{} const bx=128; doc.font("Bold").fontSize(18).fillColor("#FFF").text(employer,bx,25,{width:285}); doc.font("Regular").fontSize(8.5).fillColor("#DCE6EE").text("Recruitment & Visa Assistance",bx,51); doc.text("Chisinau, Republic of Moldova",bx,67); doc.font("Bold").fontSize(7.5).fillColor("#FFF").text("OFFICIAL EMPLOYMENT DOCUMENT",MR-180,30,{width:180,align:"right"}); doc.font("Regular").fontSize(8).fillColor("#DCE6EE").text(issueDate,MR-180,48,{width:180,align:"right"}); doc.rect(0,108,PW,4).fill(gold);};
    const footer=(page2=false)=>{doc.moveTo(ML,760).lineTo(MR,760).lineWidth(.7).strokeColor("#D7DEE5").stroke(); doc.font("Bold").fontSize(8.5).fillColor(navy).text(employer,ML,774); doc.font("Regular").fontSize(7.8).fillColor(muted).text("Recruitment & Visa Assistance Team",ML,788); doc.font("Regular").fontSize(7.8).text(page2?"Please retain this letter for your records.":"Job Offer Letter",MR-220,780,{width:220,align:"right"});};
    header();
    doc.font("Bold").fontSize(24).fillColor(navy).text("JOB OFFER LETTER",ML,142,{width:CW,align:"center"}); doc.font("Regular").fontSize(8.5).fillColor(muted).text("FORMAL EMPLOYMENT OFFER",ML,172,{width:CW,align:"center",characterSpacing:1.4}); doc.moveTo(ML,194).lineTo(MR,194).lineWidth(.7).strokeColor("#D7DEE5").stroke();
    doc.font("Regular").fontSize(11).fillColor(ink).text(`Dear ${applicant},`,ML,218); doc.font("Regular").fontSize(10.2).text(`We are pleased to extend this formal offer of employment to you for the position of ${jobTitle} based in ${val(data.location)}.`,ML,244,{width:CW,lineGap:5});
    const details:[string,string][]=[["Applicant",applicant],["Position",jobTitle],["Work Location",val(data.location)],["Salary Package",val(data.salary)],["Employer",employer],["Proposed Start Date",humanDate(data.startDate)],["Application Reference",val(data.referenceNumber)],["Application Date",humanDate(data.applicationDate)]];
    const cardY=292,cardH=66+details.length*28; doc.roundedRect(ML,cardY,CW,cardH,8).fill(light); doc.font("Bold").fontSize(11).fillColor(navy).text("EMPLOYMENT DETAILS",ML+18,cardY+16); let y=cardY+46;
    for(const [label,value] of details){doc.font("Bold").fontSize(7.5).fillColor(muted).text(label.toUpperCase(),ML+18,y,{width:132}); doc.font("Regular").fontSize(9).fillColor(ink).text(value,ML+154,y,{width:CW-172}); y+=28;}
    const infoY=610; doc.font("Bold").fontSize(10.5).fillColor(navy).text("APPLICANT INFORMATION",ML,infoY); const rows:[[string,string],[string,string]][]=[];
    const applicantRows:[string,string][]=[["Email",val(data.email)],["Phone",val(data.phone)],["Nationality",val(data.nationality)],["Date of Birth",humanDate(data.dateOfBirth)],["Passport Number",val(data.passportNumber)]];
    const half=(CW-14)/2; let iy=infoY+20;
    for(let i=0;i<applicantRows.length;i+=2){const left=applicantRows[i],right=applicantRows[i+1]; doc.roundedRect(ML,iy,half,30,5).lineWidth(.5).strokeColor("#D7DEE5").stroke(); doc.font("Bold").fontSize(6.5).fillColor(muted).text(left[0].toUpperCase(),ML+8,iy+7,{width:78}); doc.font("Regular").fontSize(7.7).fillColor(ink).text(left[1],ML+88,iy+7,{width:half-96}); if(right){const rx=ML+half+14; doc.roundedRect(rx,iy,half,30,5).lineWidth(.5).strokeColor("#D7DEE5").stroke(); doc.font("Bold").fontSize(6.5).fillColor(muted).text(right[0].toUpperCase(),rx+8,iy+7,{width:78}); doc.font("Regular").fontSize(7.7).fillColor(ink).text(right[1],rx+88,iy+7,{width:half-96});} iy+=35;}
    footer(false); doc.addPage(); header();
    doc.font("Bold").fontSize(13).fillColor(navy).text("PROFESSIONAL PROFILE",ML,142); let py=172;
    const profile:[string,string][]=[["Experience",val(data.yearsExperience)],["Skills",val(data.skills)],["Languages",val(data.languages)],["Experience Details",val(data.experience)]];
    for(const [label,value] of profile){doc.font("Bold").fontSize(8).fillColor(muted).text(label.toUpperCase(),ML,py,{width:120}); doc.font("Regular").fontSize(9).fillColor(ink).text(value,ML+130,py,{width:CW-130,lineGap:3}); py=Math.max(py+22,doc.y+9);}
    if(data.coverLetter){doc.font("Bold").fontSize(10.5).fillColor(navy).text("APPLICANT STATEMENT",ML,py+10); doc.font("Regular").fontSize(8.8).fillColor(ink).text(data.coverLetter,ML,py+31,{width:CW,lineGap:4}); py=doc.y+16;}
    if(data.adminNotes){doc.font("Bold").fontSize(10.5).fillColor(navy).text("ADDITIONAL NOTES",ML,py+8); doc.font("Regular").fontSize(8.8).fillColor(ink).text(data.adminNotes,ML,py+29,{width:CW,lineGap:4}); py=doc.y+16;}
    doc.font("Bold").fontSize(13).fillColor(navy).text("TERMS & NEXT STEPS",ML,py+16); doc.font("Regular").fontSize(9).fillColor(ink).text("This offer is subject to the applicable employment agreement and completion of required immigration, work permit, and pre-employment procedures. Please retain this letter and use the applicant details above for future correspondence.",ML,py+41,{width:CW,lineGap:5});
    if(data.resumeUrl){doc.font("Bold").fontSize(8).fillColor(navy).text("Submitted Resume",ML,doc.y+18); doc.font("Regular").fontSize(8).fillColor(muted).text(cleanResume(data.resumeUrl),ML,doc.y+6,{width:CW});}
    footer(true); doc.end();
  });
}
