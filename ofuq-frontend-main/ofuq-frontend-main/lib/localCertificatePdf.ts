import type { StudentCertificate } from '@/utils/studentJourney';
import { brand } from './brand';

export async function localCertificatePdf(certificate:StudentCertificate):Promise<Blob> {
  await document.fonts.ready;
  const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1000;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('تعذر تجهيز ملف الشهادة');
  ctx.fillStyle='#fffdf7';ctx.fillRect(0,0,1600,1000);
  ctx.fillStyle='#49385f';ctx.fillRect(0,0,65,1000);
  ctx.strokeStyle='#aa7451';ctx.lineWidth=3;ctx.strokeRect(100,45,1445,910);
  const logo=new Image();await new Promise<void>((resolve,reject)=>{logo.onload=()=>resolve();logo.onerror=()=>reject(Error('تعذر تحميل شعار الشهادة'));logo.src=brand.assets.primary;});
  ctx.drawImage(logo,1190,85,290,120);
  ctx.direction='rtl';ctx.textAlign='center';ctx.fillStyle='#49385f';
  const text=(value:string,size:number,y:number)=>{ctx.font=`500 ${size}px Alexandria, sans-serif`;ctx.fillText(value,825,y,1250);};
  text('شهادة إتمام',76,310);text(`تشهد ${brand.name} بأن`,28,405);text(certificate.user_name,60,510);
  text('قد أتم متطلبات المقرر التعليمي بنجاح',28,580);text(certificate.diploma_name??certificate.course_title,40,665);
  ctx.fillStyle='#aa7451';text('رحلة تعلم. إنجاز يستحق التقدير.',24,760);
  text(new Date(certificate.issued_at).toLocaleDateString('ar-EG'),24,845);
  ctx.direction='ltr';text(certificate.serial_number,22,900);
  const {PDFDocument}=await import('pdf-lib');const pdf=await PDFDocument.create();const image=await pdf.embedPng(canvas.toDataURL('image/png'));const page=pdf.addPage([800,500]);page.drawImage(image,{x:0,y:0,width:800,height:500});
  const bytes=await pdf.save();return new Blob([new Uint8Array(bytes)],{type:'application/pdf'});
}
