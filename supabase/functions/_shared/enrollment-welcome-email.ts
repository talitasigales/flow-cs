// Template compartilhado do e-mail de boas-vindas / matrícula em turma.
// Usado pelo import de alunos (envio automático) e pelo reenvio manual do admin.

export interface WelcomeClassInfo {
  programName: string;
  programDescription?: string | null;
  className?: string | null;
  startDate?: string | null; // yyyy-mm-dd
  endDate?: string | null;
  startTime?: string | null; // HH:MM:SS
  endTime?: string | null;
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

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const parts = (d?: string | null) => {
  if (!d) return null;
  const [y, m, day] = d.split('-');
  if (!y || !m || !day) return null;
  return { y, m: Number(m), day: Number(day) };
};

const fmtTime = (t?: string | null) => {
  if (!t) return null;
  const [h, m] = t.split(':');
  if (h === undefined || m === undefined) return t;
  return m && m !== '00' ? `${h}h${m}` : `${h}h`;
};

/** "nos dias 10 e 11 de junho, das 9h às 12h" */
function buildWhenPhrase(info: WelcomeClassInfo): string | null {
  const s = parts(info.startDate);
  const e = parts(info.endDate);
  if (!s) return null;

  let datePart: string;
  if (e && (e.day !== s.day || e.m !== s.m)) {
    datePart = e.m === s.m
      ? `nos dias ${s.day} e ${e.day} de ${MONTHS[s.m - 1]}`
      : `de ${s.day} de ${MONTHS[s.m - 1]} a ${e.day} de ${MONTHS[e.m - 1]}`;
  } else {
    datePart = `no dia ${s.day} de ${MONTHS[s.m - 1]}`;
  }

  const st = fmtTime(info.startTime);
  const et = fmtTime(info.endTime);
  if (st && et) return `${datePart}, das ${st} às ${et}`;
  if (st) return `${datePart}, a partir das ${st}`;
  return datePart;
}

export function buildWelcomeSubject(info: WelcomeClassInfo) {
  return `Bem-vindo(a) ao ${info.programName} — seu acesso à plataforma Grou`;
}

export function buildWelcomeHtml(info: WelcomeClassInfo, r: WelcomeRecipient) {
  const firstName = (r.name || '').trim().split(' ')[0] || '';
  const greeting = firstName ? `Olá, <strong>${firstName}</strong>!` : 'Olá!';
  const when = buildWhenPhrase(info);

  const pitch = info.programDescription?.trim()
    ? info.programDescription.trim()
    : 'A proposta aqui vai além de conteúdo: é uma jornada prática para transformar a forma como você aplica o aprendizado no dia a dia.';

  const credRow = (label: string, value: string) =>
    `<tr>
      <td style="padding:6px 0;font-size:14px;color:#64748b;width:150px">${label}</td>
      <td style="padding:6px 0;font-size:14px;color:${DARK};font-weight:600">${value}</td>
    </tr>`;

  const credentials = r.tempPassword
    ? `${credRow('E-mail', r.email)}${credRow('Senha provisória', `<code style="background:#fff;padding:4px 8px;border-radius:6px">${r.tempPassword}</code>`)}`
    : `${credRow('E-mail', r.email)}${credRow('Senha', 'a que você já utiliza na plataforma')}`;

  const credNote = r.tempPassword
    ? 'No primeiro acesso você será convidado(a) a criar uma nova senha.'
    : 'Esqueceu a senha? Use a opção "Esqueci minha senha" na tela de login.';

  const meetingLine = info.videoConferenceUrl
    ? `✅ Link da videoconferência ao vivo: <a href="${info.videoConferenceUrl}" style="color:${DARK}">acessar a sala</a>`
    : '✅ Link da videoconferência ao vivo (liberado na plataforma 1 dia antes do encontro)';

  const bullets = [
    '✅ Sua jornada individual de acompanhamento',
    meetingLine,
    '✅ Exercícios e materiais complementares',
    '✅ Conteúdos extras para aprofundar o aprendizado',
    '✅ Recursos pensados para aplicar o conteúdo no dia a dia',
  ].map((b) => `<li style="margin:0 0 8px">${b}</li>`).join('');

  const steps = [
    `Acesse <a href="${PLATFORM_URL}" style="color:${DARK}"><strong>cs.grougp.com.br</strong></a>`,
    'Entre com o login e a senha abaixo',
    'No menu lateral, vá até a aba <strong>Academy</strong>',
    `Clique em <strong>${info.programName}</strong>${info.className ? ` — turma ${info.className}` : ''}`,
  ].map((s, i) => `<li style="margin:0 0 8px;font-size:15px">${s}</li>`).join('');

  return `<!doctype html><html><body style="margin:0;padding:24px;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;color:${DARK}">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e6e8ec">
    <tr><td style="background:${DARK};padding:22px 26px">
      <h1 style="margin:0;font-size:18px;color:#fff">Grou · ${info.programName}</h1>
    </td></tr>
    <tr><td style="padding:26px">
      <p style="margin:0 0 14px;font-size:15px">${greeting}</p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.6">
        Que bom ter você com a gente no <strong>${info.programName}</strong>${info.className ? ` — turma <strong>${info.className}</strong>` : ''}.
      </p>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.6">${pitch}</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6">
        Você já pode começar sua preparação dentro da nossa plataforma antes do início${when ? `, que acontecerá ao vivo <strong>${when}</strong>` : ''}${info.specialist ? `, com <strong>${info.specialist}</strong>` : ''}.
      </p>

      <h2 style="margin:0 0 10px;font-size:16px">Como acessar a plataforma pela primeira vez</h2>
      <ol style="margin:0 0 20px;padding-left:20px;line-height:1.6;color:${DARK}">${steps}</ol>

      <div style="margin:0 0 22px;padding:16px;border-radius:12px;background:#f0fdfa;border:1px solid ${BRAND}">
        <p style="margin:0 0 8px;font-size:14px;color:#64748b">Seus dados de acesso</p>
        <table cellpadding="0" cellspacing="0" width="100%">${credentials}</table>
        <p style="margin:10px 0 0;font-size:13px;color:#64748b">${credNote}</p>
      </div>

      <p style="margin:0 0 24px;text-align:center">
        <a href="${PLATFORM_URL}" style="background:${BRAND};color:${DARK};text-decoration:none;padding:14px 30px;border-radius:8px;font-size:15px;font-weight:bold;display:inline-block">Acessar a plataforma</a>
      </p>

      <h2 style="margin:0 0 10px;font-size:16px">O que você já encontra por lá</h2>
      <ul style="margin:0 0 20px;padding-left:20px;line-height:1.6;font-size:14px;list-style:none">${bullets}</ul>

      <p style="margin:0 0 14px;font-size:15px;line-height:1.6">
        A ideia é simples: não deixar o aprendizado parar no encontro, mas levar isso para a prática.
      </p>
      <p style="margin:0 0 14px;font-size:14px;color:#475569">
        Se tiver qualquer dificuldade no acesso ou dúvidas, é só responder este e-mail ou falar com a gente em
        <a href="mailto:${SUPPORT_EMAIL}" style="color:${DARK}">${SUPPORT_EMAIL}</a>.
      </p>
      <p style="margin:16px 0 0;font-size:14px">Até breve! 🚀<br/><span style="color:#64748b">Equipe Grou</span></p>
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
