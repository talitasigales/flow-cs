import jsPDF from 'jspdf';

const PRIMARY_COLOR: [number, number, number] = [230, 100, 40];
const HEADER_BG: [number, number, number] = [30, 40, 55];

export function generateCertificateCode(): string {
  const year = new Date().getFullYear();
  const hex = crypto.randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase();
  return `GROU-${year}-${hex}`;
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
  const doc = new jsPDF('l', 'mm', 'a4'); // landscape
  const pageW = doc.internal.pageSize.getWidth(); // 297
  const pageH = doc.internal.pageSize.getHeight(); // 210

  // Border
  doc.setDrawColor(...HEADER_BG);
  doc.setLineWidth(2);
  doc.rect(8, 8, pageW - 16, pageH - 16);

  // Inner accent border
  doc.setDrawColor(...PRIMARY_COLOR);
  doc.setLineWidth(0.5);
  doc.rect(12, 12, pageW - 24, pageH - 24);

  // Top accent line
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(12, 12, pageW - 24, 3, 'F');

  // "CS da Grou" branding
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('CS da Grou', pageW / 2, 28, { align: 'center' });

  // Title
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...HEADER_BG);
  doc.text('CERTIFICADO DE CONCLUSÃO', pageW / 2, 45, { align: 'center' });

  // Decorative line
  doc.setDrawColor(...PRIMARY_COLOR);
  doc.setLineWidth(1);
  doc.line(pageW / 2 - 60, 50, pageW / 2 + 60, 50);

  // Body text
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Certificamos que', pageW / 2, 68, { align: 'center' });

  // Student name
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...HEADER_BG);
  doc.text(data.studentName, pageW / 2, 82, { align: 'center' });

  // Line under name
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  const nameWidth = doc.getTextWidth(data.studentName);
  doc.line(pageW / 2 - nameWidth / 2 - 10, 85, pageW / 2 + nameWidth / 2 + 10, 85);

  // Description
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('concluiu com êxito o programa', pageW / 2, 96, { align: 'center' });

  // Program name
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text(data.programName, pageW / 2, 108, { align: 'center' });

  // Course details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Carga horária: ${data.courseHours}h  |  Período: ${data.courseDates}`, pageW / 2, 120, { align: 'center' });

  // Signature area
  const sigY = 155;

  // Try to load signature image
  if (data.directorSignatureUrl) {
    try {
      const img = await loadImage(data.directorSignatureUrl);
      const sigW = 50;
      const sigH = 20;
      doc.addImage(img, 'PNG', pageW / 2 - sigW / 2, sigY - sigH - 2, sigW, sigH);
    } catch (e) {
      console.warn('Could not load signature image:', e);
    }
  }

  // Signature line
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  doc.line(pageW / 2 - 40, sigY, pageW / 2 + 40, sigY);

  // Director name
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text(data.directorName, pageW / 2, sigY + 6, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Diretora', pageW / 2, sigY + 11, { align: 'center' });

  // Certificate code at bottom
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Código de verificação: ${data.certificateCode}`, pageW / 2, pageH - 18, { align: 'center' });

  // Footer
  doc.setFontSize(7);
  doc.text('© Grou – Plataforma de Sucesso do Cliente', pageW / 2, pageH - 13, { align: 'center' });

  doc.save(`certificado-${data.studentName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
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
