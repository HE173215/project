const resolveId = (user) => {
  if (!user) {
    return undefined
  }

  if (typeof user.id === "string") {
    return user.id
  }

  if (user._id) {
    return user._id.toString()
  }

  return undefined
}

// Chuan hoa du lieu user truoc khi tra ve client
module.exports = (user) => {
  if (!user) {
    return null
  }

  return {
    id: resolveId(user),
    email: user.email,
    fullName: user.fullName,
    phoneNumber: user.phoneNumber,
    dateOfBirth: user.dateOfBirth,
    address: user.address,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    roles: user.roles,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}