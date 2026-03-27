import jsPDF from 'jspdf';

export function generateCertificateCode(): string {
  const year = new Date().getFullYear();
  const hex = crypto.randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase();
  return `GROU-${year}-${hex}`;
}

async function loadImageAsDataUrl(url: string): Promise<string> {
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
  const doc = new jsPDF('l', 'mm', 'a4'); // landscape
  const pageW = doc.internal.pageSize.getWidth();  // 297
  const pageH = doc.internal.pageSize.getHeight(); // 210

  // --- Background gradient image ---
  try {
    const bgData = await loadImageAsDataUrl('/certificate-bg.png');
    doc.addImage(bgData, 'PNG', 0, 0, pageW, pageH);
  } catch {
    // Fallback: solid dark background
    doc.setFillColor(40, 30, 50);
    doc.rect(0, 0, pageW, pageH, 'F');
  }

  // --- Decorative concentric arcs on the right side (orange) ---
  doc.setDrawColor(230, 100, 40);
  doc.setLineWidth(0.8);
  const arcCenterX = pageW + 20;
  const arcCenterY = pageH / 2;
  for (let r = 40; r <= 120; r += 12) {
    // Draw quarter-circle arcs using lines
    const steps = 40;
    for (let i = 0; i < steps; i++) {
      const a1 = Math.PI * 0.5 + (Math.PI * i) / steps;
      const a2 = Math.PI * 0.5 + (Math.PI * (i + 1)) / steps;
      const x1 = arcCenterX + r * Math.cos(a1);
      const y1 = arcCenterY + r * Math.sin(a1);
      const x2 = arcCenterX + r * Math.cos(a2);
      const y2 = arcCenterY + r * Math.sin(a2);
      if (x1 < pageW + 5 || x2 < pageW + 5) {
        doc.line(x1, y1, x2, y2);
      }
    }
  }

  const marginL = 25;

  // --- "CERTIFICADO DE CONCLUSÃO" subtitle ---
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text('CERTIFICADO DE CONCLUSÃO', marginL, 30);

  // --- Category badge (optional - uses program type) ---
  // Orange rounded rect with text
  const badgeY = 38;
  const badgeText = 'PROGRAMA';
  doc.setFillColor(230, 100, 40);
  const badgeW = 42;
  const badgeH = 10;
  doc.roundedRect(marginL, badgeY - 7, badgeW, badgeH, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(badgeText, marginL + badgeW / 2, badgeY, { align: 'center' });

  // --- Large program name ---
  doc.setFontSize(42);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  const maxNameWidth = pageW - marginL - 80;
  const nameLines = doc.splitTextToSize(data.programName, maxNameWidth);
  let nameY = 65;
  nameLines.forEach((line: string) => {
    doc.text(line, marginL, nameY);
    nameY += 18;
  });

  // --- Description paragraph ---
  const descY = Math.max(nameY + 10, 115);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 220, 220);

  const descText = `Certificamos a conclusão com êxito no programa "${data.programName}", com carga horária de ${data.courseHours}h, no período de ${data.courseDates}.`;
  const descLines = doc.splitTextToSize(descText, maxNameWidth);
  descLines.forEach((line: string, i: number) => {
    doc.text(line, marginL, descY + i * 5);
  });

  // --- Signature area ---
  const sigY = pageH - 35;
  const sigLineW = 70;

  // Student signature line (left)
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(marginL, sigY, marginL + sigLineW, sigY);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 180);
  doc.text('ALUNO', marginL + sigLineW / 2, sigY + 5, { align: 'center' });

  // Student name below line
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(data.studentName, marginL + sigLineW / 2, sigY - 4, { align: 'center' });

  // Director signature line (center-right)
  const sigRightX = marginL + sigLineW + 40;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(sigRightX, sigY, sigRightX + sigLineW, sigY);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 180);
  doc.text('ESPECIALISTA', sigRightX + sigLineW / 2, sigY + 5, { align: 'center' });

  // Director signature image
  if (data.directorSignatureUrl) {
    try {
      const sigImg = await loadImageAsDataUrl(data.directorSignatureUrl);
      const sigImgW = 50;
      const sigImgH = 15;
      doc.addImage(sigImg, 'PNG', sigRightX + (sigLineW - sigImgW) / 2, sigY - sigImgH - 3, sigImgW, sigImgH);
    } catch (e) {
      console.warn('Could not load signature image:', e);
    }
  }

  // Director name
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(data.directorName, sigRightX + sigLineW / 2, sigY - 4, { align: 'center' });

  // --- Grou logo bottom right ---
  try {
    const logoData = await loadImageAsDataUrl('/grou-logo.png');
    doc.addImage(logoData, 'PNG', pageW - 45, pageH - 28, 30, 12);
  } catch {
    // Fallback text
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(230, 100, 40);
    doc.text('grou', pageW - 35, pageH - 18);
  }

  // --- Certificate code (small, bottom left) ---
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(`Código: ${data.certificateCode}`, marginL, pageH - 10);

  doc.save(`certificado-${data.studentName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}
