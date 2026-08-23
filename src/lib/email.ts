/**
 * Transactional email helper.
 * Uses EmailJS for OTP emails; other emails use a placeholder logger.
 */

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TRANSACTIONAL_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    // Dev fallback: log to console when EmailJS is not configured
    // eslint-disable-next-line no-console
    console.log(`[EMAIL] To: ${to} | Subject: ${subject}`);
    // eslint-disable-next-line no-console
    console.log(`[EMAIL] Body: ${html}`);
    return;
  }

  const emailjs = (await import("@emailjs/nodejs")).default;
  await emailjs.send(
    serviceId,
    templateId,
    {
      to_email: to,
      subject,
      html_content: html,
      from_name: "WorkFrame HRMS",
    },
    { publicKey, privateKey }
  );
}

// ─── EmailJS OTP Integration ─────────────────────────────────────────────────

/**
 * Send a 6-digit OTP email via EmailJS.
 * Requires EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, and EMAILJS_PRIVATE_KEY env vars.
 */
export async function sendOtpEmail({
  to,
  otpCode,
  employeeName,
}: {
  to: string;
  otpCode: string;
  employeeName: string;
}): Promise<void> {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey || !privateKey) {
    // Dev fallback: log OTP to console when EmailJS is not configured
    // eslint-disable-next-line no-console
    console.log(`\n[OTP] Email: ${to}`);
    // eslint-disable-next-line no-console
    console.log(`[OTP] Code: ${otpCode}\n`);
    return;
  }

  const emailjs = (await import("@emailjs/nodejs")).default;
  await emailjs.send(
    serviceId,
    templateId,
    {
      to_email: to,
      to_name: employeeName,
      otp_code: otpCode,
      from_name: "WorkFrame HRMS",
    },
    { publicKey, privateKey }
  );
}

// ─── Email Templates ────────────────────────────────────────────────────────

export function leaveDecisionEmail(params: {
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: "APPROVED" | "REJECTED";
  reviewerComment?: string | null;
}): { subject: string; html: string } {
  const { employeeName, leaveType, startDate, endDate, status, reviewerComment } = params;
  const statusText = status === "APPROVED" ? "Approved" : "Rejected";

  return {
    subject: `Your ${leaveType.toLowerCase()} leave request has been ${statusText}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #18181b;">Leave Request ${statusText}</h2>
        <p>Hello ${employeeName},</p>
        <p>Your <strong>${leaveType}</strong> leave request from <strong>${startDate}</strong> to <strong>${endDate}</strong> has been <strong>${statusText}</strong>.</p>
        ${reviewerComment ? `<p><strong>Reviewer comment:</strong> ${reviewerComment}</p>` : ""}
        <p style="color: #71717a; font-size: 12px; margin-top: 32px;">— WorkFrame HRMS</p>
      </div>
    `,
  };
}
