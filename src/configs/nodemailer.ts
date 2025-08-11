import nodemailer from "nodemailer";
import logger from "../utils/logger";

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.zoho.com",
    port: parseInt(process.env.EMAIL_PORT || "465"),
    secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || "info@furacomp.com",
      pass: process.env.EMAIL_PASS || "",
    },
  });

  return transporter;
};

// Verify transporter connection
const verifyConnection = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    logger.info("Email transporter verified successfully");
    return true;
  } catch (error) {
    logger.error("Email transporter verification failed:", error);
    return false;
  }
};

// Send email function
const sendEmail = async (options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"KirkiData" <${process.env.EMAIL_USER || "info@furacomp.com"}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${options.to}: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send email to ${options.to}:`, error);
    return false;
  }
};

export default {
  createTransporter,
  verifyConnection,
  sendEmail,
};
