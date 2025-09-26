const buildOtpEmail = ({ otpCode, recipientName, expiresMinutes, purpose }) => {
  const safeName = recipientName ? recipientName : "you"
  const minutes = expiresMinutes || 10
  const isReset = purpose === "reset_password"

  const subject = isReset ? "OTP code to reset password" : "OTP code to verify account"
  const introText = isReset
    ? "This is your OTP code to reset your password. Please enter it within the allowed time."
    : "This is your OTP code to verify your account. Please use it within the allowed time."
  const text = [
    `Hello ${safeName},`,
    "",
    `${introText.replace("allowed time", `${minutes} minutes`)}\nYour OTP code is: ${otpCode}`,
    "",
    "If you did not request this, please ignore this email or let us know.",
    "",
    "Sincerely,",
    "Project Support",
  ].join("\n")

  const html = `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;box-shadow:0 12px 30px rgba(15,23,42,0.12);">
          <tr>
            <td style="background:#1677ff;color:#ffffff;padding:24px 32px;font-size:20px;font-weight:600;">
              Project Support
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;color:#0f172a;">Hello ${safeName},</p>
              <p style="margin:0 0 24px;font-size:15px;color:#475569;">${introText.replace("allowed time", `${minutes} minutes`)}</p>
              <div style="text-align:center;margin-bottom:24px;">
                <div style="display:inline-block;padding:16px 32px;border-radius:12px;background:#f1f5ff;border:1px solid #dbeafe;font-size:32px;letter-spacing:6px;color:#1d4ed8;font-weight:600;">
                  ${otpCode}
                </div>
              </div>
              <p style="margin:0 0 12px;font-size:14px;color:#64748b;">If you did not make this request, please ignore this email or contact us.</p>
              <p style="margin:0;font-size:14px;color:#94a3b8;">Sincerely,<br/>Project Support</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  `

  return { subject, text, html }
}

module.exports = {
  buildOtpEmail,
}
