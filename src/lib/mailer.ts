import nodemailer from 'nodemailer';

// Configure the SMTP transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const sendLeaveDecisionEmail = async (
  employeeEmail: string, 
  status: 'APPROVED' | 'REJECTED', 
  adminComments?: string
) => {
  try {
    const info = await transporter.sendMail({
     
      to: employeeEmail,
      subject: `Leave Request Update: ${status}`,
      html: `
        <h2>Your leave request has been ${status.toLowerCase()}.</h2>
        ${adminComments ? `<p><strong>Admin Comments:</strong> ${adminComments}</p>` : ''}
        <p>Log in to your dashboard to view the full details.</p>
      `,
    });

    console.log('Message sent: %s', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};