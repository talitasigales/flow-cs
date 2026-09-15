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

// Near-black background of the certificate template, used to decide whether a
// signature's ink is light enough to be readable once it is drawn on top of it.
const CERTIFICATE_BACKGROUND = { r: 38, g: 21, b: 32 };
// Below this contrast ratio against the background the stroke gets lightened.
const SIGNATURE_MIN_CONTRAST = 4.5;
// Anything lighter than this counts as paper, not ink, on opaque scans.
const SIGNATURE_PAPER_LUMINANCE = 0.88;
// A pixel belongs to the stroke from this coverage upwards.
const SIGNATURE_INK_COVERAGE = 0.1;
// Only fully inked pixels are sampled when measuring the stroke colour.
const SIGNATURE_SOLID_COVERAGE = 0.6;
const SIGNATURE_RENDER_DPI = 400;

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(lumA: number, lumB: number): number {
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Uploaded signatures are a stroke sitting on a large, mostly empty canvas (the
 * two we ship are 2000x2000 PNGs whose ink covers only 27% and 60% of the
 * height), and the ink is often too dark to read against the near-black
 * template. Drawing such a file as-is wastes most of the box on empty margin
 * and leaves a stroke a few millimetres tall.
 *
 * This crops the image down to the ink, knocks out a white paper background when
 * the scan has no alpha channel, and blends the stroke towards white until it
 * clears SIGNATURE_MIN_CONTRAST, so the caller can scale the real signature to
 * fill its box at its true aspect ratio.
 */
async function prepareSignature(
  url: string,
): Promise<{ canvas: HTMLCanvasElement; width: number; height: number }> {
  const img = await loadImageElement(url);
  const source = document.createElement('canvas');
  source.width = img.naturalWidth;
  source.height = img.naturalHeight;
  const sourceCtx = source.getContext('2d');
  if (!sourceCtx) throw new Error('No canvas context');
  sourceCtx.drawImage(img, 0, 0);

  const { data } = sourceCtx.getImageData(0, 0, source.width, source.height);
  const pixelCount = source.width * source.height;

  let hasAlpha = false;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 250) {
      hasAlpha = true;
      break;
    }
  }

  const coverageOf = (index: number): number => {
    if (hasAlpha) return data[index + 3] / 255;
    const lum = relativeLuminance(data[index], data[index + 1], data[index + 2]);
    return Math.min(1, Math.max(0, (SIGNATURE_PAPER_LUMINANCE - lum) / SIGNATURE_PAPER_LUMINANCE));
  };

  let minX = source.width;
  let minY = source.height;
  let maxX = -1;
  let maxY = -1;
  let solidPixels = 0;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;

  for (let pixel = 0; pixel < pixelCount; pixel++) {
    const index = pixel * 4;
    const coverage = coverageOf(index);
    if (coverage <= SIGNATURE_INK_COVERAGE) continue;
    const x = pixel % source.width;
    const y = (pixel - x) / source.width;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (coverage >= SIGNATURE_SOLID_COVERAGE) {
      solidPixels++;
      sumR += data[index];
      sumG += data[index + 1];
      sumB += data[index + 2];
    }
  }

  if (maxX < 0 || maxY < 0) throw new Error('Signature image has no visible ink');

  // Keep a hair of margin so antialiased edges are not clipped.
  minX = Math.max(0, minX - 2);
  minY = Math.max(0, minY - 2);
  maxX = Math.min(source.width - 1, maxX + 2);
  maxY = Math.min(source.height - 1, maxY + 2);

  const backgroundLuminance = relativeLuminance(
    CERTIFICATE_BACKGROUND.r,
    CERTIFICATE_BACKGROUND.g,
    CERTIFICATE_BACKGROUND.b,
  );

  // How far the stroke has to be blended towards white to become readable.
  let lighten = 0;
  if (solidPixels > 0) {
    const inkR = sumR / solidPixels;
    const inkG = sumG / solidPixels;
    const inkB = sumB / solidPixels;
    while (lighten < 1) {
      const mixed = relativeLuminance(
        inkR + (255 - inkR) * lighten,
        inkG + (255 - inkG) * lighten,
        inkB + (255 - inkB) * lighten,
      );
      if (contrastRatio(mixed, backgroundLuminance) >= SIGNATURE_MIN_CONTRAST) break;
      lighten = Math.min(1, lighten + 0.02);
    }
  }

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const output = document.createElement('canvas');
  output.width = width;
  output.height = height;
  const outputCtx = output.getContext('2d');
  if (!outputCtx) throw new Error('No canvas context');
  const cropped = outputCtx.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sourceIndex = ((y + minY) * source.width + (x + minX)) * 4;
      const targetIndex = (y * width + x) * 4;
      const coverage = coverageOf(sourceIndex);
      const r = data[sourceIndex];
      const g = data[sourceIndex + 1];
      const b = data[sourceIndex + 2];
      cropped.data[targetIndex] = r + (255 - r) * lighten;
      cropped.data[targetIndex + 1] = g + (255 - g) * lighten;
      cropped.data[targetIndex + 2] = b + (255 - b) * lighten;
      cropped.data[targetIndex + 3] = Math.round(coverage * 255);
    }
  }

  outputCtx.putImageData(cropped, 0, 0);
  return { canvas: output, width, height };
}

