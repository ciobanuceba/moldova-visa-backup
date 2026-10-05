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
    const PW=595.28, ML=50, MR=545, CW=495;
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
    doc.font("Regular").fontSize(9.5).fillColor("#000").text("  In temeiul art. 32, 43¹din Legea nr. 200 din 16.07.2010 privind regimul strainilor in Republica Moldova si demersului \"                                                \", prin care se solicita acordarea dreptului de sedere provizore pentru munca",ML,preambleY,{width:CW,align:"justify",lineGap:2});
    const ab1Y=328,natCol=ML+32,nameX=ML;
    doc.font("Bold").fontSize(9.5).text("cet.",ML,ab1Y);
    doc.font("Bold").fontSize(9.5).text("REPUBLICA POPULARA",natCol,ab1Y).text(data.nationality.toUpperCase(),natCol,ab1Y+13);
    const fullName=(data.firstName+" "+data.lastName).toUpperCase();
    doc.font("Bold").fontSize(9.5).text(fullName,nameX,ab1Y,{width:CW,align:"right"});
    doc.moveTo(natCol,ab1Y+25).lineTo(natCol+120,ab1Y+25).lineWidth(.5).stroke();
    const nameW=Math.min(doc.widthOfString(fullName)+4,180);
    doc.moveTo(MR-nameW,ab1Y+25).lineTo(MR,ab1Y+25).lineWidth(.5).stroke();
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

