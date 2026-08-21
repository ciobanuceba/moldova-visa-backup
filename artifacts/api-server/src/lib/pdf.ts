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
      "  In temeiul art. 32, 43¹din Legea nr. 200 din 16.07.2010 privind regimul strainilor "+
      "in Republica Moldova si demersului \"                                                \", "+
      "prin care se solicita acordarea dreptului de sedere provizore pentru munca",
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
    doc.font("Regular").fontSize(7.5).fillColor("#111").text(
      "  In conformitate cu prevederile art. 164, alin. (1) al Codului Administrativ al Republicii Moldova nr. 116 din 19.07.2018 sunteti in drept sa depuneti cererea prealabila in termen de 30 de zile la comunicare, pentru a contesta decizia Inspectoratului General pentru Migratie. Cererea prealabila se depune la secretariatul Inspectoratului General pentru Migratie, situat pe adresa: mun. Chisinau, str. Stefan cel Mare 124.",
      ML,footerRuleY+6,{width:CW,align:"justify",lineGap:1.5});
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
  return new Promise((resolve,reject)=>{
    const doc=new PDFDocument({size:"A4",margin:0});
    const chunks:Buffer[]=[];
    doc.on("data",c=>chunks.push(c));
    doc.on("end",()=>resolve(Buffer.concat(chunks)));
    doc.on("error",reject);
    doc.registerFont("Regular",path.join(FONTS_DIR,"overpass-regular.ttf"));
    doc.registerFont("Bold",path.join(FONTS_DIR,"overpass-bold.ttf"));

    const ML=54,MR=541,CW=MR-ML;
    const navy="#18324B", gold="#B58A3A", ink="#1F2933", muted="#64748B", light="#F4F6F8";
    const today=new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"});

    // Professional company header
    doc.rect(0,0,595.28,92).fill(navy);
    doc.font("Bold").fontSize(19).fillColor("#FFFFFF").text("MOLDOVA VISA ASSIST SRL",ML,24);
    doc.font("Regular").fontSize(8.5).fillColor("#DCE6EE").text("Recruitment & Visa Assistance",ML,49);
    doc.font("Regular").fontSize(8.5).fillColor("#DCE6EE").text("Stefan cel Mare si Sfant Boulevard 65  •  Chisinau, MD-2001",ML,65);
    doc.font("Regular").fontSize(8.5).fillColor("#FFFFFF").text(`DATE  ${today}`,MR-150,30,{width:150,align:"right"});

    // Gold accent
    doc.rect(0,92,595.28,4).fill(gold);

    doc.font("Bold").fontSize(25).fillColor(navy).text("JOB OFFER LETTER",ML,128,{width:CW,align:"center"});
    doc.font("Regular").fontSize(9).fillColor(muted).text("FORMAL EMPLOYMENT OFFER",ML,158,{width:CW,align:"center",characterSpacing:1.5});

    doc.moveTo(ML,181).lineTo(MR,181).lineWidth(.7).strokeColor("#D7DEE5").stroke();

    doc.font("Regular").fontSize(11).fillColor(ink).text(`Dear ${data.applicantName},`,ML,205);
    doc.font("Regular").fontSize(10.5).fillColor(ink).text(
      `We are pleased to extend this formal offer of employment to you for the position of ${data.jobTitle} based in ${data.location}.`,
      ML,230,{width:CW,lineGap:5,align:"left"});

    // Details card
    const cardY=286, rowH=35;
    doc.roundedRect(ML,cardY,CW, data.employerName||data.startDate ? 190 : 120,8).fill(light);
    doc.font("Bold").fontSize(11).fillColor(navy).text("EMPLOYMENT DETAILS",ML+18,cardY+16);
    const details:[string,string][]=[
      ["Position",data.jobTitle],
      ["Location",data.location],
      ["Salary Package",data.salary],
      ...(data.employerName?[["Employer",data.employerName] as [string,string]]:[]),
      ...(data.startDate?[["Proposed Start Date",data.startDate] as [string,string]]:[]),
    ];
    let y=cardY+47;
    for(const [label,value] of details){
      doc.font("Bold").fontSize(9).fillColor(muted).text(label.toUpperCase(),ML+18,y,{width:125});
      doc.font("Regular").fontSize(10).fillColor(ink).text(value,ML+150,y,{width:CW-168});
      y+=rowH;
    }

    let cursor=Math.max(y+20,cardY+(data.employerName||data.startDate?190:120)+22);
    if(data.adminNotes){
      doc.font("Bold").fontSize(10.5).fillColor(navy).text("ADDITIONAL NOTES",ML,cursor);
      doc.font("Regular").fontSize(9.5).fillColor(ink).text(data.adminNotes,ML,cursor+22,{width:CW,lineGap:4});
      cursor=doc.y+18;
    }

    doc.font("Bold").fontSize(10.5).fillColor(navy).text("TERMS",ML,cursor);
    doc.font("Regular").fontSize(9.5).fillColor(ink).text(
      "This offer is contingent upon the successful completion of applicable visa, work permit, and pre-employment requirements. Please review the employment details above and confirm acceptance according to the instructions provided by the recruitment team.",
      ML,cursor+22,{width:CW,lineGap:4});

    const footerY=760;
    doc.moveTo(ML,footerY).lineTo(MR,footerY).lineWidth(.7).strokeColor("#D7DEE5").stroke();
    doc.font("Bold").fontSize(9).fillColor(navy).text("MOLDOVA VISA ASSIST SRL",ML,777);
    doc.font("Regular").fontSize(8.5).fillColor(muted).text("Recruitment & Visa Assistance Team",ML,792);
    doc.font("Regular").fontSize(8.5).fillColor(muted).text("contact@moldova-visa-assist.replit.app",MR-220,777,{width:220,align:"right"});
    doc.text("Please retain this letter for your records.",MR-220,792,{width:220,align:"right"});
    doc.end();
  });
}
