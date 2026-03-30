import jsPDF from 'jspdf';

export function generateCertificateCode(): string {
  const year = new Date().getFullYear();
  const hex = crypto.randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase();
  return `GROU-${year}-${hex}`;
}

async function loadFont(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  return res.arrayBuffer();
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function loadImageAsDataUrl(url: string): Promise<string> {
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
  const W = 297;
  const H = 210;

  // ── Load fonts ──
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
    doc.addFont('Poppins-SemiBold.ttf', 'Poppins', 'italic'); // semibold mapped to italic style
    doc.addFileToVFS('Montserrat-Regular.ttf', arrayBufferToBase64(montserrat));
    doc.addFont('Montserrat-Regular.ttf', 'Montserrat', 'normal');
  } catch (e) {
    console.warn('Font loading failed, using defaults:', e);
  }

  // ── Background template (stretch to fill A4 landscape) ──
  try {
    const templateDataUrl = await loadImageAsDataUrl('/certificate-template.png');
    doc.addImage(templateDataUrl, 'PNG', 0, 0, W, H);
  } catch (e) {
    console.error('Failed to load certificate template:', e);
    doc.setFillColor(28, 17, 11);
    doc.rect(0, 0, W, H, 'F');
  }

  // ── Layout constants (all in mm, based on A4 landscape 297×210) ──
  const LEFT = 22;
  const TEXT_MAX_W = 185;

  // ── Program name (large title) ──
  doc.setFont('Poppins', 'bold');
  doc.setFontSize(38);
  doc.setTextColor(255, 255, 255);
  const titleLines: string[] = doc.splitTextToSize(data.programName, TEXT_MAX_W);
  let y = 80;
  titleLines.forEach((line: string) => {
    doc.text(line, LEFT, y);
    y += 16;
  });

  // ── Description paragraph ──
  const descY = y + 8;
  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(220, 225, 230);

  const descText = `Certificamos a conclusão com êxito no workshop "${data.programName}", com carga horária de ${data.courseHours}h, adquirindo conhecimentos práticos sobre a identificação, gestão e prevenção de riscos psicossociais, bem como o desenvolvimento de uma liderança mais consciente, estratégica e alinhada às exigências da NR-1.`;
  const descLines: string[] = doc.splitTextToSize(descText, TEXT_MAX_W);
  descLines.forEach((line: string, i: number) => {
    doc.text(line, LEFT, descY + i * 5.5);
  });

  // ── Signature section ──
  const sigY = 175;
  const lineLen = 65;

  // Student signature (left)
  const studentCenterX = 75;
  doc.setFont('Poppins', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(data.studentName, studentCenterX, sigY - 3, { align: 'center' });

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(studentCenterX - lineLen / 2, sigY, studentCenterX + lineLen / 2, sigY);

  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 185, 195);
  doc.text('ALUNO', studentCenterX, sigY + 6, { align: 'center' });

  // Specialist signature (right)
  const specialistCenterX = 185;

  // Signature image above line
  if (data.directorSignatureUrl) {
    try {
      const sigImg = await loadImageAsDataUrl(data.directorSignatureUrl);
      doc.addImage(sigImg, 'PNG', specialistCenterX - 25, sigY - 22, 50, 16);
    } catch (e) {
      console.warn('Could not load signature image:', e);
    }
  }

  doc.setFont('Poppins', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(data.directorName, specialistCenterX, sigY - 3, { align: 'center' });

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(specialistCenterX - lineLen / 2, sigY, specialistCenterX + lineLen / 2, sigY);

  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 185, 195);
  doc.text('ESPECIALISTA', specialistCenterX, sigY + 6, { align: 'center' });

  // ── Certificate code (bottom center) ──
  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(120, 125, 140);
  doc.text(`Código de verificação: ${data.certificateCode}`, W / 2, H - 8, { align: 'center' });

  doc.save(`certificado-${data.studentName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}
