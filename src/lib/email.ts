/**
 * A transactional email to send.
 */
export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * Sends a transactional email. Uses Resend when `RESEND_API_KEY` is configured,
 * sending from `EMAIL_FROM`; otherwise (local development) it logs the message
 * to the server console so the flow works with no external dependency. Reads the
 * environment directly so importing this module never pulls in a real client or
 * breaks tests.
 *
 * @param message - The recipient, subject and rendered bodies.
 * @returns Whether the email was accepted for delivery (always true in dev).
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (apiKey === undefined || apiKey === "" || from === undefined || from === "") {
    console.info(`[email:dev] to=${message.to} subject="${message.subject}"\n${message.text}`);
    return true;
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Renders and sends the email-verification one-time code.
 *
 * @param to - The recipient email address.
 * @param code - The 6-digit verification code.
 * @returns Whether the email was accepted for delivery.
 */
export async function sendOtpEmail(to: string, code: string): Promise<boolean> {
  const subject = "Your Mosaic verification code";
  const text = `Your Mosaic verification code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`;
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:420px;margin:0 auto;padding:24px">
      <h1 style="font-size:20px;margin:0 0 12px">Confirm your email</h1>
      <p style="color:#444;margin:0 0 16px">Enter this code to finish creating your Mosaic account:</p>
      <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:0 0 16px">${code}</p>
      <p style="color:#888;font-size:13px;margin:0">It expires in 10 minutes. If you didn't request this, ignore this email.</p>
    </div>`;
  return sendEmail({ to, subject, html, text });
}
