import nodemailer from 'nodemailer'
import { env } from '@/env'

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
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
    from: `"Sanación en Luz" <${env.SMTP_FROM}>`,
    to,
    subject,
    html
  }

  await transporter.sendMail(mailOptions)
}
