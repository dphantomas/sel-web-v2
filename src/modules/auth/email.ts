import nodemailer from 'nodemailer'
import { env } from '@/env'

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
}

// Convierte el HTML del correo a texto plano para el fallback `text/plain`:
// los filtros de spam penalizan los correos que sólo traen `text/html`. Los
// links son el caso especial que importa (p.ej. el botón de "Restablecer
// Contraseña"): sin esto, la URL quedaría sólo en el `href` y el texto plano
// perdería el enlace.
function htmlToText(html: string): string {
  return html
    .replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, label) => {
      const text = label.replace(/<[^>]+>/g, "").trim();
      return text ? `${text}: ${href}` : href;
    })
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<hr\s*\/?>/gi, "\n----------\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function sendEmail({ to, subject, html, text, from, fromName }: SendEmailParams) {
  if (env.ENABLE_EMAIL_NOTIFICATIONS !== "true") {
    console.warn("Emails are disabled via ENABLE_EMAIL_NOTIFICATIONS. Skipped sending email to:", to);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      type: 'OAuth2',
      user: env.SMTP_USER,
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      refreshToken: env.GOOGLE_REFRESH_TOKEN
    }
  })

  const mailOptions = {
    from: `"${fromName || "Sanación en Luz"}" <${from || env.SMTP_FROM}>`,
    to,
    subject,
    html,
    text: text || htmlToText(html)
  }

  await transporter.sendMail(mailOptions)
}
