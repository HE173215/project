import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { App } from "antd"
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
} from "../api/departments"
import { listUsers } from "../api/users"
import { useAuthContext } from "./AuthContext"

const DepartmentContext = createContext(null)

export const DepartmentProvider = ({ children }) => {
  const { message } = App.useApp()
  const { user } = useAuthContext()

  const roles = user?.roles || []
  const canManageDepartments = roles.includes("admin") || roles.includes("manager")

  const [departments, setDepartments] = useState([])
  const [users, setUsers] = useState([])
  const [loadingDepartments, setLoadingDepartments] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)

  const ensureCanManage = () => {
    if (!canManageDepartments) {
      throw new Error("You do not have permission to manage departments")
    }
  }

  const getDescendantIds = useCallback((id, depts) => {
    const children = depts.filter((d) => d.parentId?.id === id)
    let ids = children.map((c) => c.id)
    for (const child of children) {
      ids = ids.concat(getDescendantIds(child.id, depts))
    }
    return ids
  }, [])

  const fetchDepartments = useCallback(async () => {
    setLoadingDepartments(true)
    try {
      const data = await listDepartments({ includeUsers: true })
      setDepartments(data.items || [])
    } catch (error) {
      const msg = error?.response?.data?.message || "Unable to load departments"
      message.error(msg)
    } finally {
      setLoadingDepartments(false)
    }
  }, [message])

  const fetchUsers = useCallback(async () => {
    if (!canManageDepartments) {
      setUsers([])
      setLoadingUsers(false)
      return
    }

    setLoadingUsers(true)
    try {
      const data = await listUsers({ includeInactive: false })
      setUsers(data.items || [])
    } catch (error) {
      const msg = error?.response?.data?.message || "Unable to load users"
      message.error(msg)
    } finally {
      setLoadingUsers(false)
    }
  }, [canManageDepartments, message])

  const addDepartment = async (payload) => {
    ensureCanManage()
    await createDepartment(payload)
    message.success("Department created")
    fetchDepartments()
  }

  const editDepartment = async (id, payload) => {
    ensureCanManage()

    const blockedIds = [id, ...getDescendantIds(id, departments)]
    if (payload.parentId && blockedIds.includes(payload.parentId)) {
      throw new Error("Invalid parent: cannot select self or child as parent")
    }

    await updateDepartment(id, payload)
    message.success("Department updated")
    fetchDepartments()
  }

  const removeDepartment = async (id) => {
    ensureCanManage()
    await deleteDepartment(id)
    message.success("Department deleted")
    fetchDepartments()
  }

  useEffect(() => {
    fetchDepartments()
    fetchUsers()
  }, [fetchDepartments, fetchUsers])

  return (
    <DepartmentContext.Provider
      value={{
        departments,
        users,
        loadingDepartments,
        loadingUsers,
        canManageDepartments,
        fetchDepartments,
        fetchUsers,
        addDepartment,
        editDepartment,
        removeDepartment,
        getDescendantIds,
      }}
    >
      {children}
    </DepartmentContext.Provider>
  )
}

export const useDepartmentContext = () => useContext(DepartmentContext)