export async function generateOfferLetterPdf(data: OfferLetterData): Promise<Buffer> {
  return new Promise((resolve,reject)=>{
    const doc=new PDFDocument({size:"A4",margin:0});
    const chunks:Buffer[]=[];
    doc.on("data",c=>chunks.push(c));
    doc.on("end",()=>resolve(Buffer.concat(chunks)));
    doc.on("error",reject);

    doc.registerFont("Regular",path.join(FONTS_DIR,"overpass-regular.ttf"));
    doc.registerFont("Bold",path.join(FONTS_DIR,"overpass-bold.ttf"));

    const PW=595.28;
    const PH=841.89;
    const ML=54;
    const MR=541;
    const CW=MR-ML;
    const NAVY="#0b3478";
    const BLUE="#1556a8";
    const GOLD="#f2bd18";
    const TEXT="#173052";
    const MUTED="#5f6f85";
    const PALE="#f2f7fc";

    const today=new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"});

    // Branded header — job/application data below remains unchanged.
    doc.rect(0,0,PW,126).fill("#ffffff");
    try {
      doc.image(path.join(__dirname,"..","..","moldova-visa-assist","public","moldova_logo.png"),ML,23,{fit:[315,78]});
    } catch {
      doc.font("Bold").fontSize(22).fillColor(NAVY).text("MOLDOVA VISA ASSIST",ML,38);
      doc.font("Regular").fontSize(8.5).fillColor(GOLD).text("YOUR TRUSTED PARTNER FOR MOLDOVA VISA",ML,66);
    }

    doc.font("Bold").fontSize(9.5).fillColor(TEXT)
      .text("Moldova Visa Assist SRL",365,31,{width:176,align:"left"})
      .font("Regular").fontSize(8.5).fillColor(TEXT)
      .text("Stefan cel Mare si Sfant Boulevard 65",365,48,{width:176})
      .text("Chisinau, MD-2001, Republic of Moldova",365,63,{width:176})
      .font("Bold").fontSize(8.5).text(`Date: ${today}`,365,82,{width:176});

    doc.rect(0,122,PW,4).fill(NAVY);
    doc.rect(455,122,140,4).fill(GOLD);

    doc.font("Bold").fontSize(25).fillColor(NAVY)
      .text("JOB OFFER LETTER",ML,153,{width:CW,align:"center"});
    doc.rect(172,191,251,2).fill(BLUE);
    doc.rect(275,191,45,2).fill(GOLD);

    let y=224;
    doc.font("Regular").fontSize(11).fillColor(TEXT)
      .text(`Dear ${data.applicantName},`,ML,y,{width:CW});
    y=254;
    doc.text(
      `We are pleased to extend this formal offer of employment to you for the position of ${data.jobTitle} based in ${data.location}.`,
      ML,y,{width:CW,lineGap:4}
    );
    y=303;

    // Employment details box.
    const details:[string,string][]=[
      ["Position",data.jobTitle],
      ["Location",data.location],
      ["Salary Package",data.salary],
      ...(data.employerName?[["Employer",data.employerName] as [string,string]]:[]),
      ...(data.startDate?[["Proposed Start Date",data.startDate] as [string,string]]:[]),
    ];
    const detailRows=details.length;
    const rowH=28;
    const boxH=detailRows*rowH+34;

    doc.roundedRect(ML,y,CW,boxH,7).fill(PALE);
    doc.roundedRect(ML,y-11,170,30,6).fill(BLUE);
    doc.font("Bold").fontSize(11).fillColor("#ffffff").text("Employment Details:",ML+10,y-3,{width:150});

    details.forEach(([label,value],i)=>{
      const ry=y+27+i*rowH;
      if(i>0) doc.moveTo(ML+72,ry-4).lineTo(MR-10,ry-4).lineWidth(.45).strokeColor("#d7e1ec").stroke();
      doc.font("Bold").fontSize(9.5).fillColor(NAVY).text(`${label}:`,ML+12,ry,{width:145});
      doc.font("Regular").fontSize(9.5).fillColor(TEXT).text(value,ML+154,ry,{width:CW-170});
    });

    y += boxH+40;

    if(data.adminNotes && data.adminNotes.trim() !== "Manual Job Offer created by admin."){
      doc.roundedRect(ML,y,CW,54,6).fill(PALE);
      doc.roundedRect(ML,y-11,160,30,6).fill(BLUE);
      doc.font("Bold").fontSize(11).fillColor("#ffffff").text("Additional Notes:",ML+10,y-3,{width:140});
      doc.font("Regular").fontSize(9.5).fillColor(TEXT).text(data.adminNotes,ML+16,y+18,{width:CW-32});
      y += 82;
    }

    doc.font("Regular").fontSize(10.5).fillColor(TEXT)
      .text(
        "This offer is contingent upon the successful completion of all visa, work permit, and pre-employment requirements. Moldova Visa Assist will guide you through each step of the process.",
        ML,y,{width:CW,lineGap:4}
      );
    y=doc.y+22;

    doc.text(
      "Please confirm your acceptance of this offer by replying to this email within 5 business days.",
      ML,y,{width:CW,lineGap:3}
    );
    y=doc.y+22;

    doc.text("Congratulations and welcome to the team!",ML,y,{width:CW});
    y=doc.y+28;

    // Closing/contact block.
    doc.font("Bold").fontSize(11).fillColor(NAVY).text("Moldova Visa Assist SRL",ML,y);
    doc.font("Regular").fontSize(9.5).fillColor(TEXT).text("Recruitment & Visa Assistance Team",ML,y+18);
    doc.text("ciobanuceban@gmail.com",ML,y+35);
    doc.font("Regular").fontSize(8.8).fillColor(BLUE)
      .text("https://moldova-visa-assist.onrender.com/",ML,y+51);

    // Decorative company branding seal only; not a government/immigration seal.
    const sealX=452;
    const sealY=Math.min(y+32,715);
    doc.save();
    doc.circle(sealX,sealY,43).lineWidth(1.6).strokeColor(BLUE).stroke();
    doc.circle(sealX,sealY,36).lineWidth(1).strokeColor(GOLD).stroke();
    doc.font("Bold").fontSize(5.7).fillColor(NAVY)
      .text("MOLDOVA VISA ASSIST SRL",sealX-30,sealY-22,{width:60,align:"center"})
      .font("Bold").fontSize(15).fillColor(NAVY)
      .text("MVA",sealX-22,sealY-8,{width:44,align:"center"})
      .font("Bold").fontSize(5.2).fillColor(BLUE)
      .text("TRUST • SERVICE • SUPPORT",sealX-31,sealY+12,{width:62,align:"center"});
    doc.restore();

    // Branded footer.
    const fy=PH-70;
    doc.rect(0,fy,PW,70).fill(NAVY);
    doc.moveTo(0,fy+14).lineTo(155,fy+2).lineTo(300,fy+15).lineTo(455,fy+3).lineTo(PW,fy+14)
      .lineTo(PW,fy).lineTo(0,fy).closePath().fill(GOLD);
    doc.font("Regular").fontSize(8.5).fillColor("#ffffff")
      .text("Your Trusted Partner for Moldova Visa",54,fy+36)
      .text("moldova-visa-assist.onrender.com",365,fy+36,{width:176,align:"right"});

    doc.end();
  });
}
