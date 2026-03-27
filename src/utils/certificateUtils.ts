import jsPDF from 'jspdf';

const WHITE: [number, number, number] = [255, 255, 255];
const LIGHT_GRAY: [number, number, number] = [200, 205, 215];

export function generateCertificateCode(): string {
  const year = new Date().getFullYear();
  const hex = crypto.randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase();
  return `GROU-${year}-${hex}`;
}

async function loadFont(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  return res.arrayBuffer();
}

function loadImageDataUrl(url: string): Promise<string> {
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
    doc.addFont('Poppins-SemiBold.ttf', 'Poppins', 'italic');
    doc.addFileToVFS('Montserrat-Regular.ttf', arrayBufferToBase64(montserrat));
    doc.addFont('Montserrat-Regular.ttf', 'Montserrat', 'normal');
  } catch (e) {
    console.warn('Font loading failed, using defaults:', e);
  }

  // ─── TEMPLATE BACKGROUND (stretch to fill A4 landscape) ───
  try {
    const templateData = await loadImageDataUrl('/certificate-template.png');
    doc.addImage(templateData, 'PNG', 0, 0, W, H);
  } catch (e) {
    console.error('Failed to load certificate template:', e);
    doc.setFillColor(20, 29, 47);
    doc.rect(0, 0, W, H, 'F');
  }

  // ─── PROGRAM NAME ───
  // Below the WORKSHOP badge, in the large blank area
  doc.setFont('Poppins', 'bold');
  doc.setFontSize(34);
  doc.setTextColor(...WHITE);
  const maxTitleW = W * 0.65;
  const titleLines: string[] = doc.splitTextToSize(data.programName, maxTitleW);
  let titleY = 75;
  titleLines.forEach((line: string) => {
    doc.text(line, 22, titleY);
    titleY += 14;
  });

  // ─── DESCRIPTION ───
  const descY = titleY + 8;
  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...LIGHT_GRAY);
  const descText = `Certificamos a conclusão com êxito no workshop "${data.programName}", com carga horária de ${data.courseHours}h, adquirindo conhecimentos práticos sobre a identificação, gestão e prevenção de riscos psicossociais, bem como o desenvolvimento de uma liderança mais consciente, estratégica e alinhada às exigências da NR-1.`;
  const descLines: string[] = doc.splitTextToSize(descText, maxTitleW);
  descLines.forEach((line: string, i: number) => {
    doc.text(line, 22, descY + i * 5);
  });

  // ─── STUDENT NAME (above "ALUNO" signature line) ───
  // The template has signature line + "ALUNO" label at ~x:50, y:170
  const alunoLineX = 50;
  doc.setFont('Poppins', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(...WHITE);
  doc.text(data.studentName, alunoLineX, 155, { align: 'center' });

  // ─── SPECIALIST NAME (above "ESPECIALISTA" signature line) ───
  // The template has signature line + "ESPECIALISTA" label at ~x:130, y:170
  const espLineX = 130;
  doc.setFont('Poppins', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(...WHITE);
  doc.text(data.directorName, espLineX, 155, { align: 'center' });

  // ─── SPECIALIST SIGNATURE IMAGE ───
  if (data.directorSignatureUrl) {
    try {
      const sigImg = await loadImageDataUrl(data.directorSignatureUrl);
      doc.addImage(sigImg, 'PNG', espLineX - 25, 138, 50, 15);
    } catch (e) {
      console.warn('Could not load signature image:', e);
    }
  }

  // ─── CERTIFICATE CODE ───
  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(120, 125, 140);
  doc.text(`Código de verificação: ${data.certificateCode}`, W / 2, H - 8, { align: 'center' });

  doc.save(`certificado-${data.studentName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}
