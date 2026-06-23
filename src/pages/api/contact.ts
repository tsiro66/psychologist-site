import type { APIRoute } from "astro";
import { Resend } from "resend";
import { env } from "cloudflare:workers";

export const prerender = false;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s\-().]{7,20}$/;

export const POST: APIRoute = async ({ request }) => {
  const resend = new Resend(env.RESEND_API_KEY);

  let body: { name?: string; email?: string; phone?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Μη έγκυρο αίτημα" }), { status: 400 });
  }
  const { name, email, phone, message } = body;

  if (typeof name !== "string" || !name.trim() || name.length > 100) {
    return new Response(JSON.stringify({ error: "Μη έγκυρο όνομα" }), { status: 400 });
  }
  if (typeof email !== "string" || !EMAIL_RE.test(email.trim()) || email.length > 254) {
    return new Response(JSON.stringify({ error: "Μη έγκυρο email" }), { status: 400 });
  }
  if (phone !== undefined && phone !== "" && (typeof phone !== "string" || !PHONE_RE.test(phone.trim()))) {
    return new Response(JSON.stringify({ error: "Μη έγκυρο τηλέφωνο" }), { status: 400 });
  }
  if (typeof message !== "string" || !message.trim() || message.length > 5000) {
    return new Response(JSON.stringify({ error: "Μη έγκυρο μήνυμα" }), { status: 400 });
  }

  const { error } = await resend.emails.send({
    from: "Φόρμα Επικοινωνίας <noreply@katerinakritikou.gr>",
    to: env.CONTACT_EMAIL,
    replyTo: email,
    subject: `Νέο μήνυμα από ${name}`,
    html: `
      <h2>Νέο μήνυμα από τη φόρμα επικοινωνίας</h2>
      <p><strong>Όνομα:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      ${phone ? `<p><strong>Τηλέφωνο:</strong> ${escapeHtml(phone)}</p>` : ""}
      <hr />
      <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
    `,
  });

  if (error) {
    console.error("Resend error:", error);
    return new Response(
      JSON.stringify({ error: "Αποτυχία αποστολής. Δοκίμασε ξανά." }),
      { status: 500 },
    );
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
