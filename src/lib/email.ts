import { EMAIL_LOGO_BASE64 } from "./email-logo";

/**
 * An inline or regular email attachment. `contentId` makes it referenceable
 * from the HTML via `cid:<contentId>` (used for the inline logo).
 */
export type EmailAttachment = {
  filename: string;
  content: string;
  contentId?: string;
};

/**
 * A transactional email to send.
 */
export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: EmailAttachment[];
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
        ...(message.attachments !== undefined
          ? {
              attachments: message.attachments.map((attachment) => ({
                filename: attachment.filename,
                content: attachment.content,
                content_id: attachment.contentId,
              })),
            }
          : {}),
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Renders the branded HTML for the verification email. Uses a table-based,
 * inline-styled layout for broad email-client compatibility (Gmail, Outlook,
 * Apple Mail), with the code spelled out per character so it never wraps.
 *
 * @param code - The 6-digit verification code.
 * @returns The HTML body.
 */
function renderOtpHtml(code: string): string {
  const digits = code
    .split("")
    .map(
      (digit) =>
        `<td style="padding:0 5px"><div style="width:44px;height:56px;line-height:56px;background:#f4f4f5;border:1px solid #ececee;border-radius:12px;font-size:26px;font-weight:700;color:#1a1a1a;text-align:center;font-family:'SFMono-Regular',Menlo,Consolas,monospace">${digit}</div></td>`,
    )
    .join("");
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f4f4f5">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5">
      <tr>
        <td align="center" style="padding:32px 16px">
          <table role="presentation" width="460" cellpadding="0" cellspacing="0" style="max-width:460px;width:100%;background:#ffffff;border:1px solid #ececee;border-radius:18px;overflow:hidden">
            <tr>
              <td style="padding:32px 36px 8px">
                <img src="cid:mosaic-logo" width="44" height="44" alt="Mosaic" style="display:block;border:0;border-radius:11px" />
              </td>
            </tr>
            <tr>
              <td style="padding:8px 36px 0">
                <h1 style="margin:0 0 8px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;color:#1a1a1a">Confirm your email</h1>
                <p style="margin:0 0 24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.5;color:#6b6b6b">Enter this code to finish creating your Mosaic account.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 36px 8px">
                <table role="presentation" cellpadding="0" cellspacing="0"><tr>${digits}</tr></table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 36px 0">
                <p style="margin:0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:13px;color:#9a9a9a">This code expires in 10 minutes.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 36px 32px">
                <div style="height:1px;background:#ececee;margin-bottom:16px"></div>
                <p style="margin:0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:#9a9a9a">If you didn&rsquo;t create a Mosaic account, you can safely ignore this email.</p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:11px;color:#bcbcc0;text-align:center">Mosaic &middot; Discover, save and share visual ideas</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Renders and sends the email-verification one-time code.
 *
 * @param to - The recipient email address.
 * @param code - The 6-digit verification code.
 * @returns Whether the email was accepted for delivery.
 */
export async function sendOtpEmail(to: string, code: string): Promise<boolean> {
  const subject = `${code} is your Mosaic verification code`;
  const text = `Your Mosaic verification code is ${code}. It expires in 10 minutes. If you didn't create a Mosaic account, you can ignore this email.`;
  return sendEmail({
    to,
    subject,
    html: renderOtpHtml(code),
    text,
    attachments: [
      { filename: "mosaic-logo.png", content: EMAIL_LOGO_BASE64, contentId: "mosaic-logo" },
    ],
  });
}
