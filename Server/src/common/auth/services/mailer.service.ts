import nodemailer from "nodemailer";
import { env } from "../../config/env.config";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

const FROM = `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`;

export async function sendVerificationEmail(
  to: string,
  username: string,
  token: string,
): Promise<void> {
  const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Verify your email address",
    html: `
      <h2>Hi ${username},</h2>
      <p>Thanks for signing up! Please verify your email by clicking the link below.</p>
      <p>This link expires in <strong>24 hours</strong>.</p>
      <a href="${verifyUrl}" style="
        display:inline-block;
        padding:12px 24px;
        background:#4F46E5;
        color:#fff;
        text-decoration:none;
        border-radius:6px;
        font-weight:600;
      ">Verify Email</a>
      <p>Or copy this link: ${verifyUrl}</p>
    `,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  username: string,
  token: string,
): Promise<void> {
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Reset your password",
    html: `
      <h2>Hi ${username},</h2>
      <p>We received a request to reset your password.</p>
      <p>This link expires in <strong>1 hour</strong>. If you didn't request this, ignore this email.</p>
      <a href="${resetUrl}" style="
        display:inline-block;
        padding:12px 24px;
        background:#DC2626;
        color:#fff;
        text-decoration:none;
        border-radius:6px;
        font-weight:600;
      ">Reset Password</a>
      <p>Or copy this link: ${resetUrl}</p>
    `,
  });
}