/**
 * Downsamples the prepared signature to the resolution it is actually printed
 * at, so a 2000px source does not bloat the PDF.
 */
function signatureDataUrl(canvas: HTMLCanvasElement, widthMm: number): string {
  const targetWidth = Math.max(1, Math.round((widthMm / 25.4) * SIGNATURE_RENDER_DPI));
  if (canvas.width <= targetWidth) return canvas.toDataURL('image/png');

  const scaled = document.createElement('canvas');
  scaled.width = targetWidth;
  scaled.height = Math.max(1, Math.round((canvas.height / canvas.width) * targetWidth));
  const ctx = scaled.getContext('2d');
  if (!ctx) return canvas.toDataURL('image/png');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(canvas, 0, 0, scaled.width, scaled.height);
  return scaled.toDataURL('image/png');
}

function getCertificateDescription(programName: string, courseHours: number): string {
  const nameLower = programName.toLowerCase();
  if (nameLower.includes('nr-1') || nameLower.includes('nr1') || nameLower.includes('riscos psicossociais')) {
    return `Certificamos a conclusão com êxito no workshop "${programName}", com carga horária de ${courseHours}h, adquirindo conhecimentos práticos sobre a identificação, gestão e prevenção de riscos psicossociais, bem como o desenvolvimento de uma liderança mais consciente, estratégica e alinhada às exigências da NR-1.`;
  }
  if (nameLower.includes('líder 360') || nameLower.includes('lider 360')) {
    return `Certificamos a conclusão com êxito no workshop "${programName}", com carga horária de ${courseHours}h, adquirindo conhecimentos práticos sobre a autogestão, liderança e ciência comportamental.`;
  }
  return `Certificamos a conclusão com êxito no programa "${programName}", com carga horária de ${courseHours}h.`;
}

async function buildCertificateDoc(data: {
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
  doc.setFontSize(42);
  doc.setTextColor(255, 255, 255);
  // Force title to break into 2 lines by using a narrow max width
  const titleLines = doc.splitTextToSize(data.programName, rw(0.45));
  let currentY = ry(0.42);
  titleLines.forEach((line: string) => {
    doc.text(line, rx(0.07), currentY);
    currentY += rh(0.09);
  });

  doc.setFont('Montserrat', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(236, 236, 236);
  const description = getCertificateDescription(data.programName, data.courseHours);
  const paragraphLines = doc.splitTextToSize(description, rw(0.63));
  let paragraphY = currentY + rh(0.01);
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
      const signature = await prepareSignature(data.directorSignatureUrl);
      // Fit the cropped stroke inside the box at its own aspect ratio, so wide
      // signatures stay wide and tall ones stay tall instead of being squashed.
      const maxWidth = rw(0.19);
      const maxHeight = rh(0.095);
      let sigW = maxWidth;
      let sigH = (signature.height / signature.width) * sigW;
      if (sigH > maxHeight) {
        sigH = maxHeight;
        sigW = (signature.width / signature.height) * sigH;
      }
      doc.addImage(
        signatureDataUrl(signature.canvas, sigW),
        'PNG',
        specialistCenterX - sigW / 2,
        signatureLineY - sigH - 0.5,
        sigW,
        sigH,
      );
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

  return doc;
}

export async function generateCertificatePdf(data: Parameters<typeof buildCertificateDoc>[0]) {
  const doc = await buildCertificateDoc(data);
  doc.save(`certificado-${data.studentName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}

export async function generateCertificatePdfBlob(data: Parameters<typeof buildCertificateDoc>[0]): Promise<Blob> {
  const doc = await buildCertificateDoc(data);
  return doc.output('blob');
}
