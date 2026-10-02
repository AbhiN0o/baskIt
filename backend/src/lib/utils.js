import jwt from 'jsonwebtoken';
import crypto from "crypto";
import nodemailer from "nodemailer";

// Cookie settings that work both locally and when the frontend (Vercel) and
// backend (Render) live on different domains.
//   production -> SameSite=None + Secure (required for cross-site cookies)
//   local dev  -> SameSite=Lax, not Secure (works over http://localhost)
const isProd = process.env.NODE_ENV === "production";
export const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
};

export const generateToken = (id, type, res) => {
  const token = jwt.sign({ id, type }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
};


export function createVerificationToken() {
  const token = crypto.randomBytes(32).toString("hex"); // send this in email
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex"); // store hashed
  const expires = Date.now() + 60 * 60 * 1000; // 1 hour expiry
  return { token, hashedToken, expires };
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
});

// "Name <email@x.com>" or "email@x.com" -> { name, email }
const parseFrom = (from = "") => {
  const m = from.match(/^\s*(.*?)\s*<(.+)>\s*$/);
  return m ? { name: m[1].replace(/"/g, ""), email: m[2] } : { name: "Baskit", email: from.trim() };
};

export async function sendVerificationEmail(email, plainToken) {
  const frontend = (process.env.FRONTEND_URL || "http://localhost:5173").split(",")[0].trim().replace(/\/$/, "");
  const verifyUrl = `${frontend}/sellermarket/verify?token=${plainToken}`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #4CAF50;">Your Seller Verification Awaits! 🎉</h2>
      <p>Hi there 👋,</p>
      <p>We noticed you want to add a <strong>verified badge</strong> to your seller profile. This helps buyers trust you more!</p>
      <p>Click the button below to verify your account:</p>
      <div style="margin: 20px 0;">
        <a href="${verifyUrl}" 
            style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Add Verified Badge ✅
        </a>
      </div>
      <p>If the button doesn’t work, copy and paste this link into your browser:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p style="color: #777; font-size: 12px;">This link will expire in 1 hour. If you didn’t request verification, just ignore this email.</p>
      <hr>
      <p style="font-size: 12px; color: #aaa;">Baskit Team</p>
    </div>
  `;

  const subject = "Get your verified badge on Baskit";

  // Option A (recommended on Render): Brevo's HTTPS API.
  // Render's free tier blocks outbound SMTP ports (25/465/587), so plain SMTP
  // times out in production. HTTPS is never blocked.
  if (process.env.BREVO_API_KEY) {
    const sender = parseFrom(process.env.EMAIL_FROM);
    const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        sender,
        to: [{ email }],
        subject,
        htmlContent: html,
      }),
    });
    if (!resp.ok) {
      throw new Error(`Brevo API error ${resp.status}: ${await resp.text()}`);
    }
    return;
  }

  // Option B: classic SMTP (fine for local dev, or paid hosting)
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject,
    html,
  });
}
