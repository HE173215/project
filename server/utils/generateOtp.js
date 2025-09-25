const DEFAULT_LENGTH = 6
const DEFAULT_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRES_MINUTES || 10)

// Tao ma OTP ngau nhien va tinh thoi gian het han
module.exports = (length = DEFAULT_LENGTH) => {
  const max = 10 ** length
  const min = 10 ** (length - 1)
  const code = Math.floor(Math.random() * (max - min) + min).toString()
  const expiresAt = new Date(Date.now() + DEFAULT_EXPIRY_MINUTES * 60 * 1000)

  return { code, expiresAt }
}