// Template compartilhado do e-mail de boas-vindas / matrícula em turma.
// Usado pelo import de alunos (envio automático) e pelo reenvio manual do admin.

export interface WelcomeClassInfo {
  programName: string;
  className?: string | null;
  startDate?: string | null; // yyyy-mm-dd
  endDate?: string | null;
  startTime?: string | null; // HH:MM:SS
  videoConferenceUrl?: string | null;
  specialist?: string | null;
}

export interface WelcomeRecipient {
  email: string;
  name?: string | null;
  tempPassword?: string | null;
}

const PLATFORM_URL = 'https://cs.grougp.com.br';
const SUPPORT_EMAIL = 'contato@grougp.com.br';
const BRAND = '#2bdccf';
const DARK = '#0F172A';

const fmtDate = (d?: string | null) => {
  if (!d) return null;
  const [y, m, day] = d.split('-');
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
};

const fmtTime = (t?: string | null) => {
  if (!t) return null;
  const [h, m] = t.split(':');
  if (h === undefined || m === undefined) return t;
  return `${h}h${m !== '00' ? m : ''}`;
};

export function buildWelcomeSubject(info: WelcomeClassInfo) {
  return `Bem-vindo(a) ao ${info.programName} — seus dados de acesso`;
}

export function buildWelcomeHtml(info: WelcomeClassInfo, r: WelcomeRecipient) {
  const firstName = (r.name || '').trim().split(' ')[0] || '';
  const greeting = firstName ? `Olá, <strong>${firstName}</strong>!` : 'Olá!';

  const start = fmtDate(info.startDate);
  const end = fmtDate(info.endDate);
  const time = fmtTime(info.startTime);

  const rows: string[] = [];
  const row = (label: string, value: string) =>
    `<tr>
      <td style="padding:8px 0;font-size:14px;color:#64748b;width:150px">${label}</td>
      <td style="padding:8px 0;font-size:14px;color:${DARK};font-weight:600">${value}</td>
    </tr>`;

  rows.push(row('Programa', info.programName));
  if (info.className) rows.push(row('Turma', info.className));
  if (start) rows.push(row('Início', end && end !== start ? `${start} a ${end}` : start));
  if (time) rows.push(row('Horário', `${time} (horário de Brasília)`));
  if (info.specialist) rows.push(row('Especialista', info.specialist));

  const credentialsBlock = r.tempPassword
    ? `<p style="margin:0 0 8px;font-size:14px;color:#64748b">Seu acesso à plataforma</p>
       <table cellpadding="0" cellspacing="0" width="100%">
         ${row('E-mail', r.email)}
         ${row('Senha provisória', `<code style="background:#f1f5f9;padding:4px 8px;border-radius:6px">${r.tempPassword}</code>`)}
       </table>
       <p style="margin:12px 0 0;font-size:13px;color:#64748b">No primeiro acesso você será convidado(a) a criar uma nova senha.</p>`
    : `<p style="margin:0 0 8px;font-size:14px;color:#64748b">Seu acesso à plataforma</p>
       <table cellpadding="0" cellspacing="0" width="100%">
         ${row('E-mail', r.email)}
         ${row('Senha', 'a que você já utiliza na plataforma')}
       </table>
       <p style="margin:12px 0 0;font-size:13px;color:#64748b">Esqueceu a senha? Use a opção "Esqueci minha senha" na tela de login.</p>`;

  const meetingBlock = info.videoConferenceUrl
    ? `<div style="margin:24px 0;padding:16px;border:1px solid #e2e8f0;border-radius:12px">
         <p style="margin:0 0 8px;font-size:14px;color:#64748b">Sala da videoconferência</p>
         <p style="margin:0 0 12px;font-size:13px;color:${DARK};word-break:break-all">
           <a href="${info.videoConferenceUrl}" style="color:${DARK}">${info.videoConferenceUrl}</a>
         </p>
         <a href="${info.videoConferenceUrl}" style="background:${DARK};color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:bold;display:inline-block">Entrar na sala</a>
       </div>`
    : '';

  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;color:${DARK}">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e6e8ec">
    <tr><td style="background:${DARK};padding:22px 26px">
      <h1 style="margin:0;font-size:18px;color:#fff">Grou · ${info.programName}</h1>
    </td></tr>
    <tr><td style="padding:26px">
      <p style="margin:0 0 14px;font-size:15px">${greeting}</p>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.6">
        Sua matrícula foi confirmada e você já faz parte desta turma. Abaixo estão as informações do curso e os seus dados de acesso à plataforma.
      </p>

      <div style="margin:0 0 24px;padding:16px;border:1px solid #e2e8f0;border-radius:12px">
        <table cellpadding="0" cellspacing="0" width="100%">${rows.join('')}</table>
      </div>

      <div style="margin:0 0 8px;padding:16px;border-radius:12px;background:#f0fdfa;border:1px solid ${BRAND}">
        ${credentialsBlock}
      </div>

      <p style="margin:24px 0;text-align:center">
        <a href="${PLATFORM_URL}" style="background:${BRAND};color:${DARK};text-decoration:none;padding:14px 30px;border-radius:8px;font-size:15px;font-weight:bold;display:inline-block">Acessar a plataforma</a>
      </p>

      ${meetingBlock}

      <p style="margin:20px 0 0;font-size:14px;line-height:1.6;color:#475569">
        Recomendamos acessar a plataforma antes do início para conferir o cronograma, os materiais e as atividades preparatórias da turma.
      </p>
      <p style="margin:16px 0 0;font-size:13px;color:#64748b">
        Dúvidas? Responda este e-mail ou fale com a gente em <a href="mailto:${SUPPORT_EMAIL}" style="color:${DARK}">${SUPPORT_EMAIL}</a>.
      </p>
      <p style="margin:18px 0 0;font-size:13px;color:#64748b">Bons estudos!<br/>Equipe Grou</p>
    </td></tr>
  </table></body></html>`;
}

export async function sendWelcomeEmail(
  resendApiKey: string,
  info: WelcomeClassInfo,
  r: WelcomeRecipient,
) {
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendApiKey}` },
    body: JSON.stringify({
      from: 'Grou <certificados@grougp.com.br>',
      to: [r.email],
      subject: buildWelcomeSubject(info),
      html: buildWelcomeHtml(info, r),
    }),
  });
  const body = await resp.json().catch(() => ({}));
  return { ok: resp.ok, status: resp.status, body };
}
