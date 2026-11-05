import nodemailer from "nodemailer";

const CONTACT_TO = process.env.CONTACT_TO_EMAIL || "mk0906145@gmail.com";

export async function sendContactEmail({
  name,
  email,
  topic,
  message,
}: {
  name: string;
  email: string;
  topic: string;
  message: string;
}) {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, "");

  if (!user || !pass) {
    console.warn(
      "SMTP_USER / SMTP_PASS are not set, so the contact form was saved but no email was sent."
    );
    return { sent: false };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"Mister Fragrant" <${user}>`,
    to: CONTACT_TO,
    replyTo: email,
    subject: `[Mister Fragrant] ${topic} — ${name}`,
    text: [
      `Name: ${name}`,
      `Email: ${email}`,
      `Topic: ${topic}`,
      "",
      message,
    ].join("\n"),
  });

  return { sent: true };
}
