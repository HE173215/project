import api from "./client"

export const listUsers = async (params = {}) => {
  const response = await api.get("/auth/users", { params })
  return response.data
}

export default {
  listUsers,
}
