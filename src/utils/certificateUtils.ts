import jsPDF from 'jspdf';

// Platform colors (from index.css HSL tokens converted to RGB)
const ORANGE: [number, number, number] = [242, 122, 36];   // HSL 20 90% 52%
const NAVY: [number, number, number] = [20, 29, 47];       // HSL 220 40% 13%
const NAVY_LIGHT: [number, number, number] = [30, 42, 64];
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

function loadImage(url: string): Promise<string> {
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
    doc.addFont('Poppins-SemiBold.ttf', 'Poppins', 'italic'); // use italic slot for semibold
    doc.addFileToVFS('Montserrat-Regular.ttf', arrayBufferToBase64(montserrat));
    doc.addFont('Montserrat-Regular.ttf', 'Montserrat', 'normal');
  } catch (e) {
    console.warn('Font loading failed, using defaults:', e);
  }

  // ─── BACKGROUND ───
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, H, 'F');

  // ─── LEFT ACCENT STRIP ───
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, 4, H, 'F');

  // ─── TOP HORIZONTAL ACCENT LINE ───
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(0.6);
  doc.line(20, 18, W - 20, 18);

  // ─── DECORATIVE: corner geometric dots (top-right) ───
  doc.setFillColor(ORANGE[0], ORANGE[1], ORANGE[2]);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      doc.circle(W - 30 + col * 5, 28 + row * 5, 0.6, 'F');
    }
  }

  // ─── GROU LOGO (white, top-left) ───
  try {
    const logoData = await loadImage('/grou-logo-white.png');
    doc.addImage(logoData, 'PNG', 20, 23, 35, 14);
  } catch {
    doc.setFont('Poppins', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(...WHITE);
    doc.text('grou', 20, 34);
  }

  // ─── "CERTIFICADO DE CONCLUSÃO" ───
  const labelY = 52;
  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...ORANGE);
  doc.text('CERTIFICADO DE CONCLUSÃO', 20, labelY);

  // ─── PROGRAM NAME (large, white, Poppins Bold) ───
  doc.setFont('Poppins', 'bold');
  doc.setFontSize(36);
  doc.setTextColor(...WHITE);
  const maxTitleW = W - 60;
  const titleLines: string[] = doc.splitTextToSize(data.programName, maxTitleW);
  let titleY = 68;
  titleLines.forEach((line: string) => {
    doc.text(line, 20, titleY);
    titleY += 15;
  });

  // ─── SMALL ORANGE BAR under title ───
  const barY = titleY + 2;
  doc.setFillColor(...ORANGE);
  doc.rect(20, barY, 40, 1.5, 'F');

  // ─── DESCRIPTION (Montserrat) ───
  const descY = barY + 12;
  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(...LIGHT_GRAY);

  const descText = `Certificamos a conclusão com êxito no workshop "${data.programName}", com carga horária de ${data.courseHours}h, adquirindo conhecimentos práticos sobre a identificação, gestão e prevenção de riscos psicossociais, bem como o desenvolvimento de uma liderança mais consciente, estratégica e alinhada às exigências da NR-1.`;
  const descLines: string[] = doc.splitTextToSize(descText, maxTitleW);
  descLines.forEach((line: string, i: number) => {
    doc.text(line, 20, descY + i * 5);
  });

  // ─── SIGNATURE AREA ───
  const sigY = H - 38;
  const sigLineLen = 65;

  // ── ALUNO (left) ──
  doc.setFont('Poppins', 'italic'); // semibold
  doc.setFontSize(10);
  doc.setTextColor(...WHITE);
  doc.text(data.studentName, 20 + sigLineLen / 2, sigY - 3, { align: 'center' });

  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(0.5);
  doc.line(20, sigY, 20 + sigLineLen, sigY);

  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...LIGHT_GRAY);
  doc.text('ALUNO', 20 + sigLineLen / 2, sigY + 5, { align: 'center' });

  // ── ESPECIALISTA (right) ──
  const sigRX = 120;

  // Director signature image (if available)
  if (data.directorSignatureUrl) {
    try {
      const sigImg = await loadImage(data.directorSignatureUrl);
      doc.addImage(sigImg, 'PNG', sigRX + (sigLineLen - 45) / 2, sigY - 18, 45, 14);
    } catch (e) {
      console.warn('Could not load signature image:', e);
    }
  }

  doc.setFont('Poppins', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(...WHITE);
  doc.text(data.directorName, sigRX + sigLineLen / 2, sigY - 3, { align: 'center' });

  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(0.5);
  doc.line(sigRX, sigY, sigRX + sigLineLen, sigY);

  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...LIGHT_GRAY);
  doc.text('ESPECIALISTA', sigRX + sigLineLen / 2, sigY + 5, { align: 'center' });

  // ─── GROU LOGO (orange, bottom-right) ───
  try {
    const logoOrange = await loadImage('/grou-logo.png');
    doc.addImage(logoOrange, 'PNG', W - 48, H - 25, 30, 12);
  } catch {
    doc.setFont('Poppins', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(...ORANGE);
    doc.text('grou', W - 40, H - 16);
  }

  // ─── BOTTOM ACCENT LINE ───
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(0.6);
  doc.line(20, H - 10, W - 20, H - 10);

  // ─── CERTIFICATE CODE (tiny, bottom-center) ───
  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(NAVY_LIGHT[0], NAVY_LIGHT[1], NAVY_LIGHT[2]);
  doc.text(`Código de verificação: ${data.certificateCode}`, W / 2, H - 6, { align: 'center' });

  // ─── Decorative dots bottom-left ───
  doc.setFillColor(ORANGE[0], ORANGE[1], ORANGE[2]);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      doc.circle(22 + col * 4, H - 28 + row * 4, 0.5, 'F');
    }
  }

  doc.save(`certificado-${data.studentName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}
