import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const LOGO_URL = '/grou-logo-laranja.png';
const PRIMARY_COLOR: [number, number, number] = [230, 100, 40]; // orange
const HEADER_BG: [number, number, number] = [30, 40, 55]; // dark navy

async function addHeader(doc: jsPDF, title: string, userName?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header background
  doc.setFillColor(...HEADER_BG);
  doc.rect(0, 0, pageWidth, 35, 'F');

  // Orange accent line
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 35, pageWidth, 2, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 15, 18);

  // Subtitle info
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const dateStr = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Gerado em: ${dateStr}`, 15, 28);
  if (userName) {
    doc.text(`Usuário: ${userName}`, pageWidth - 15 - doc.getTextWidth(`Usuário: ${userName}`), 28);
  }

  // Grou branding
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('CS da Grou', pageWidth - 15 - doc.getTextWidth('CS da Grou'), 18);

  return 42; // y position after header
}

function addFooter(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('© Grou – Plataforma de Sucesso do Cliente', pageWidth / 2, pageHeight - 10, { align: 'center' });
}

export async function captureChartAsImage(elementId: string): Promise<string | null> {
  const element = document.getElementById(elementId);
  if (!element) return null;
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#1e2837',
      scale: 2,
      logging: false,
    });
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Error capturing chart:', err);
    return null;
  }
}

export async function exportPDAPdf(
  profiles: Array<{
    employee_name: string;
    year: number;
    r: number;
    e: number;
    p: number;
    n: number;
    a: number;
    tomada_decisoes?: number;
    intensidade_perfil?: number;
    energia?: number;
    equilibrio_energia?: number;
  }>,
  chartImageDataUrl?: string | null,
  userName?: string
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  let y = await addHeader(doc, 'Relatório de Evolução PDA', userName);

  // Chart image
  if (chartImageDataUrl) {
    const imgWidth = 160;
    const imgHeight = 90;
    doc.addImage(chartImageDataUrl, 'PNG', 25, y, imgWidth, imgHeight);
    y += imgHeight + 10;
  }

  // Table header
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(15, y, 180, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const cols = ['Colaborador', 'Ano', 'R', 'E', 'P', 'N', 'A', 'Decisão', 'Intens.', 'Energia', 'Equil.'];
  const colWidths = [40, 15, 12, 12, 12, 12, 12, 17, 14, 17, 17];
  let xPos = 16;
  cols.forEach((col, i) => {
    doc.text(col, xPos, y + 6);
    xPos += colWidths[i];
  });
  y += 10;

  // Data rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  profiles.forEach((p, index) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    if (index % 2 === 0) {
      doc.setFillColor(240, 240, 240);
      doc.rect(15, y - 4, 180, 7, 'F');
    }
    doc.setTextColor(50, 50, 50);
    xPos = 16;
    const row = [
      p.employee_name.substring(0, 20),
      String(p.year),
      String(p.r),
      String(p.e),
      String(p.p),
      String(p.n),
      String(p.a),
      String(p.tomada_decisoes ?? '-'),
      String(p.intensidade_perfil ?? '-'),
      String(p.energia ?? '-'),
      String(p.equilibrio_energia ?? '-'),
    ];
    row.forEach((val, i) => {
      doc.text(val, xPos, y);
      xPos += colWidths[i];
    });
    y += 7;
  });

  addFooter(doc);
  doc.save(`evolucao-pda-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function exportPDIPdf(
  pdi: {
    employee_name: string;
    pda_axis: string;
    status: string;
    start_date?: string | null;
    target_date?: string | null;
  },
  actions: Array<{
    description: string;
    action_type: string;
    status: string;
    start_date?: string | null;
    end_date?: string | null;
  }>,
  checkins: Array<{
    checkin_number: number;
    checkin_date: string;
    what_worked?: string | null;
    obstacles?: string | null;
  }>,
  userName?: string
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  let y = await addHeader(doc, 'Relatório de PDI', userName);

  // PDI Info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text(`Colaborador: ${pdi.employee_name}`, 15, y);
  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Eixo PDA: ${pdi.pda_axis}  |  Status: ${pdi.status}`, 15, y);
  y += 6;
  if (pdi.start_date || pdi.target_date) {
    doc.text(
      `Início: ${pdi.start_date ? new Date(pdi.start_date).toLocaleDateString('pt-BR') : '-'}  |  Prazo: ${pdi.target_date ? new Date(pdi.target_date).toLocaleDateString('pt-BR') : '-'}`,
      15,
      y
    );
    y += 8;
  }

  // Actions
  if (actions.length > 0) {
    y += 4;
    doc.setFillColor(...PRIMARY_COLOR);
    doc.rect(15, y, 180, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Ações do PDI', 17, y + 6);
    y += 12;

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    actions.forEach((action, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      if (i % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(15, y - 4, 180, 7, 'F');
      }
      doc.text(`${i + 1}. ${action.description.substring(0, 60)}`, 17, y);
      doc.text(`Tipo: ${action.action_type}`, 130, y);
      doc.text(`Status: ${action.status}`, 160, y);
      y += 7;
    });
  }

  // Check-ins
  if (checkins.length > 0) {
    y += 6;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFillColor(...PRIMARY_COLOR);
    doc.rect(15, y, 180, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Check-ins', 17, y + 6);
    y += 12;

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    checkins.forEach((ci) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold');
      doc.text(`Check-in #${ci.checkin_number} — ${new Date(ci.checkin_date).toLocaleDateString('pt-BR')}`, 17, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      if (ci.what_worked) {
        doc.text(`O que funcionou: ${ci.what_worked.substring(0, 80)}`, 20, y);
        y += 5;
      }
      if (ci.obstacles) {
        doc.text(`Obstáculos: ${ci.obstacles.substring(0, 80)}`, 20, y);
        y += 5;
      }
      y += 3;
    });
  }

  addFooter(doc);
  doc.save(`pdi-${pdi.employee_name.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export async function export9BoxPdf(
  entries: Array<{
    employee_name: string;
    performance_score: number;
    role_fit_score: number;
    notes: string;
  }>,
  chartImageDataUrl?: string | null,
  userName?: string
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  let y = await addHeader(doc, 'Relatório Matriz 9Box', userName);

  // Chart image
  if (chartImageDataUrl) {
    const imgWidth = 170;
    const imgHeight = 120;
    doc.addImage(chartImageDataUrl, 'PNG', 20, y, imgWidth, imgHeight);
    y += imgHeight + 10;
  }

  // Summary stats
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  doc.text(`Total de colaboradores: ${entries.length}`, 15, y);
  y += 8;

  const getLevel = (score: number) => {
    if (score <= 33) return 'Baixo';
    if (score <= 66) return 'Médio';
    return 'Alto';
  };

  // Table
  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(15, y, 180, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Colaborador', 17, y + 6);
  doc.text('Desempenho', 80, y + 6);
  doc.text('Compatib.', 115, y + 6);
  doc.text('Quadrante', 140, y + 6);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  entries.forEach((e, i) => {
    if (y > 275) { doc.addPage(); y = 20; }
    if (i % 2 === 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(15, y - 4, 180, 7, 'F');
    }
    doc.setTextColor(50, 50, 50);
    doc.text(e.employee_name.substring(0, 30), 17, y);
    doc.text(`${e.performance_score} (${getLevel(e.performance_score)})`, 80, y);
    doc.text(`${e.role_fit_score} (${getLevel(e.role_fit_score)})`, 115, y);

    const perfLevel = e.performance_score <= 33 ? 1 : e.performance_score <= 66 ? 2 : 3;
    const fitLevel = e.role_fit_score <= 33 ? 1 : e.role_fit_score <= 66 ? 2 : 3;
    const categories: Record<string, string> = {
      '3-3': 'Alto Potencial', '3-2': 'Forte Desempenho', '3-1': 'Enigma',
      '2-3': 'Forte Desempenho', '2-2': 'Mantenedor', '2-1': 'Questionável',
      '1-3': 'Comprometido', '1-2': 'Eficaz', '1-1': 'Insuficiente',
    };
    doc.text(categories[`${perfLevel}-${fitLevel}`] || '-', 140, y);
    y += 7;
  });

  addFooter(doc);
  doc.save(`matriz-9box-${new Date().toISOString().slice(0, 10)}.pdf`);
}
