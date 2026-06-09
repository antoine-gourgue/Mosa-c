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
  const sans = "-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif";
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#ffffff">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff">
      <tr>
        <td align="center" style="padding:44px 24px">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%">
            <tr>
              <td style="padding-bottom:32px">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:9px;vertical-align:middle"><img src="cid:mosaic-logo" width="28" height="28" alt="" style="display:block;border:0" /></td>
                    <td style="vertical-align:middle"><span style="font-family:${sans};font-size:19px;font-weight:800;color:#1a1a1a;letter-spacing:-0.3px">Mosaic</span></td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td>
                <h1 style="margin:0 0 10px;font-family:${sans};font-size:24px;font-weight:700;color:#1a1a1a">Confirm your email</h1>
                <p style="margin:0 0 28px;font-family:${sans};font-size:15px;line-height:1.6;color:#6b6b6b">Welcome to Mosaic! Use the code below to verify your email and finish setting up your account.</p>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:10px">
                <table role="presentation" cellpadding="0" cellspacing="0"><tr>${digits}</tr></table>
              </td>
            </tr>
            <tr>
              <td style="padding-top:14px">
                <p style="margin:0;font-family:${sans};font-size:14px;line-height:1.6;color:#6b6b6b">This code expires in <strong style="color:#1a1a1a">10 minutes</strong>. For your security, never share it with anyone &mdash; Mosaic will never ask you for it.</p>
              </td>
            </tr>
            <tr>
              <td style="padding-top:32px">
                <div style="height:1px;background:#ececee;margin-bottom:20px"></div>
                <p style="margin:0 0 6px;font-family:${sans};font-size:13px;line-height:1.6;color:#9a9a9a">Didn&rsquo;t create a Mosaic account? You can safely ignore this email &mdash; no account is activated without this code.</p>
                <p style="margin:14px 0 0;font-family:${sans};font-size:12px;color:#bcbcc0">Mosaic &middot; Discover, save and share visual ideas</p>
              </td>
            </tr>
          </table>
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
