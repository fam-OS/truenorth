import 'server-only';
import nodemailer from 'nodemailer';

// Centralized email transporter using SMTP.
// Configure via environment variables. In development without SMTP,
// we fallback to a transport that logs messages to the console.

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
  EMAIL_STREAM, // e.g. Postmark message stream name
} = process.env as Record<string, string | undefined>;

// Avoid referencing nodemailer namespace types in CI where @types may be absent
let transporter: any;

if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465, // true for 465, false for 587/25/2525
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
} else {
  // Dev fallback: log emails to console so OTP flows are testable without SMTP
  transporter = nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true,
  } as any);
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}) {
  const from = EMAIL_FROM || 'TrueNorth <no-reply@localhost>';

  const headers: Record<string, string> = { ...options.headers };
  // Postmark stream header support, if provided
  if (EMAIL_STREAM) {
    headers['X-PM-Message-Stream'] = EMAIL_STREAM;
  }

  const info = await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    replyTo: options.replyTo,
    headers,
  });

  // Log the message in dev or when using stream transport
  if ((transporter as any).options?.streamTransport) {
    // eslint-disable-next-line no-console
    console.log('[email][dev] Sent mail (simulated):\n', info.message.toString());
  } else {
    // eslint-disable-next-line no-console
    console.log('[email][smtp] sentMail result:', {
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
      envelope: info.envelope,
    });
  }

  return info;
}
