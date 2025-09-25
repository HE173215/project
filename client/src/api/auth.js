import api, { setAuthToken } from "./client"

export const registerUser = async (payload) => {
  const { data } = await api.post("/auth/register", payload)
  return data
}

export const loginUser = async (payload) => {
  const { data } = await api.post("/auth/login", payload)
  return data
}

export const verifyOtp = async (payload) => {
  const { data } = await api.post("/auth/verify-otp", payload)
  return data
}

export const resendOtp = async (payload) => {
  const { data } = await api.post("/auth/resend-otp", payload)
  return data
}

export const requestPasswordReset = async (payload) => {
  const { data } = await api.post("/auth/forgot-password", payload)
  return data
}

export const resetPassword = async (payload) => {
  const { data } = await api.post("/auth/reset-password", payload)
  return data
}

export const updateProfile = async (payload) => {
  const { data } = await api.put("/auth/profile", payload)
  return data
}

export const fetchProfile = async () => {
  const { data } = await api.get("/auth/me")
  return data
}

export const applyAuthToken = (token) => {
  setAuthToken(token)
}