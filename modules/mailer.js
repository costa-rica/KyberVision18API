// require("dotenv").config();
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

// Create a transporter for Microsoft 365 (Office 365) SMTP
const transporter = nodemailer.createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.ADMIN_EMAIL_ADDRESS,
    pass: process.env.ADMIN_EMAIL_PASSWORD,
  },
});

const sendRegistrationEmail = async (toEmail, username) => {
  try {
    const templatePath = path.join(
      "./templates/registrationConfirmationEmail.html"
    );

    // Read the external HTML file
    let emailTemplate = fs.readFileSync(templatePath, "utf8");
    const urlLogo = `${process.env.URL_BASE_KV_API}/images/KyberV2Shiny.png`;

    // Replace the placeholder {{username}} with the actual username
    emailTemplate = emailTemplate.replace("{{username}}", username);
    emailTemplate = emailTemplate.replace("{{urlLogo}}", urlLogo);

    const mailOptions = {
      from: process.env.ADMIN_EMAIL_ADDRESS,
      to: toEmail,
      subject: "Confirmation: Kyber Vision Registration ",
      html: emailTemplate,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

const sendResetPasswordEmail = async (toEmail, resetLink) => {
  try {
    const templatePath = path.join("./templates/resetPasswordLinkEmail.html");

    // Read the external HTML file
    let emailTemplate = fs.readFileSync(templatePath, "utf8");
    const urlLogo = `${process.env.URL_BASE_KV_API}/images/KyberV2Shiny.png`;

    // Replace the placeholder {{username}} with the actual username
    emailTemplate = emailTemplate.replace("{{resetLink}}", resetLink);
    emailTemplate = emailTemplate.replace("{{urlLogo}}", urlLogo);

    const mailOptions = {
      from: process.env.ADMIN_EMAIL_ADDRESS,
      to: toEmail,
      subject: "Password Reset Request",
      html: emailTemplate,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

const sendVideoMontageCompleteNotificationEmail = async (
  toEmail,
  tokenizedFilename
) => {
  try {
    const templatePath = path.join(
      __dirname,
      "../templates/videoMontageCompleteNotificationEmail.html"
    );

    // Read the external HTML file
    let emailTemplate = fs.readFileSync(templatePath, "utf8");

    const montageUrlPlay = `${process.env.URL_BASE_KV_API}/videos/montage-service/play-video/${tokenizedFilename}`;
    const montageUrlDownload = `${process.env.URL_BASE_KV_API}/videos/montage-service/download-video/${tokenizedFilename}`;
    const urlLogo = `${process.env.URL_BASE_KV_API}/images/KyberV2Shiny.png`;

    // Replace the placeholder {{montageUrlPlay}} and {{montageUrlDownload}} with the actual link
    // emailTemplate = emailTemplate.replace("{{montageLink}}", link);
    emailTemplate = emailTemplate.replace(
      /{{montageUrlPlay}}/g,
      montageUrlPlay
    );
    emailTemplate = emailTemplate.replace(
      /{{montageUrlDownload}}/g,
      montageUrlDownload
    );
    emailTemplate = emailTemplate.replace("{{urlLogo}}", urlLogo);

    const mailOptions = {
      from: process.env.ADMIN_EMAIL_ADDRESS,
      to: toEmail,
      subject: "Your Video Montage is Ready!",
      html: emailTemplate,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.response);
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};

const sendJoinSquadNotificationEmail = async (toEmail) => {
  console.log("-- sendJoinSquadNotificationEmail --");
  try {
    const templatePath = path.join(
      __dirname,
      "../templates/requestToRegisterEmail.html"
    );

    // Read the external HTML file
    let emailTemplate = fs.readFileSync(templatePath, "utf8");

    const urlLogo = `${process.env.URL_BASE_KV_API}/images/KyberV2Shiny.png`;
    const urlRegister = `https://${process.env.PREFIX_VIDEO_FILE_NAME}-manager.dashanddata.com/register`;

    // Replace the placeholder {{registerUrl}} with the actual link
    emailTemplate = emailTemplate.replace(/{{urlRegister}}/g, urlRegister);
    emailTemplate = emailTemplate.replace(/{{urlLogo}}/g, urlLogo);

    const mailOptions = {
      from: process.env.ADMIN_EMAIL_ADDRESS,
      to: toEmail,
      subject: "You have been invited to join a squad on Kyber Vision!",
      html: emailTemplate,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.response);
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};

module.exports = {
  sendRegistrationEmail,
  sendResetPasswordEmail,
  sendVideoMontageCompleteNotificationEmail,
  sendJoinSquadNotificationEmail,
};
