import api from "./client"

export const listDepartments = async (params = {}) => {
  const response = await api.get("/departments", { params })
  return response.data
}

export const getDepartment = async (id, params = {}) => {
  const response = await api.get(`/departments/${id}`, { params })
  return response.data
}

export const createDepartment = async (payload) => {
  const response = await api.post("/departments", payload)
  return response.data
}

export const updateDepartment = async (id, payload) => {
  const response = await api.put(`/departments/${id}`, payload)
  return response.data
}

export const deleteDepartment = async (id) => {
  const response = await api.delete(`/departments/${id}`)
  return response.data
}

export default {
  listDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
}
