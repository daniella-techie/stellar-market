import nodemailer from "nodemailer";
import { config } from "../config";

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.port === 465,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

export async function sendPasswordResetEmail(
  to: string,
  token: string,
): Promise<void> {
  const resetUrl = `${config.frontendUrl}/auth/reset-password?token=${token}`;

  await transporter.sendMail({
    from: config.smtp.from,
    to,
    subject: "Reset Your Password - StellarMarket",
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your StellarMarket account.</p>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  });
}

export async function sendVerificationEmail(
  to: string,
  token: string,
): Promise<void> {
  const verifyUrl = `${config.frontendUrl}/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: config.smtp.from,
    to,
    subject: "Verify Your Email - StellarMarket",
    html: `
      <h2>Email Verification</h2>
      <p>Thank you for registering on StellarMarket.</p>
      <p>Click the link below to verify your email address.</p>
      <p><a href="${verifyUrl}">Verify Email</a></p>
    `,
  });
}
