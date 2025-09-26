import { useEffect, useMemo, useState } from "react"
import {
  Alert,
  Button,
  Card,
  Divider,
  Form,
  Input,
  List,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  App,
} from "antd"
import { PlusOutlined } from "@ant-design/icons"
import { useDepartmentContext } from "../context/DepartmentContext"
import { useAuthContext } from "../context/AuthContext"

const { Title, Text } = Typography

const mapUserLabel = (user) =>
  user.fullName ? `${user.fullName}${user.email ? ` (${user.email})` : ""}` : user.email

const DepartmentPage = () => {
  const { message } = App.useApp()
  const { user: currentUser } = useAuthContext()

  const normalizedRoles = useMemo(
    () => (currentUser?.roles || []).map((role) => (role === "user" ? "employee" : role)),
    [currentUser],
  )
  const isAdmin = normalizedRoles.includes("admin")
  const isManager = normalizedRoles.includes("manager")

  const {
    departments,
    users,
    loadingDepartments,
    loadingUsers,
    addDepartment,
    editDepartment,
    removeDepartment,
    getDescendantIds,
  } = useDepartmentContext()

  const [selectedDepartmentId, setSelectedDepartmentId] = useState(null)
  const [memberSelection, setMemberSelection] = useState([])
  const [createForm] = Form.useForm()
  const [detailForm] = Form.useForm()

  const visibleDepartments = useMemo(() => {
    if (isAdmin) {
      return departments
    }
    if (isManager) {
      return departments.filter((dept) => dept.manager?.id === currentUser?.id)
    }
    return []
  }, [departments, isAdmin, isManager, currentUser?.id])

  useEffect(() => {
    if (!visibleDepartments.some((dept) => dept.id === selectedDepartmentId)) {
      setSelectedDepartmentId(null)
    }
  }, [visibleDepartments, selectedDepartmentId])

  useEffect(() => {
    setMemberSelection([])
  }, [selectedDepartmentId])

  const selectedDepartment = useMemo(
    () => visibleDepartments.find((dept) => dept.id === selectedDepartmentId) || null,
    [visibleDepartments, selectedDepartmentId],
  )

  useEffect(() => {
    if (selectedDepartment) {
      detailForm.setFieldsValue({
        code: selectedDepartment.code,
        name: selectedDepartment.name,
        description: selectedDepartment.description,
        parentId: selectedDepartment.parentId?.id || null,
        managerId: selectedDepartment.manager?.id || null,
        isActive: selectedDepartment.isActive,
      })
    } else {
      detailForm.resetFields()
    }
  }, [selectedDepartment, detailForm])

  const canManage = isAdmin || isManager
  const canEditDetails = isAdmin
  const canEditMembers = selectedDepartment && (isAdmin || selectedDepartment.manager?.id === currentUser?.id)

  const managerOptions = useMemo(
    () => users.map((user) => ({ label: mapUserLabel(user), value: user.id })),
    [users],
  )

  const availableMembers = useMemo(() => {
    if (!selectedDepartment) {
      return []
    }
    const currentIds = new Set((selectedDepartment.users || []).map((user) => user.id))
    return users
      .filter((user) => !currentIds.has(user.id))
      .map((user) => ({ label: mapUserLabel(user), value: user.id }))
  }, [users, selectedDepartment])

  const parentOptions = useMemo(() => {
    const sourceDepartments = isAdmin ? departments : visibleDepartments

    if (!selectedDepartment) {
      return sourceDepartments.map((dept) => ({ label: `${dept.name} (${dept.code})`, value: dept.id }))
    }

    const blockedIds = new Set([
      selectedDepartment.id,
      ...getDescendantIds(selectedDepartment.id, sourceDepartments),
    ])

    return sourceDepartments
      .filter((dept) => !blockedIds.has(dept.id))
      .map((dept) => ({ label: `${dept.name} (${dept.code})`, value: dept.id }))
  }, [selectedDepartment, departments, getDescendantIds])

  const handleCreate = async (values) => {
    try {
      await addDepartment({
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        description: values.description?.trim() || "",
        parentId: values.parentId || null,
        manager: values.managerId || null,
        isActive: values.isActive,
      })
      createForm.resetFields()
      createForm.setFieldsValue({ isActive: true })
    } catch (error) {
      if (error?.message) {
        message.error(error.message)
      }
    }
  }

  const handleSaveDetails = async (values) => {
    if (!selectedDepartment || !canEditDetails) {
      return
    }

    try {
      await editDepartment(selectedDepartment.id, {
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        description: values.description?.trim() || "",
        parentId: values.parentId || null,
        manager: values.managerId || null,
        isActive: values.isActive,
      })
    } catch (error) {
      if (error?.message) {
        message.error(error.message)
      }
    }
  }

  const handleDeleteDepartment = async (deptId) => {
    try {
      await removeDepartment(deptId)
      if (selectedDepartmentId === deptId) {
        setSelectedDepartmentId(null)
      }
    } catch (error) {
      if (error?.message) {
        message.error(error.message)
      }
    }
  }

  const handleAddMembers = async (memberIds) => {
    if (!selectedDepartment || !canEditMembers || !memberIds.length) {
      return
    }

    const currentIds = new Set((selectedDepartment.users || []).map((user) => user.id))
    const mergedIds = Array.from(new Set([...currentIds, ...memberIds]))

    try {
      await editDepartment(selectedDepartment.id, { users: mergedIds })
    } catch (error) {
      if (error?.message) {
        message.error(error.message)
      }
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (!selectedDepartment || !canEditMembers) {
      return
    }

    const remaining = (selectedDepartment.users || [])
      .filter((member) => member.id !== memberId)
      .map((member) => member.id)

    try {
      await editDepartment(selectedDepartment.id, { users: remaining })
    } catch (error) {
      if (error?.message) {
        message.error(error.message)
      }
    }
  }

  const columns = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "Department",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (value) => <Tag color={value ? "green" : "red"}>{value ? "Active" : "Inactive"}</Tag>,
    },
    {
      title: "Manager",
      dataIndex: ["manager", "fullName"],
      key: "manager",
      render: (_, record) => record.manager?.fullName || record.manager?.email || "ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => setSelectedDepartmentId(record.id)}>
            View details
          </Button>
          {isAdmin && (
            <Popconfirm
              title="Delete department"
              description={`Are you sure you want to delete ${record.name}?`}
              okText="Delete"
              cancelText="Cancel"
              onConfirm={() => handleDeleteDepartment(record.id)}
            >
              <Button type="link" danger>
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <Card style={{ width: "100%" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Title level={4} style={{ marginBottom: 0 }}>
            Department management
          </Title>
          <Text type="secondary">
            {isAdmin
              ? "Manage departments, assign managers, and curate department teams."
              : isManager
              ? "Review the departments you manage and keep their member lists up to date."
              : "Your role does not grant access to department management."}
          </Text>
        </div>

        {isAdmin && (
          <Card type="inner" title="Create department">
            <Form
              layout="vertical"
              form={createForm}
              onFinish={handleCreate}
              initialValues={{ isActive: true }}
            >
              <Space align="start" wrap style={{ width: "100%" }}>
                <Form.Item
                  label="Code"
                  name="code"
                  rules={[
                    { required: true, message: "Please enter a department code" },
                    {
                      pattern: /^[A-Z0-9_-]{2,10}$/,
                      message: "Use 2-10 uppercase letters, numbers, hyphen, or underscore",
                    },
                  ]}
                >
                  <Input placeholder="IT01" maxLength={10} />
                </Form.Item>
                <Form.Item
                  label="Name"
                  name="name"
                  rules={[{ required: true, message: "Please enter a department name" }]}
                >
                  <Input placeholder="Technology" />
                </Form.Item>
                <Form.Item label="Manager" name="managerId" style={{ minWidth: 220 }}>
                  <Select
                    allowClear
                    placeholder="Assign manager"
                    loading={loadingUsers}
                    options={managerOptions}
                  />
                </Form.Item>
                <Form.Item label="Parent department" name="parentId" style={{ minWidth: 220 }}>
                  <Select allowClear placeholder="Select parent" options={parentOptions} />
                </Form.Item>
                <Form.Item label="Active" name="isActive" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Space>
              <Form.Item label="Description" name="description">
                <Input.TextArea rows={3} placeholder="Describe the department's responsibilities" />
              </Form.Item>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                Add department
              </Button>
            </Form>
          </Card>
        )}

        {canManage ? (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={visibleDepartments}
            loading={loadingDepartments}
            pagination={{ pageSize: 10, showSizeChanger: false, hideOnSinglePage: true }}
            locale={{ emptyText: "No departments available" }}
            rowSelection={{
              type: "radio",
              selectedRowKeys: selectedDepartmentId ? [selectedDepartmentId] : [],
              onChange: (keys) => setSelectedDepartmentId(keys[0]),
            }}
            onRow={(record) => ({ onClick: () => setSelectedDepartmentId(record.id) })}
          />
        ) : (
          <Alert message="No departments available for your role" type="info" showIcon />
        )}

        {selectedDepartment && (
          <Card type="inner" title={`Department details ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ ${selectedDepartment.name}`}>
            <Form
              layout="vertical"
              form={detailForm}
              onFinish={handleSaveDetails}
              disabled={!canEditDetails}
            >
              <Space align="start" wrap style={{ width: "100%" }}>
                <Form.Item
                  label="Code"
                  name="code"
                  rules={[
                    { required: true, message: "Please enter a department code" },
                    {
                      pattern: /^[A-Z0-9_-]{2,10}$/,
                      message: "Use 2-10 uppercase letters, numbers, hyphen, or underscore",
                    },
                  ]}
                >
                  <Input placeholder="IT01" maxLength={10} />
                </Form.Item>
                <Form.Item
                  label="Name"
                  name="name"
                  rules={[{ required: true, message: "Please enter a department name" }]}
                >
                  <Input placeholder="Technology" />
                </Form.Item>
                <Form.Item label="Manager" name="managerId" style={{ minWidth: 220 }}>
                  <Select
                    allowClear
                    placeholder="Assign manager"
                    loading={loadingUsers}
                    options={managerOptions}
                  />
                </Form.Item>
                <Form.Item label="Parent department" name="parentId" style={{ minWidth: 220 }}>
                  <Select allowClear placeholder="Select parent" options={parentOptions} />
                </Form.Item>
                <Form.Item label="Active" name="isActive" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Space>
              <Form.Item label="Description" name="description">
                <Input.TextArea rows={4} placeholder="Department overview" />
              </Form.Item>
              {canEditDetails && (
                <Button type="primary" htmlType="submit">
                  Save changes
                </Button>
              )}
            </Form>

            <Divider />

            <Title level={5}>Team members</Title>
            <Text type="secondary">
              {selectedDepartment.manager
                ? `Manager: ${selectedDepartment.manager.fullName || selectedDepartment.manager.email}`
                : "No manager assigned"}
            </Text>

            {canEditMembers && (
              <Space direction="vertical" style={{ width: "100%", maxWidth: 420 }} size="small">
                <Select
                  mode="multiple"
                  placeholder="Select members to add"
                  options={availableMembers}
                  value={memberSelection}
                  onChange={setMemberSelection}
                  loading={loadingUsers}
                  style={{ width: "100%" }}
                />
                <Button
                  type="primary"
                  onClick={async () => {
                    if (!memberSelection.length) {
                      message.warning("Choose at least one member to add")
                      return
                    }
                    await handleAddMembers(memberSelection)
                    setMemberSelection([])
                  }}
                >
                  Add members
                </Button>
              </Space>
            )}

            <List
              style={{ marginTop: 16 }}
              bordered
              dataSource={selectedDepartment.users || []}
              locale={{ emptyText: "No members assigned" }}
              renderItem={(member) => (
                <List.Item
                  actions={
                    canEditMembers
                      ? [
                          <Button
                            key="remove"
                            type="link"
                            danger
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            Remove
                          </Button>,
                        ]
                      : undefined
                  }
                >
                  <Space direction="vertical" size={0}>
                    <Text strong>{member.fullName || member.email}</Text>
                    {member.email && <Text type="secondary">{member.email}</Text>}
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        )}
      </Space>
    </Card>
  )
}

export default DepartmentPage




