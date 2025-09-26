import api from "./client"

export const listUsers = async (params = {}) => {
  const response = await api.get("/auth/users", { params })
  return response.data
}

export const updateUserRoles = async (id, roles) => {
  const response = await api.put(`/auth/users/${id}/roles`, { roles })
  return response.data
}

export default {
  listUsers,
  updateUserRoles,
}
