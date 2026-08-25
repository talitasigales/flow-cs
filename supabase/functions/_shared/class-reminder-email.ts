// Template compartilhado do e-mail de lembrete de aula (24h e 1h antes).

export interface ReminderClassInfo {
  programName: string;
  className?: string | null;
  sessionTitle?: string | null;
  sessionDate: string; // yyyy-mm-dd
  startTime?: string | null; // HH:MM(:SS)
  endTime?: string | null;
  timezone?: string | null;
  videoConferenceUrl?: string | null;
  specialist?: string | null;
}

export type ReminderType = '24h' | '1h';

const PLATFORM_URL = 'https://cs.grougp.com.br';
const SUPPORT_EMAIL = 'contato@grougp.com.br';
const BRAND = '#2bdccf';
const DARK = '#0F172A';

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

export const fmtTime = (t?: string | null) => {
  if (!t) return null;
  const [h, m] = t.split(':');
  if (h === undefined) return t;
  return m && m !== '00' ? `${h}h${m}` : `${h}h`;
};

export function fmtDate(d: string): string {
  const [y, m, day] = d.split('-').map(Number);
  if (!y || !m || !day) return d;
  const wd = WEEKDAYS[new Date(Date.UTC(y, m - 1, day)).getUTCDay()];
  return `${wd}, ${day} de ${MONTHS[m - 1]}`;
}

export function buildReminderSubject(info: ReminderClassInfo, type: ReminderType): string {
  const time = fmtTime(info.startTime);
  return type === '24h'
    ? `Amanhã: ${info.programName}${time ? ` às ${time}` : ''}`
    : `Começa em 1 hora: ${info.programName}${time ? ` às ${time}` : ''}`;
}

export function buildReminderHtml(
  info: ReminderClassInfo,
  type: ReminderType,
  recipientName?: string | null,
): string {
  const first = (recipientName || '').trim().split(' ')[0];
  const greeting = first ? `Olá, ${first}!` : 'Olá!';
  const st = fmtTime(info.startTime);
  const et = fmtTime(info.endTime);
  const tz = info.timezone || 'America/Sao_Paulo';
  const horario = st ? (et ? `${st} às ${et}` : `a partir das ${st}`) : 'horário a confirmar';

  const headline = type === '24h'
    ? 'Seu encontro é amanhã!'
    : 'Seu encontro começa em 1 hora!';
  const intro = type === '24h'
    ? 'Passando para confirmar o horário e já deixar o link da sala à mão.'
    : 'Já pode se preparar: separe um lugar tranquilo, fone e uma boa conexão.';

  const link = info.videoConferenceUrl;

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
  <body style="margin:0;background:#f1f5f9;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:${DARK}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff">
    <tr><td style="background:${DARK};padding:24px 28px">
      <div style="color:${BRAND};font-size:13px;letter-spacing:2px;text-transform:uppercase">Grou</div>
      <div style="color:#ffffff;font-size:20px;font-weight:700;margin-top:6px">${headline}</div>
    </td></tr>
    <tr><td style="padding:28px">
      <p style="margin:0 0 12px;font-size:16px">${greeting}</p>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.6">${intro}</p>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-left:4px solid ${BRAND};border-radius:6px;margin:0 0 20px">
        <tr><td style="padding:16px 18px;font-size:14px;line-height:1.8">
          <strong>${info.programName}</strong>${info.className ? `<br/><span style="color:#475569">Turma: ${info.className}</span>` : ''}
          ${info.sessionTitle ? `<br/><span style="color:#475569">Encontro: ${info.sessionTitle}</span>` : ''}
          <br/><span style="color:#475569">📅 ${fmtDate(info.sessionDate)}</span>
          <br/><span style="color:#475569">🕒 ${horario} (horário de Brasília)</span>
          ${info.specialist ? `<br/><span style="color:#475569">🎤 Especialista: ${info.specialist}</span>` : ''}
        </td></tr>
      </table>

      ${link ? `<p style="margin:0 0 20px"><a href="${link}" style="display:inline-block;background:${BRAND};color:${DARK};font-weight:700;text-decoration:none;padding:14px 26px;border-radius:8px;font-size:15px">Entrar na sala da videoconferência</a></p>
      <p style="margin:0 0 20px;font-size:13px;color:#64748b;word-break:break-all">Se o botão não funcionar, copie o link: <a href="${link}" style="color:${DARK}">${link}</a></p>`
        : `<p style="margin:0 0 20px;font-size:14px;color:#475569">O link da sala será enviado em breve pela equipe.</p>`}

      <p style="margin:0 0 14px;font-size:14px;line-height:1.6">
        Todo o conteúdo do programa também está na plataforma:
        <a href="${PLATFORM_URL}" style="color:${DARK};font-weight:600">${PLATFORM_URL}</a>
      </p>
      <p style="margin:0 0 14px;font-size:14px;color:#475569">
        Qualquer dúvida, é só responder este e-mail ou falar com a gente em
        <a href="mailto:${SUPPORT_EMAIL}" style="color:${DARK}">${SUPPORT_EMAIL}</a>.
      </p>
      <p style="margin:16px 0 0;font-size:14px">Até já! 🚀<br/><span style="color:#64748b">Equipe Grou</span></p>
      <p style="margin:8px 0 0;font-size:11px;color:#94a3b8">Fuso horário de referência: ${tz}</p>
    </td></tr>
  </table></body></html>`;
}

export async function sendReminderEmail(
  resendApiKey: string,
  info: ReminderClassInfo,
  type: ReminderType,
  to: string,
  name?: string | null,
) {
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendApiKey}` },
    body: JSON.stringify({
      from: 'Grou <certificados@grougp.com.br>',
      to: [to],
      subject: buildReminderSubject(info, type),
      html: buildReminderHtml(info, type, name),
    }),
  });
  const body = await resp.json().catch(() => ({}));
  return { ok: resp.ok, status: resp.status, body };
}
