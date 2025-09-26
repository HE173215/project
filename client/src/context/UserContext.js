import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { App } from "antd"
import { listUsers, updateUserRoles } from "../api/users"
import { fetchProfile, updateProfile } from "../api/auth"
import { useAuthContext } from "./AuthContext"

const FRIENDLY_ROLE_MAP = {
  user: "employee",
}

const ALLOWED_ROLES = ["admin", "manager", "accountant", "employee", "learn", "user"]

const UserContext = createContext(null)

export const UserProvider = ({ children }) => {
  const { message } = App.useApp()
  const { user: authUser, setAuthState, token } = useAuthContext()

  const normalizeRoles = useCallback((roles = []) => {
    return roles
      .map((role) => {
        const normalized = String(role || "").toLowerCase().trim()
        return FRIENDLY_ROLE_MAP[normalized] || normalized
      })
      .filter(Boolean)
      .filter((role, index, arr) => arr.indexOf(role) === index)
  }, [])

  const authRoles = useMemo(() => normalizeRoles(authUser?.roles || []), [authUser, normalizeRoles])
  const isAdmin = authRoles.includes("admin")
  const isSelfServiceRole = authRoles.some((role) => ["accountant", "employee", "learn", "manager"].includes(role))

  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [roleUpdating, setRoleUpdating] = useState(false)

  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) {
      setUsers([])
      return
    }

    setLoadingUsers(true)
    try {
      const data = await listUsers()
      setUsers((data.items || []).map((user) => ({
        ...user,
        roles: normalizeRoles(user.roles),
      })))
    } catch (error) {
      const text = error?.response?.data?.message || "Unable to load users"
      message.error(text)
    } finally {
      setLoadingUsers(false)
    }
  }, [isAdmin, message, normalizeRoles])

  const fetchOwnProfile = useCallback(async () => {
    setProfileLoading(true)
    try {
      const data = await fetchProfile()
      setProfile(data.user || null)
    } catch (error) {
      const text = error?.response?.data?.message || "Unable to load profile"
      message.error(text)
    } finally {
      setProfileLoading(false)
    }
  }, [message])

  const assignRoles = useCallback(async (userId, roles) => {
    const normalized = normalizeRoles(roles)
    if (!normalized.length) {
      message.error("Please choose at least one role")
      return null
    }
    const invalidRole = normalized.find((role) => !ALLOWED_ROLES.includes(role))
    if (invalidRole) {
      message.error(`Invalid role: ${invalidRole}`)
      return null
    }

    setRoleUpdating(true)
    try {
      const data = await updateUserRoles(userId, normalized)
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...data.user, roles: normalizeRoles(data.user.roles) } : user,
        ),
      )
      message.success("Roles updated successfully")
      return data.user
    } catch (error) {
      const text = error?.response?.data?.message || "Failed to update roles"
      message.error(text)
      return null
    } finally {
      setRoleUpdating(false)
    }
  }, [message, normalizeRoles])

  const saveProfile = useCallback(async (values) => {
    setProfileSaving(true)
    try {
      const data = await updateProfile(values)
      setProfile(data.user || null)
      setAuthState({ nextUser: data.user, nextToken: token })
      message.success(data.message || "Profile updated")
      return data.user
    } catch (error) {
      const text = error?.response?.data?.message || "Failed to update profile"
      message.error(text)
      return null
    } finally {
      setProfileSaving(false)
    }
  }, [message, setAuthState, token])

  useEffect(() => {
    if (isAdmin) {
      setProfile(null)
      fetchUsers()
    } else if (isSelfServiceRole) {
      setUsers([])
      fetchOwnProfile()
    } else {
      setUsers([])
      setProfile(null)
    }
  }, [isAdmin, isSelfServiceRole, fetchUsers, fetchOwnProfile])

  const value = {
    isAdmin,
    users,
    loadingUsers,
    roleUpdating,
    assignRoles,
    refreshUsers: fetchUsers,
    profile,
    profileLoading,
    profileSaving,
    saveProfile,
    refreshProfile: fetchOwnProfile,
    allowSelfService: isSelfServiceRole,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export const useUserContext = () => {
  const ctx = useContext(UserContext)
  if (!ctx) {
    throw new Error("useUserContext must be used within UserProvider")
  }
  return ctx
}
