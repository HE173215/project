import { useMemo, useState } from "react"
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  App,
} from "antd"
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons"
import { useDepartmentContext } from "../context/DepartmentContext"

const { Title, Text } = Typography

const DepartmentPage = () => {
  const {
    departments,
    users,
    loadingDepartments,
    loadingUsers,
    canManageDepartments,
    addDepartment,
    editDepartment,
    removeDepartment,
    getDescendantIds,
  } = useDepartmentContext()
  const { message } = App.useApp()

  const [submitting, setSubmitting] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [form] = Form.useForm()

  const ensureManagePermission = () => {
    if (!canManageDepartments) {
      message.warning("You only have permission to view departments")
      return false
    }
    return true
  }

  const openCreateModal = () => {
    if (!ensureManagePermission()) {
      return
    }
    setEditingDepartment(null)
    form.resetFields()
    setModalVisible(true)
  }

  const openEditModal = (department) => {
    if (!ensureManagePermission()) {
      return
    }
    setEditingDepartment(department)
    form.setFieldsValue({
      code: department.code,
      name: department.name,
      description: department.description,
      isActive: department.isActive,
      parentId: department.parentId?.id || null,
      managerId: department.manager?.id || null,
    })
    setModalVisible(true)
  }

  const closeModal = () => {
    setModalVisible(false)
    setEditingDepartment(null)
    form.resetFields()
  }

  const handleSubmit = async () => {
    if (!canManageDepartments) {
      message.error("You do not have permission to manage departments")
      return
    }

    try {
      const values = await form.validateFields()

      const payload = {
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        description: values.description?.trim() || "",
        isActive: values.isActive,
        parentId: values.parentId || null,
        manager: values.managerId || null,
      }

      if (editingDepartment) {
        const blockedIds = [
          editingDepartment.id,
          ...getDescendantIds(editingDepartment.id, departments),
        ]

        if (payload.parentId && blockedIds.includes(payload.parentId)) {
          message.error("Cannot assign a child department as parent")
          return
        }
      }

      setSubmitting(true)

      if (editingDepartment) {
        await editDepartment(editingDepartment.id, payload)
      } else {
        await addDepartment(payload)
      }

      closeModal()
    } catch (error) {
      if (error?.errorFields) {
        return
      }

      if (error?.message) {
        message.error(error.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (departmentId) => {
    if (!canManageDepartments) {
      message.error("You do not have permission to manage departments")
      return
    }

    setDeletingId(departmentId)
    try {
      await removeDepartment(departmentId)
    } finally {
      setDeletingId(null)
    }
  }

  const parentOptions = useMemo(() => {
    if (!departments?.length) {
      return []
    }

    if (!editingDepartment) {
      return departments.map((dept) => ({
        label: `${dept.name} (${dept.code})`,
        value: dept.id,
      }))
    }

    const blockedIds = new Set([
      editingDepartment.id,
      ...getDescendantIds(editingDepartment.id, departments),
    ])

    return departments
      .filter((dept) => !blockedIds.has(dept.id))
      .map((dept) => ({
        label: `${dept.name} (${dept.code})`,
        value: dept.id,
      }))
  }, [departments, editingDepartment, getDescendantIds])

  const managerOptions = useMemo(() => {
    if (!users?.length) {
      return []
    }

    return users.map((user) => ({
      value: user.id,
      label: user.fullName
        ? `${user.fullName}${user.email ? ` (${user.email})` : ""}`
        : user.email || user.id,
    }))
  }, [users])

  const baseColumns = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "Department",
      dataIndex: "name",
      key: "name",
      render: (value, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{value}</Text>
          {record.description ? (
            <Text type="secondary" style={{ maxWidth: 360 }}>
              {record.description}
            </Text>
          ) : null}
        </Space>
      ),
    },
    {
      title: "Manager",
      dataIndex: ["manager", "fullName"],
      key: "manager",
      render: (_, record) => {
        if (!record.manager) {
          return "-"
        }

        return record.manager.fullName || record.manager.email || "-"
      },
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (value) => (
        <Tag color={value ? "green" : "red"}>{value ? "Active" : "Inactive"}</Tag>
      ),
    },
    {
      title: "Parent",
      dataIndex: ["parentId", "name"],
      key: "parentId",
      render: (_, record) =>
        record.parentId ? `${record.parentId.name} (${record.parentId.code})` : "-",
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value) => (value ? new Date(value).toLocaleString() : "-"),
    },
  ]

  const columns = canManageDepartments
    ? [
        ...baseColumns,
        {
          title: "Actions",
          key: "actions",
          render: (_, record) => (
            <Space>
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => openEditModal(record)}
              >
                Edit
              </Button>
              <Popconfirm
                title="Delete department"
                description={`Are you sure you want to remove ${record.name}?`}
                okText="Delete"
                cancelText="Cancel"
                onConfirm={() => handleDelete(record.id)}
              >
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  loading={deletingId === record.id}
                >
                  Delete
                </Button>
              </Popconfirm>
            </Space>
          ),
        },
      ]
    : baseColumns

  return (
    <Card style={{ width: "100%" }}>
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
          <div>
            <Title level={4} style={{ marginBottom: 0 }}>
              Department management
            </Title>
            <Text type="secondary">
              Create, update, and organise your departments.
              {!canManageDepartments && " You currently have read-only access."}
            </Text>
          </div>
          {canManageDepartments && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              Add department
            </Button>
          )}
        </Space>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={departments}
          loading={loadingDepartments}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            hideOnSinglePage: true,
          }}
          locale={{ emptyText: "No departments yet" }}
        />
      </Space>

      {canManageDepartments && (
        <Modal
          title={editingDepartment ? "Edit department" : "Add department"}
          open={modalVisible}
          onOk={handleSubmit}
          confirmLoading={submitting}
          onCancel={closeModal}
          okText={editingDepartment ? "Save" : "Create"}
          cancelText="Cancel"
          destroyOnClose
        >
          <Form layout="vertical" form={form} initialValues={{ isActive: true }}>
            <Form.Item
              label="Department code"
              name="code"
              rules={[
                { required: true, message: "Please enter a code" },
                {
                  pattern: /^[A-Z0-9_-]{2,10}$/,
                  message: "Use 2-10 uppercase letters, numbers, hyphen, or underscore",
                },
              ]}
            >
              <Input placeholder="e.g. IT01" maxLength={10} />
            </Form.Item>

            <Form.Item
              label="Department name"
              name="name"
              rules={[{ required: true, message: "Please enter a name" }]}
            >
              <Input placeholder="e.g. Technology" />
            </Form.Item>

            <Form.Item label="Description" name="description">
              <Input.TextArea
                placeholder="Short summary of the department's responsibilities"
                autoSize={{ minRows: 3, maxRows: 5 }}
                maxLength={500}
                showCount
              />
            </Form.Item>

            <Form.Item label="Parent department" name="parentId">
              <Select
                placeholder="Select a parent department"
                allowClear
                showSearch
                optionFilterProp="label"
                options={parentOptions}
              />
            </Form.Item>

            <Form.Item label="Manager" name="managerId">
              <Select
                placeholder="Choose a manager"
                allowClear
                showSearch
                optionFilterProp="label"
                options={managerOptions}
                loading={loadingUsers}
              />
            </Form.Item>

            <Form.Item label="Status" name="isActive" valuePropName="checked">
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
          </Form>
        </Modal>
      )}
    </Card>
  )
}

export default DepartmentPage
