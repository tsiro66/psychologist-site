import type { APIRoute } from "astro";
import { Resend } from "resend";
import { env } from "cloudflare:workers";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const resend = new Resend(env.RESEND_API_KEY);

  const body = await request.json();
  const { name, email, phone, message } = body;

  if (!name || !email || !message) {
    return new Response(
      JSON.stringify({ error: "Συμπλήρωσε όλα τα υποχρεωτικά πεδία." }),
      { status: 400 },
    );
  }

  const { error } = await resend.emails.send({
    from: "Φόρμα Επικοινωνίας <onboarding@resend.dev>",
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
