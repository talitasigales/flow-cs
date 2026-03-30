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

function loadImageAsDataUrl(url: string): Promise<string> {
  return loadImageWithDimensions(url).then((image) => image.dataUrl);
}

export async function generateCertificatePdf(data: {
  studentName: string;
  programName: string;
  courseHours: number;
  courseDates: string;
  certificateCode: string;
  directorName: string;
  directorSignatureUrl?: string | null;
  emissionDate?: string;
  classDates?: string;
}) {
  const doc = new jsPDF('l', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

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

  let drawX = 0;
  let drawY = 0;
  let drawW = pageWidth;
  let drawH = pageHeight;

  try {
    const template = await loadImageWithDimensions('/certificate-template.png');
    const imageRatio = template.width / template.height;
    const pageRatio = pageWidth / pageHeight;

    doc.setFillColor(28, 17, 11);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    if (imageRatio > pageRatio) {
      drawW = pageWidth;
      drawH = pageWidth / imageRatio;
      drawX = 0;
      drawY = (pageHeight - drawH) / 2;
    } else {
      drawH = pageHeight;
      drawW = pageHeight * imageRatio;
      drawX = (pageWidth - drawW) / 2;
      drawY = 0;
    }

    doc.addImage(template.dataUrl, 'PNG', drawX, drawY, drawW, drawH);
  } catch (e) {
    console.error('Failed to load certificate template:', e);
    doc.setFillColor(28, 17, 11);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
  }

  const rx = (value: number) => drawX + drawW * value;
  const ry = (value: number) => drawY + drawH * value;
  const rw = (value: number) => drawW * value;
  const rh = (value: number) => drawH * value;

  doc.setFont('Poppins', 'bold');
  doc.setFontSize(31);
  doc.setTextColor(255, 255, 255);
  const titleLines = doc.splitTextToSize(data.programName, rw(0.6));
  let currentY = ry(0.47);
  titleLines.forEach((line: string) => {
    doc.text(line, rx(0.07), currentY);
    currentY += rh(0.072);
  });

  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(236, 236, 236);
  const description = `Certificamos a conclusão com êxito no workshop “${data.programName}”, com carga horária de ${data.courseHours}h, adquirindo conhecimentos práticos sobre a identificação, gestão e prevenção de riscos psicossociais, bem como o desenvolvimento de uma liderança mais consciente, estratégica e alinhada às exigências da NR-1.`;
  const paragraphLines = doc.splitTextToSize(description, rw(0.63));
  let paragraphY = currentY + rh(0.03);
  paragraphLines.forEach((line: string) => {
    doc.text(line, rx(0.07), paragraphY);
    paragraphY += rh(0.047);
  });

  const studentCenterX = rx(0.22);
  const specialistCenterX = rx(0.58);
  const signatureLineY = ry(0.83);
  const signatureLineWidth = rw(0.15);

  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.25);
  doc.line(studentCenterX - signatureLineWidth / 2, signatureLineY, studentCenterX + signatureLineWidth / 2, signatureLineY);
  doc.line(specialistCenterX - signatureLineWidth / 2, signatureLineY, specialistCenterX + signatureLineWidth / 2, signatureLineY);

  // Student name above line
  doc.setFont('Poppins', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text(data.studentName, studentCenterX, signatureLineY - 3, { align: 'center' });

  // Specialist: show signature image instead of name text
  if (data.directorSignatureUrl) {
    try {
      const signatureDataUrl = await loadImageAsDataUrl(data.directorSignatureUrl);
      const sigW = rw(0.15);
      const sigH = sigW * 0.5;
      doc.addImage(signatureDataUrl, 'PNG', specialistCenterX - sigW / 2, signatureLineY - sigH - 1, sigW, sigH);
    } catch (e) {
      console.warn('Could not load signature image:', e);
      doc.text(data.directorName, specialistCenterX, signatureLineY - 3, { align: 'center' });
    }
  } else {
    doc.text(data.directorName, specialistCenterX, signatureLineY - 3, { align: 'center' });
  }

  // Labels below lines
  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(190, 190, 195);
  doc.text('ALUNO', studentCenterX, signatureLineY + 5, { align: 'center' });
  doc.text(`ESPECIALISTA — ${data.directorName}`, specialistCenterX, signatureLineY + 5, { align: 'center' });

  // Emission date and class period
  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(190, 190, 195);
  const emissionText = data.emissionDate ? `Emitido em ${data.emissionDate}` : `Emitido em ${new Date().toLocaleDateString('pt-BR')}`;
  const classDatesText = data.classDates ? ` | Turma: ${data.classDates}` : (data.courseDates ? ` | Turma: ${data.courseDates}` : '');
  doc.text(emissionText + classDatesText, pageWidth / 2, ry(0.94), { align: 'center' });

  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(132, 135, 145);
  doc.text(`Código de verificação: ${data.certificateCode}`, pageWidth / 2, ry(0.97), { align: 'center' });

  doc.save(`certificado-${data.studentName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}
