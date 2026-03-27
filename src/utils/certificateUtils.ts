import jsPDF from 'jspdf';

const WHITE: [number, number, number] = [255, 255, 255];
const LIGHT_GRAY: [number, number, number] = [180, 185, 195];

export function generateCertificateCode(): string {
  const year = new Date().getFullYear();
  const hex = crypto.randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase();
  return `GROU-${year}-${hex}`;
}

async function loadFont(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  return res.arrayBuffer();
}

function loadImage(url: string): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No canvas context');
      ctx.drawImage(img, 0, 0);
      resolve({
        dataUrl: canvas.toDataURL('image/png'),
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = reject;
    img.src = url;
  });
}

function loadImageSimple(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No canvas context');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Calculates cover-fit dimensions (like CSS object-fit: cover)
 * to fill the target area without distortion.
 */
function coverFit(
  imgW: number, imgH: number,
  targetW: number, targetH: number
): { x: number; y: number; w: number; h: number } {
  const imgRatio = imgW / imgH;
  const targetRatio = targetW / targetH;

  let w: number, h: number, x: number, y: number;

  if (imgRatio > targetRatio) {
    // Image is wider than target — fit height, crop sides
    h = targetH;
    w = targetH * imgRatio;
    x = (targetW - w) / 2;
    y = 0;
  } else {
    // Image is taller than target — fit width, crop top/bottom
    w = targetW;
    h = targetW / imgRatio;
    x = 0;
    y = (targetH - h) / 2;
  }

  return { x, y, w, h };
}

export async function generateCertificatePdf(data: {
  studentName: string;
  programName: string;
  courseHours: number;
  courseDates: string;
  certificateCode: string;
  directorName: string;
  directorSignatureUrl?: string | null;
}) {
  const doc = new jsPDF('l', 'mm', 'a4');
  const W = doc.internal.pageSize.getWidth();   // 297
  const H = doc.internal.pageSize.getHeight();  // 210

  // Load and register fonts
  try {
    const [poppinsBold, poppinsRegular, poppinsSemiBold, montserrat] = await Promise.all([
      loadFont('/fonts/Poppins-Bold.ttf'),
      loadFont('/fonts/Poppins-Regular.ttf'),
      loadFont('/fonts/Poppins-SemiBold.ttf'),
      loadFont('/fonts/Montserrat-Regular.ttf'),
    ]);
    doc.addFileToVFS('Poppins-Bold.ttf', arrayBufferToBase64(poppinsBold));
    doc.addFont('Poppins-Bold.ttf', 'Poppins', 'bold');
    doc.addFileToVFS('Poppins-Regular.ttf', arrayBufferToBase64(poppinsRegular));
    doc.addFont('Poppins-Regular.ttf', 'Poppins', 'normal');
    doc.addFileToVFS('Poppins-SemiBold.ttf', arrayBufferToBase64(poppinsSemiBold));
    doc.addFont('Poppins-SemiBold.ttf', 'Poppins', 'italic'); // semibold slot
    doc.addFileToVFS('Montserrat-Regular.ttf', arrayBufferToBase64(montserrat));
    doc.addFont('Montserrat-Regular.ttf', 'Montserrat', 'normal');
  } catch (e) {
    console.warn('Font loading failed, using defaults:', e);
  }

  // ─── TEMPLATE BACKGROUND (cover-fit, no distortion) ───
  try {
    const template = await loadImage('/certificate-template.png');
    const fit = coverFit(template.width, template.height, W, H);
    doc.addImage(template.dataUrl, 'PNG', fit.x, fit.y, fit.w, fit.h);
  } catch (e) {
    console.error('Failed to load certificate template:', e);
    doc.setFillColor(20, 29, 47);
    doc.rect(0, 0, W, H, 'F');
  }

  // ─── DYNAMIC TEXT OVERLAYS ───
  // The template already contains: background, "CERTIFICADO DE CONCLUSÃO",
  // badge "WORKSHOP", arcs, logo, signature lines, "ALUNO"/"ESPECIALISTA" labels.
  //
  // Dynamic fields placed over the blank areas of the template:

  // ─── PROGRAM NAME ───
  doc.setFont('Poppins', 'bold');
  doc.setFontSize(32);
  doc.setTextColor(...WHITE);
  const maxTitleW = W - 60;
  const titleLines: string[] = doc.splitTextToSize(data.programName, maxTitleW);
  let titleY = 88;
  titleLines.forEach((line: string) => {
    doc.text(line, 20, titleY);
    titleY += 13;
  });

  // ─── DESCRIPTION ───
  const descY = titleY + 8;
  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...LIGHT_GRAY);
  const descText = `Certificamos a conclusão com êxito no workshop "${data.programName}", com carga horária de ${data.courseHours}h, adquirindo conhecimentos práticos sobre a identificação, gestão e prevenção de riscos psicossociais, bem como o desenvolvimento de uma liderança mais consciente, estratégica e alinhada às exigências da NR-1.`;
  const descLines: string[] = doc.splitTextToSize(descText, maxTitleW);
  descLines.forEach((line: string, i: number) => {
    doc.text(line, 20, descY + i * 5);
  });

  // ─── STUDENT NAME ───
  doc.setFont('Poppins', 'italic'); // semibold
  doc.setFontSize(10);
  doc.setTextColor(...WHITE);
  doc.text(data.studentName, 65, 175, { align: 'center' });

  // ─── SPECIALIST SIGNATURE IMAGE ───
  if (data.directorSignatureUrl) {
    try {
      const sigImg = await loadImageSimple(data.directorSignatureUrl);
      doc.addImage(sigImg, 'PNG', 130, 158, 45, 14);
    } catch (e) {
      console.warn('Could not load signature image:', e);
    }
  }

  // ─── SPECIALIST NAME ───
  doc.setFont('Poppins', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(...WHITE);
  doc.text(data.directorName, 197, 175, { align: 'center' });

  // ─── CERTIFICATE CODE ───
  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 110, 130);
  doc.text(`Código de verificação: ${data.certificateCode}`, W / 2, H - 6, { align: 'center' });

  doc.save(`certificado-${data.studentName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}
