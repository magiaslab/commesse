type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
};

export async function sendEmailViaResend(input: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = input.from || process.env.RESEND_FROM || '';
  if (!apiKey || !from) throw new Error('Resend non configurato');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      html: input.html,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend error: ${res.status} ${text}`);
  }
  return res.json();
}

export async function sendPasswordResetEmail(params: { to: string; token: string; baseUrl?: string }) {
  const baseUrl = params.baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(params.token)}`;
  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#111">
      <h2>Reimposta la tua password</h2>
      <p>Hai richiesto la reimpostazione della password. Clicca il pulsante qui sotto per scegliere una nuova password.</p>
      <p><a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;border-radius:6px;text-decoration:none">Reimposta password</a></p>
      <p>Oppure incolla questo link nel browser:<br/><span style="word-break:break-all">${resetUrl}</span></p>
      <p>Se non hai richiesto questa operazione, ignora questa email.</p>
    </div>
  `;
  return sendEmailViaResend({ to: params.to, subject: 'Reimposta la tua password', html });
}

export async function sendInviteEmail(params: { to: string; inviteUrl: string }) {
  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#111">
      <h2>Invito alla piattaforma</h2>
      <p>Sei stato invitato ad accedere alla piattaforma. Clicca il pulsante qui sotto per completare la registrazione.</p>
      <p><a href="${params.inviteUrl}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;border-radius:6px;text-decoration:none">Accetta invito</a></p>
    </div>
  `;
  return sendEmailViaResend({ to: params.to, subject: 'Invito alla piattaforma', html });
}

export function renderScadenzaReminderEmail(params: {
  title: string;
  commessaCodice?: string;
  commessaTitolo?: string;
  dateDue: Date;
  importo?: number;
}) {
  const { title, commessaCodice, commessaTitolo, dateDue, importo } = params;
  const dd = dateDue.toLocaleDateString('it-IT');
  const amount = importo != null ? `${importo.toFixed(2)} EUR` : '';
  return `
  <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#111">
    <h2>Reminder Scadenza</h2>
    <p><strong>${title}</strong></p>
    ${commessaCodice ? `<p>Commessa: ${commessaCodice} – ${commessaTitolo || ''}</p>` : ''}
    <p>Data scadenza: <strong>${dd}</strong></p>
    ${amount ? `<p>Importo: <strong>${amount}</strong></p>` : ''}
    <p>Questo è un promemoria automatico.</p>
  </div>
  `;
}


