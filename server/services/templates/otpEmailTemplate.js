const buildOtpEmail = ({ otpCode, recipientName, expiresMinutes, purpose }) => {
  const safeName = recipientName ? recipientName : "ban"
  const minutes = expiresMinutes || 10
  const isReset = purpose === "reset_password"

  const subject = isReset ? "Ma OTP dat lai mat khau" : "Ma OTP xac thuc tai khoan"
  const introText = isReset
    ? "Day la ma OTP de dat lai mat khau cua ban. Vui long nhap ma trong thoi gian quy dinh."
    : "Day la ma OTP de xac thuc tai khoan cua ban. Vui long su dung trong thoi gian quy dinh."
  const text = [
    `Xin chao ${safeName},`,
    "",
    `${introText.replace("thoi gian quy dinh", `${minutes} phut`)}\nMa OTP cua ban la: ${otpCode}`,
    "",
    "Neu ban khong thuc hien yeu cau nay, vui long bo qua email hoac bao cho chung toi.",
    "",
    "Tran trong,",
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
              <p style="margin:0 0 16px;font-size:16px;color:#0f172a;">Xin chao ${safeName},</p>
              <p style="margin:0 0 24px;font-size:15px;color:#475569;">${introText.replace("thoi gian quy dinh", `${minutes} phut`)}</p>
              <div style="text-align:center;margin-bottom:24px;">
                <div style="display:inline-block;padding:16px 32px;border-radius:12px;background:#f1f5ff;border:1px solid #dbeafe;font-size:32px;letter-spacing:6px;color:#1d4ed8;font-weight:600;">
                  ${otpCode}
                </div>
              </div>
              <p style="margin:0 0 12px;font-size:14px;color:#64748b;">Neu ban khong thuc hien yeu cau nay, vui long bo qua email nay hoac lien he lai chung toi.</p>
              <p style="margin:0;font-size:14px;color:#94a3b8;">Tran trong,<br/>Project Support</p>
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