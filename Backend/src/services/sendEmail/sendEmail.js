import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, html }) => {
  if (!to) {
    console.error('Error: No recipient (to) defined for sendEmail');
    return null;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"A2Z Decoration" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent successfully to ${to}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
