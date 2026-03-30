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

function loadImageWithDimensions(url: string): Promise<{ dataUrl: string; width: number; height: number }> {
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

function loadImageDataUrl(url: string): Promise<string> {
  return loadImageWithDimensions(url).then(r => r.dataUrl);
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

  // ─── TEMPLATE BACKGROUND (contain-fit to show full image without cropping) ───
  let scale = 1;
  let drawX = 0, drawY = 0, drawW = W, drawH = H;
  try {
    const template = await loadImageWithDimensions('/certificate-template.png');
    const imgRatio = template.width / template.height;
    const pageRatio = W / H;

    // Fill page with dark background matching template edges
    doc.setFillColor(28, 17, 11);
    doc.rect(0, 0, W, H, 'F');

    if (imgRatio > pageRatio) {
      // Image is wider than page → fit width, center vertically
      drawW = W;
      drawH = W / imgRatio;
      drawX = 0;
      drawY = (H - drawH) / 2;
    } else {
      // Image is taller → fit height, center horizontally
      drawH = H;
      drawW = H * imgRatio;
      drawX = (W - drawW) / 2;
      drawY = 0;
    }
    scale = drawH / H;
    doc.addImage(template.dataUrl, 'PNG', drawX, drawY, drawW, drawH);
  } catch (e) {
    console.error('Failed to load certificate template:', e);
    doc.setFillColor(20, 29, 47);
    doc.rect(0, 0, W, H, 'F');
  }

  // All Y positions are relative to the image area, offset by drawY
  const oY = drawY;
  const oX = drawX;
  const sW = drawW; // scaled image width for text wrapping

  // ─── PROGRAM NAME ───
  doc.setFont('Poppins', 'bold');
  doc.setFontSize(34 * scale);
  doc.setTextColor(...WHITE);
  const maxTitleW = sW * 0.65;
  const titleLines: string[] = doc.splitTextToSize(data.programName, maxTitleW);
  let titleY = oY + 75 * scale;
  titleLines.forEach((line: string) => {
    doc.text(line, oX + 22 * scale, titleY);
    titleY += 14 * scale;
  });

  // ─── DESCRIPTION ───
  const descYPos = titleY + 8 * scale;
  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(9 * scale);
  doc.setTextColor(...LIGHT_GRAY);
  const descText = `Certificamos a conclusão com êxito no workshop "${data.programName}", com carga horária de ${data.courseHours}h, adquirindo conhecimentos práticos sobre a identificação, gestão e prevenção de riscos psicossociais, bem como o desenvolvimento de uma liderança mais consciente, estratégica e alinhada às exigências da NR-1.`;
  const descLines: string[] = doc.splitTextToSize(descText, maxTitleW);
  descLines.forEach((line: string, i: number) => {
    doc.text(line, oX + 22 * scale, descYPos + i * 5 * scale);
  });

  // ─── STUDENT NAME (above "ALUNO" signature line) ───
  const alunoLineX = oX + 50 * scale;
  doc.setFont('Poppins', 'italic');
  doc.setFontSize(11 * scale);
  doc.setTextColor(...WHITE);
  doc.text(data.studentName, alunoLineX, oY + 155 * scale, { align: 'center' });

  // ─── SPECIALIST NAME (above "ESPECIALISTA" signature line) ───
  const espLineX = oX + 130 * scale;
  doc.setFont('Poppins', 'italic');
  doc.setFontSize(11 * scale);
  doc.setTextColor(...WHITE);
  doc.text(data.directorName, espLineX, oY + 155 * scale, { align: 'center' });

  // ─── SPECIALIST SIGNATURE IMAGE ───
  if (data.directorSignatureUrl) {
    try {
      const sigImg = await loadImageDataUrl(data.directorSignatureUrl);
      doc.addImage(sigImg, 'PNG', espLineX - 25 * scale, oY + 138 * scale, 50 * scale, 15 * scale);
    } catch (e) {
      console.warn('Could not load signature image:', e);
    }
  }

  // ─── CERTIFICATE CODE ───
  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(6 * scale);
  doc.setTextColor(120, 125, 140);
  doc.text(`Código de verificação: ${data.certificateCode}`, W / 2, oY + drawH - 8 * scale, { align: 'center' });

  doc.save(`certificado-${data.studentName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}
