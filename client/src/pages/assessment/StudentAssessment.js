import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Tabs,
  Table,
  Button,
  Space,
  Modal,
  Form,
  message,
  Spin,
  Tag,
  Drawer,
  Upload,
  Divider,
  Row,
  Col,
  Tooltip,
  Empty,
  Progress,
  Select,
} from 'antd';
import {
  UploadOutlined,
  FileOutlined,
  EyeOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CheckOutlined,
  AlertOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import fileService from '../../services/fileService';

const StudentAssessment = () => {
  const navigate = useNavigate();
  const { user, api } = useAuth();

  // ========== STATES ==========
  const [assessments, setAssessments] = useState([]);
  const [pendingAssessments, setPendingAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Modal states
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  // Form states
  const [submitForm] = Form.useForm();
  const [fileList, setFileList] = useState([]);

  // Filter & Sort
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    sortBy: 'deadline',
  });

  // ========== PERMISSION CHECK ==========
  useEffect(() => {
    if (!user || user.role !== 'student') {
      message.error('Bạn không có quyền truy cập trang này');
      navigate('/');
      return;
    }
    loadAssessments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ========== LOAD DATA ==========
  const loadAssessments = useCallback(async () => {
    try {
      setLoading(true);

      // Load all assessments with filters
      const params = {};
      if (filters.status !== 'all') params.status = filters.status;
      if (filters.type !== 'all') params.type = filters.type;
      params.sortBy = filters.sortBy;
      params.sortOrder = 'asc';
      params.page = 1;
      params.limit = 50;

      const response = await api.get('/assessments/my-assessments', { params });
      setAssessments(response.data.data || []);

      // Load pending assessments
      const pendingResponse = await api.get('/assessments/my-pending');
      setPendingAssessments(pendingResponse.data.data || []);
    } catch (error) {
      console.error('❌ Lỗi tải bài tập:', error);
      message.error('Không thể tải danh sách bài tập');
    } finally {
      setLoading(false);
    }
  }, [filters, api]);

  useEffect(() => {
    if (user) {
      loadAssessments();
    }
  }, [filters, user, loadAssessments]);

  // ========== SUBMIT ASSESSMENT ==========
  const handleSubmitAssessment = async (values) => {
    if (fileList.length === 0) {
      message.error('Vui lòng upload ít nhất một file');
      return;
    }

    try {
      setLoading(true);

      // Extract actual files from fileList
      const files = fileList
        .map((file) => file.originFileObj)
        .filter((file) => file instanceof File);

      if (files.length === 0) {
        message.error('Không tìm thấy file hợp lệ');
        return;
      }

      // Upload files to Cloudinary via backend API
      const uploadedFiles = await fileService.uploadFiles(files, (percent) => {
        console.log(`Uploading: ${percent}%`);
      });

      if (!uploadedFiles || uploadedFiles.length === 0) {
        message.error('Không thể upload file');
        return;
      }

      // Submit assessment with uploaded file metadata
      await api.patch(`/assessments/${selectedAssessment._id}/submit`, {
        attachments: uploadedFiles,
      });

      message.success('Nộp bài tập thành công');
      submitForm.resetFields();
      setFileList([]);
      setSubmitModalVisible(false);
      loadAssessments();
    } catch (error) {
      console.error('❌ Lỗi nộp bài:', error);
      message.error(error.response?.data?.message || error.message || 'Lỗi nộp bài tập');
    } finally {
      setLoading(false);
    }
  };

  // ========== GET STATUS BADGE ==========
  const getStatusBadge = (status, isLate) => {
    const statusConfig = {
      Pending: { color: 'default', icon: <ClockCircleOutlined /> },
      Submitted: { color: 'processing', icon: <CheckOutlined /> },
      Graded: { color: 'success', icon: <CheckCircleOutlined /> },
      Late: { color: 'red', icon: <AlertOutlined /> },
    };

    const config = statusConfig[status] || statusConfig.Pending;
    return <Tag icon={config.icon} color={config.color}>{status}</Tag>;
  };

  // ========== GET DEADLINE STATUS ==========
  const getDeadlineStatus = (deadline) => {
    if (!deadline) return { text: 'Không có deadline', status: 'normal' };

    const now = moment();
    const deadlineTime = moment(deadline);
    const diff = deadlineTime.diff(now, 'hours');

    if (diff < 0) {
      return { text: 'Đã quá hạn', status: 'error' };
    } else if (diff < 24) {
      return { text: `Sắp hết hạn (${Math.round(diff)}h)`, status: 'warning' };
    } else {
      return { text: deadlineTime.format('DD/MM HH:mm'), status: 'normal' };
    }
  };

  // ========== TABLE COLUMNS ==========
  const assessmentColumns = [
    {
      title: 'Bài Tập',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (text, record) => (
        <div>
          <strong>{text}</strong>
          <br />
          <span style={{ fontSize: 12, color: '#666' }}>
            {record.enrollment?.class?.title}
          </span>
        </div>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => {
        const colors = {
          Assignment: 'blue',
          Quiz: 'green',
          Project: 'orange',
          Midterm: 'red',
          Final: 'purple',
          Presentation: 'cyan',
        };
        return <Tag color={colors[type]}>{type}</Tag>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status, record) => getStatusBadge(status, record.isLate),
    },
    {
      title: 'Deadline',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 150,
      render: (deadline) => {
        const deadlineStatus = getDeadlineStatus(deadline);
        return (
          <span style={{ color: deadlineStatus.status === 'error' ? 'red' : 'inherit' }}>
            {deadlineStatus.text}
          </span>
        );
      },
    },
    {
      title: 'Điểm',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      render: (score) => (score !== undefined ? `${score}/100` : '-'),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="primary"
              ghost
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedAssessment(record);
                setDetailDrawerVisible(true);
              }}
              size="small"
            />
          </Tooltip>
          {record.status === 'Pending' && (
            <Tooltip title="Nộp bài">
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={() => {
                  setSelectedAssessment(record);
                  setSubmitModalVisible(true);
                }}
                size="small"
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const pendingColumns = [
    {
      title: 'Bài Tập',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (text, record) => (
        <div>
          <strong>{text}</strong>
          <br />
          <span style={{ fontSize: 12, color: '#666' }}>
            {record.enrollment?.class?.title}
          </span>
        </div>
      ),
    },
    {
      title: 'Deadline',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 180,
      render: (deadline) => {
        const deadlineStatus = getDeadlineStatus(deadline);
        const isPassing = deadlineStatus.status !== 'error';
        return (
          <div>
            <div style={{ color: isPassing ? 'orange' : 'red', fontWeight: 'bold' }}>
              {deadlineStatus.text}
            </div>
            {deadline && (
              <div style={{ fontSize: 12, color: '#999' }}>
                {moment(deadline).format('DD/MM/YYYY HH:mm')}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => getStatusBadge(status),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            danger
            icon={<UploadOutlined />}
            onClick={() => {
              setSelectedAssessment(record);
              setSubmitModalVisible(true);
            }}
            size="small"
          >
            Nộp Ngay
          </Button>
        </Space>
      ),
    },
  ];

  // ========== RENDER ==========
  return (
    <Spin spinning={loading}>
      <Card title="Bài Tập - Học Viên" style={{ margin: 20 }}>
        {/* Summary Cards */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, color: '#999' }}>Tổng bài tập</p>
                <p style={{ fontSize: 24, fontWeight: 'bold', margin: 8 }}>
                  {assessments.length}
                </p>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, color: '#999' }}>Chờ nộp</p>
                <p style={{ fontSize: 24, fontWeight: 'bold', margin: 8, color: 'orange' }}>
                  {pendingAssessments.length}
                </p>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, color: '#999' }}>Đã nộp</p>
                <p style={{ fontSize: 24, fontWeight: 'bold', margin: 8, color: 'blue' }}>
                  {assessments.filter((a) => a.status === 'Submitted').length}
                </p>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, color: '#999' }}>Đã chấm</p>
                <p style={{ fontSize: 24, fontWeight: 'bold', margin: 8, color: 'green' }}>
                  {assessments.filter((a) => a.status === 'Graded').length}
                </p>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'pending',
              label: `⏰ Sắp Hết Hạn (${pendingAssessments.length})`,
              children: (
                <div>
                  {pendingAssessments.length === 0 ? (
                    <Empty
                      description="Không có bài tập sắp hết hạn"
                      style={{ marginTop: 50 }}
                    />
                  ) : (
                    <Table
                      columns={pendingColumns}
                      dataSource={pendingAssessments}
                      rowKey="_id"
                      pagination={{ pageSize: 10 }}
                      loading={loading}
                    />
                  )}
                </div>
              ),
            },
            {
              key: 'all',
              label: '📋 Tất Cả Bài Tập',
              children: (
                <div>
                  <Row gutter={16} style={{ marginBottom: 20 }}>
                    <Col xs={24} sm={12} md={8}>
                      <Select
                        placeholder="Lọc theo trạng thái"
                        value={filters.status}
                        onChange={(value) =>
                          setFilters({ ...filters, status: value })
                        }
                        style={{ width: '100%' }}
                      >
                        <Select.Option value="all">Tất cả</Select.Option>
                        <Select.Option value="Pending">Chưa nộp</Select.Option>
                        <Select.Option value="Submitted">Đã nộp</Select.Option>
                        <Select.Option value="Graded">Đã chấm</Select.Option>
                        <Select.Option value="Late">Muộn</Select.Option>
                      </Select>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Select
                        placeholder="Lọc theo loại"
                        value={filters.type}
                        onChange={(value) =>
                          setFilters({ ...filters, type: value })
                        }
                        style={{ width: '100%' }}
                      >
                        <Select.Option value="all">Tất cả</Select.Option>
                        <Select.Option value="Assignment">Assignment</Select.Option>
                        <Select.Option value="Quiz">Quiz</Select.Option>
                        <Select.Option value="Project">Project</Select.Option>
                        <Select.Option value="Midterm">Midterm</Select.Option>
                        <Select.Option value="Final">Final</Select.Option>
                        <Select.Option value="Presentation">Presentation</Select.Option>
                      </Select>
                    </Col>
                    <Col xs={24} sm={12} md={8}>
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={loadAssessments}
                        block
                      >
                        Tải lại
                      </Button>
                    </Col>
                  </Row>

                  {assessments.length === 0 ? (
                    <Empty description="Không có bài tập" style={{ marginTop: 50 }} />
                  ) : (
                    <Table
                      columns={assessmentColumns}
                      dataSource={assessments}
                      rowKey="_id"
                      pagination={{ pageSize: 10 }}
                      loading={loading}
                    />
                  )}
                </div>
              ),
            },
            {
              key: 'grades',
              label: '⭐ Điểm Số',
              children: (
                <div>
                  {assessments.filter((a) => a.status === 'Graded').length === 0 ? (
                    <Empty description="Chưa có kết quả chấm" style={{ marginTop: 50 }} />
                  ) : (
                    <Table
                      columns={[
                        {
                          title: 'Bài Tập',
                          dataIndex: 'title',
                          key: 'title',
                          width: 250,
                        },
                        {
                          title: 'Loại',
                          dataIndex: 'type',
                          key: 'type',
                          width: 100,
                          render: (type) => {
                            const colors = {
                              Assignment: 'blue',
                              Quiz: 'green',
                              Project: 'orange',
                              Midterm: 'red',
                              Final: 'purple',
                              Presentation: 'cyan',
                            };
                            return <Tag color={colors[type]}>{type}</Tag>;
                          },
                        },
                        {
                          title: 'Điểm',
                          dataIndex: 'score',
                          key: 'score',
                          width: 150,
                          render: (score) => (
                            <div>
                              <div style={{ fontSize: 18, fontWeight: 'bold' }}>
                                {score}/100
                              </div>
                              <Progress
                                percent={(score / 100) * 100}
                                size="small"
                                status={score >= 70 ? 'success' : score >= 50 ? 'normal' : 'exception'}
                              />
                            </div>
                          ),
                        },
                        {
                          title: 'Hành động',
                          key: 'actions',
                          width: 120,
                          render: (_, record) => (
                            <Button
                              type="primary"
                              ghost
                              icon={<EyeOutlined />}
                              onClick={() => {
                                setSelectedAssessment(record);
                                setDetailDrawerVisible(true);
                              }}
                              size="small"
                            >
                              Chi tiết
                            </Button>
                          ),
                        },
                      ]}
                      dataSource={assessments.filter((a) => a.status === 'Graded')}
                      rowKey="_id"
                      pagination={{ pageSize: 10 }}
                    />
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Submit Assessment Modal */}
      <Modal
        title="Nộp Bài Tập"
        visible={submitModalVisible}
        onCancel={() => {
          setSubmitModalVisible(false);
          setFileList([]);
        }}
        footer={null}
        width={600}
      >
        {selectedAssessment && (
          <Form
            form={submitForm}
            onFinish={handleSubmitAssessment}
            layout="vertical"
          >
            <div style={{ marginBottom: 20 }}>
              <p>
                <strong>Bài tập:</strong> {selectedAssessment.title}
              </p>
              <p>
                <strong>Lớp:</strong> {selectedAssessment.enrollment?.class?.title}
              </p>
              <p>
                <strong>Deadline:</strong>{' '}
                {selectedAssessment.deadline
                  ? moment(selectedAssessment.deadline).format('DD/MM/YYYY HH:mm')
                  : 'Không có'}
              </p>
            </div>

            {/* Display assignment files from teacher */}
            {selectedAssessment.attachments && selectedAssessment.attachments.length > 0 && (
              <>
                <Divider>File Bài Tập từ Giáo Viên</Divider>
                <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedAssessment.attachments.map((attachment, index) => {
                    // Handle both old format (string) and new format (object)
                    const isOldFormat = typeof attachment === 'string';
                    const fileName = isOldFormat
                      ? attachment.split('/').pop() || `File ${index + 1}`
                      : attachment.originalName || `File ${index + 1}`;
                    const fileUrl = isOldFormat ? attachment : attachment.url;
                    const fileSize = isOldFormat
                      ? fileService.getFileInfo(attachment)?.size
                      : attachment.size;
                    return (
                      <div
                        key={index}
                        style={{
                          padding: 10,
                          backgroundColor: '#e6f7ff',
                          borderRadius: 4,
                          border: '1px solid #91d5ff',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <FileOutlined style={{ fontSize: 16, color: '#1890ff' }} />
                          <div>
                            <p style={{ margin: 0, fontWeight: 500 }}>
                              {fileName}
                            </p>
                            {fileSize && (
                              <p style={{ margin: 0, fontSize: 12, color: '#666' }}>
                                {fileService.formatFileSize(fileSize)}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          type="primary"
                          ghost
                          size="small"
                          icon={<DownloadOutlined />}
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = fileUrl;
                            // Ensure fileName has extension
                            const downloadName = fileName.includes('.')
                              ? fileName
                              : `${fileName}.pdf`; // fallback to pdf if no extension
                            a.download = downloadName;
                            a.click();
                          }}
                        >
                          Tải
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <Divider />

            <Form.Item
              name="files"
              label="Tải lên file"
              rules={[
                {
                  required: true,
                  message: 'Vui lòng tải lên ít nhất một file',
                },
              ]}
            >
              <Upload
                fileList={fileList}
                onChange={(info) => setFileList(info.fileList)}
                multiple
                beforeUpload={() => false}
              >
                <Button icon={<UploadOutlined />}>
                  Chọn file (PDF, Word, Zip, v.v.)
                </Button>
              </Upload>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                size="large"
              >
                Nộp Bài Tập
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        title={selectedAssessment?.title}
        placement="right"
        onClose={() => setDetailDrawerVisible(false)}
        open={detailDrawerVisible}
        width={500}
      >
        {selectedAssessment && (
          <div>
            <Divider>Thông Tin Bài Tập</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <p>
                  <strong>Loại:</strong>
                </p>
                <Tag color="blue">{selectedAssessment.type}</Tag>
              </Col>
              <Col span={12}>
                <p>
                  <strong>Trạng thái:</strong>
                </p>
                {getStatusBadge(selectedAssessment.status, selectedAssessment.isLate)}
              </Col>
            </Row>

            <p style={{ marginTop: 16 }}>
              <strong>Trọng số:</strong> {selectedAssessment.weight}%
            </p>
            <p>
              <strong>Deadline:</strong>{' '}
              {selectedAssessment.deadline
                ? moment(selectedAssessment.deadline).format('DD/MM/YYYY HH:mm')
                : 'Không có'}
            </p>

            <Divider>Lớp Học</Divider>
            <p>{selectedAssessment.enrollment?.class?.title}</p>

            {selectedAssessment.status === 'Graded' && (
              <>
                <Divider>Kết Quả Chấm</Divider>
                <p>
                  <strong>Điểm:</strong> {selectedAssessment.score}/100
                </p>
                <Progress
                  percent={(selectedAssessment.score / 100) * 100}
                  status={
                    selectedAssessment.score >= 70
                      ? 'success'
                      : selectedAssessment.score >= 50
                      ? 'normal'
                      : 'exception'
                  }
                />
                <p style={{ marginTop: 16 }}>
                  <strong>Nhận xét:</strong>
                </p>
                <p
                  style={{
                    padding: 12,
                    backgroundColor: '#f5f5f5',
                    borderRadius: 4,
                  }}
                >
                  {selectedAssessment.feedback || 'Không có nhận xét'}
                </p>
              </>
            )}

            {selectedAssessment.attachments &&
              selectedAssessment.attachments.length > 0 && (
                <>
                  <Divider>File Nộp</Divider>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedAssessment.attachments.map((attachment, index) => {
                      // Handle both old format (string) and new format (object)
                      const isOldFormat = typeof attachment === 'string';
                      const fileName = isOldFormat
                        ? attachment.split('/').pop() || `File ${index + 1}`
                        : attachment.originalName || `File ${index + 1}`;
                      const fileUrl = isOldFormat ? attachment : attachment.url;
                      const fileSize = isOldFormat
                        ? fileService.getFileInfo(attachment)?.size
                        : attachment.size;
                      console.log(`📄 File ${index + 1}:`, { fileName, originalName: attachment.originalName, isOldFormat });
                      return (
                        <div
                          key={index}
                          style={{
                            padding: 10,
                            backgroundColor: '#f9f9f9',
                            borderRadius: 4,
                            border: '1px solid #e8e8e8',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FileOutlined style={{ fontSize: 16, color: '#1890ff' }} />
                            <div>
                              <p style={{ margin: 0, fontWeight: 500 }}>
                                {fileName}
                              </p>
                              {fileSize && (
                                <p style={{ margin: 0, fontSize: 12, color: '#999' }}>
                                  {fileService.formatFileSize(fileSize)}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            type="primary"
                            ghost
                            size="small"
                            icon={<DownloadOutlined />}
                            onClick={() => {
                              const a = document.createElement('a');
                              // Ensure fileName has extension
                              const downloadName = fileName.includes('.')
                                ? fileName
                                : `${fileName}.pdf`; // fallback to pdf if no extension

                              // For Cloudinary URLs, force download with proper content-disposition
                              let downloadUrl = fileUrl;
                              if (fileUrl && fileUrl.includes('cloudinary.com')) {
                                // Use fl_attachment flag to force download with filename
                                downloadUrl = fileUrl.replace('/upload/', '/upload/fl_attachment/');
                              }

                              a.href = downloadUrl;
                              a.download = downloadName;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                            }}
                          >
                            Tải
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
          </div>
        )}
      </Drawer>
    </Spin>
  );
};

export default StudentAssessment;
