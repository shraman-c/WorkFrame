/**
 * Transactional email helper.
 * Currently logs to console — wire up a real provider (SendGrid, SES, etc.) when ready.
 */

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
  // Placeholder — replace with a real email provider integration.
  console.log(`[EMAIL] To: ${to} | Subject: ${subject}`);
  console.log(`[EMAIL] Body: ${html}`);
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

export function verificationEmail(params: {
  employeeName: string;
  verificationLink: string;
}): { subject: string; html: string } {
  const { employeeName, verificationLink } = params;

  return {
    subject: "Verify your WorkFrame account",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #18181b;">Verify Your Email</h2>
        <p>Hello ${employeeName},</p>
        <p>Please verify your email address by clicking the link below:</p>
        <p><a href="${verificationLink}" style="color: #eab308; font-weight: bold;">Verify Email</a></p>
        <p style="color: #71717a; font-size: 12px; margin-top: 32px;">— WorkFrame HRMS</p>
      </div>
    `,
  };
}

export function welcomeEmail(params: {
  employeeName: string;
}): { subject: string; html: string } {
  const { employeeName } = params;

  return {
    subject: "Welcome to WorkFrame!",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #18181b;">Welcome to WorkFrame</h2>
        <p>Hello ${employeeName},</p>
        <p>Your email has been verified and your account is now active.</p>
        <p>You can sign in at any time to access your dashboard, check in/out, apply for leave, and view your payroll information.</p>
        <p style="color: #71717a; font-size: 12px; margin-top: 32px;">— WorkFrame HRMS</p>
      </div>
    `,
  };
}
