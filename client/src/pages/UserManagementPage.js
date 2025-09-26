import { useEffect, useState } from "react"
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  App,
} from "antd"
import { useUserContext } from "../context/UserContext"

const ROLE_OPTIONS = [
  { label: "Admin", value: "admin" },
  { label: "Accountant", value: "accountant" },
  { label: "Manager", value: "manager" },
  { label: "Employee", value: "employee" },
  { label: "Learner", value: "learn" },
]

const roleLabel = (role) => {
  switch (role) {
    case "admin":
      return "Admin"
    case "accountant":
      return "Accountant"
    case "manager":
      return "Manager"
    case "employee":
    case "user":
      return "Employee"
    case "learn":
      return "Learner"
    default:
      return role
  }
}

const UserManagementPage = () => {
  const {
    isAdmin,
    users,
    loadingUsers,
    roleUpdating,
    assignRoles,
    profile,
    profileLoading,
    profileSaving,
    saveProfile,
    allowSelfService,
  } = useUserContext()

  const { message } = App.useApp()

  const [roleModalVisible, setRoleModalVisible] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedRoles, setSelectedRoles] = useState([])

  const [profileForm] = Form.useForm()

  useEffect(() => {
    if (!isAdmin && allowSelfService) {
      if (profile) {
        profileForm.setFieldsValue({
          fullName: profile.fullName || "",
          phoneNumber: profile.phoneNumber || "",
          address: profile.address || "",
          bio: profile.bio || "",
        })
      } else {
        profileForm.resetFields()
      }
    }
  }, [isAdmin, allowSelfService, profile, profileForm])

  const openRoleModal = (record) => {
    setSelectedUser(record)
    setSelectedRoles(record.roles || [])
    setRoleModalVisible(true)
  }

  const closeRoleModal = () => {
    setRoleModalVisible(false)
    setSelectedUser(null)
    setSelectedRoles([])
  }

  const handleUpdateRoles = async () => {
    if (!selectedUser) {
      return
    }

    if (!selectedRoles.length) {
      message.error("Please choose at least one role")
      return
    }

    const updated = await assignRoles(selectedUser.id, selectedRoles)
    if (updated) {
      closeRoleModal()
    }
  }

  const handleSaveProfile = async (values) => {
    await saveProfile(values)
  }

  const columns = [
    {
      title: "Name",
      dataIndex: "fullName",
      key: "fullName",
      render: (value, record) => value || record.email,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Roles",
      dataIndex: "roles",
      key: "roles",
      render: (roles = []) =>
        roles.map((role) => (
          <Tag key={role} color={role === "admin" ? "red" : role === "manager" ? "blue" : "geekblue"}>
            {roleLabel(role)}
          </Tag>
        )),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button type="link" onClick={() => openRoleModal(record)}>
          Edit roles
        </Button>
      ),
    },
  ]

  return (
    <Card style={{ width: "100%" }}>
      {isAdmin ? (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Typography.Title level={4} style={{ marginBottom: 0 }}>
              User management
            </Typography.Title>
            <Typography.Text type="secondary">
              Assign administrator, manager, accountant, employee, or learner roles. Only admins can see this list.
            </Typography.Text>
          </div>

          <Table
            rowKey="id"
            columns={columns}
            dataSource={users}
            loading={loadingUsers}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            locale={{ emptyText: "No users found" }}
          />

          <Modal
            title={selectedUser ? `Edit roles - ${selectedUser.fullName || selectedUser.email}` : "Edit roles"}
            open={roleModalVisible}
            onOk={handleUpdateRoles}
            onCancel={closeRoleModal}
            confirmLoading={roleUpdating}
            destroyOnHidden
          >
            <Select
              mode="multiple"
              value={selectedRoles}
              onChange={setSelectedRoles}
              options={ROLE_OPTIONS}
              style={{ width: "100%" }}
              placeholder="Choose roles"
            />
          </Modal>
        </Space>
      ) : allowSelfService ? (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Typography.Title level={4} style={{ marginBottom: 0 }}>
              Your profile
            </Typography.Title>
            <Typography.Text type="secondary">
              Update your contact details. Role assignments are managed by administrators.
            </Typography.Text>
          </div>

          <Form
            layout="vertical"
            form={profileForm}
            onFinish={handleSaveProfile}
            requiredMark={false}
            style={{ maxWidth: 480 }}
            initialValues={{}}
            disabled={profileLoading}
          >
            <Form.Item
              label="Full name"
              name="fullName"
              rules={[{ required: true, message: "Please enter your name" }]}
            >
              <Input placeholder="Full name" />
            </Form.Item>
            <Form.Item label="Phone number" name="phoneNumber">
              <Input placeholder="Phone number" />
            </Form.Item>
            <Form.Item label="Address" name="address">
              <Input placeholder="Address" />
            </Form.Item>
            <Form.Item label="Bio" name="bio">
              <Input.TextArea rows={4} placeholder="Short introduction" />
            </Form.Item>
            <Space style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button type="primary" htmlType="submit" loading={profileSaving} disabled={profileLoading}>
                Save changes
              </Button>
            </Space>
          </Form>
        </Space>
      ) : (
        <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
          You do not have access to any user management actions.
        </Typography.Paragraph>
      )}
    </Card>
  )
}

export default UserManagementPage
