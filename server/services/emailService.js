const nodemailer = require("nodemailer")
const { buildOtpEmail } = require("./templates/otpEmailTemplate")

let cachedTransporter

const ensureTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter
  }

  const user = process.env.MAIL_USER
  const pass = process.env.MAIL_PASS

  if (!user || !pass) {
    throw new Error("MAIL_USER or MAIL_PASS is not configured")
  }

  cachedTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  })

  return cachedTransporter
}

// Gui email chua ma OTP toi nguoi dung voi template dep hon
const sendOtpEmail = async ({ to, otpCode, recipientName, expiresMinutes, purpose }) => {
  const transporter = ensureTransporter()
  const fromEmail = process.env.MAIL_USER
  const fromName = process.env.MAIL_FROM_NAME || "Project Support"
  const expires = expiresMinutes || Number(process.env.OTP_EXPIRES_MINUTES || 10)

  const { subject, text, html } = buildOtpEmail({
    otpCode,
    recipientName,
    expiresMinutes: expires,
    purpose,
  })

  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    to,
    subject,
    text,
    html,
  }

  await transporter.sendMail(mailOptions)
}

module.exports = {
  sendOtpEmail,
}