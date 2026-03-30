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
    doc.addImage(template.dataUrl, 'PNG', drawX, drawY, drawW, drawH);
  } catch (e) {
    console.error('Failed to load certificate template:', e);
    doc.setFillColor(20, 29, 47);
    doc.rect(0, 0, W, H, 'F');
  }

  // All positions are relative to the image area
  const oY = drawY;
  const oX = drawX;

  // Margin from the left edge of the image
  const marginLeft = oX + 22;
  const maxTitleW = sW * 0.62;

  // ─── PROGRAM NAME ───
  doc.setFont('Poppins', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(...WHITE);
  const titleLines: string[] = doc.splitTextToSize(data.programName, maxTitleW);
  let titleY = oY + drawH * 0.36;
  titleLines.forEach((line: string) => {
    doc.text(line, marginLeft, titleY);
    titleY += 12;
  });

  // ─── DESCRIPTION ───
  const descYPos = titleY + 10;
  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...LIGHT_GRAY);
  const descText = `Certificamos a conclusão com êxito no workshop "${data.programName}", com carga horária de ${data.courseHours}h, adquirindo conhecimentos práticos sobre a identificação, gestão e prevenção de riscos psicossociais, bem como o desenvolvimento de uma liderança mais consciente, estratégica e alinhada às exigências da NR-1.`;
  const descLines: string[] = doc.splitTextToSize(descText, maxTitleW);
  descLines.forEach((line: string, i: number) => {
    doc.text(line, marginLeft, descYPos + i * 5.5);
  });

  // ─── SIGNATURE SECTION ───
  const sigSectionY = oY + drawH * 0.78; // vertical position for signature lines
  const lineWidth = 60;
  const alunoLineX = marginLeft + 35; // center of student signature
  const espLineX = marginLeft + 130; // center of specialist signature

  // Student name
  doc.setFont('Poppins', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(...WHITE);
  doc.text(data.studentName, alunoLineX, sigSectionY - 4, { align: 'center' });

  // Student line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(alunoLineX - lineWidth / 2, sigSectionY, alunoLineX + lineWidth / 2, sigSectionY);

  // "ALUNO" label
  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...LIGHT_GRAY);
  doc.text('ALUNO', alunoLineX, sigSectionY + 5, { align: 'center' });

  // Specialist name
  doc.setFont('Poppins', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(...WHITE);
  doc.text(data.directorName, espLineX, sigSectionY - 4, { align: 'center' });

  // Specialist signature image
  if (data.directorSignatureUrl) {
    try {
      const sigImg = await loadImageDataUrl(data.directorSignatureUrl);
      doc.addImage(sigImg, 'PNG', espLineX - 25, sigSectionY - 22, 50, 16);
    } catch (e) {
      console.warn('Could not load signature image:', e);
    }
  }

  // Specialist line
  doc.line(espLineX - lineWidth / 2, sigSectionY, espLineX + lineWidth / 2, sigSectionY);

  // "ESPECIALISTA" label
  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...LIGHT_GRAY);
  doc.text('ESPECIALISTA', espLineX, sigSectionY + 5, { align: 'center' });

  // ─── CERTIFICATE CODE ───
  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(120, 125, 140);
  doc.text(`Código de verificação: ${data.certificateCode}`, W / 2, oY + drawH - 6, { align: 'center' });

  doc.save(`certificado-${data.studentName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}
