import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Tabs,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Spin,
  Tag,
  Drawer,
  Upload,
  Divider,
  Row,
  Col,
  Tooltip,
  Popconfirm,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  CheckOutlined,
  FileOutlined,
  ReloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import fileService from '../../services/fileService';

const LecturerAssessment = () => {
  const navigate = useNavigate();
  const { user, api } = useAuth();

  // ========== STATES ==========
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [ungradedAssessments, setUngradedAssessments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('create');

  // Modal states
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [gradeModalVisible, setGradeModalVisible] = useState(false);
  const [bulkGradeModalVisible, setBulkGradeModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);

  // Form states
  const [createForm] = Form.useForm();
  const [gradeForm] = Form.useForm();
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [gradingData, setGradingData] = useState({});
  const [assignmentFileList, setAssignmentFileList] = useState([]);

  // ========== PERMISSION CHECK ==========
  useEffect(() => {
    if (!user || user.role !== 'lecturer') {
      message.error('Bạn không có quyền truy cập trang này');
      navigate('/');
      return;
    }
    loadTeacherClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ========== LOAD DATA ==========
  const loadTeacherClasses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/classes', {
        params: { teacher: user._id },
      });
      setClasses(response.data.data || []);
      if (response.data.data && response.data.data.length > 0) {
        setSelectedClass(response.data.data[0]._id);
      }
    } catch (error) {
      console.error('❌ Lỗi tải lớp:', error);
      message.error('Không thể tải danh sách lớp');
    } finally {
      setLoading(false);
    }
  };

  const loadAssessments = useCallback(async (classId) => {
    if (!classId) return;
    try {
      setLoading(true);
      const response = await api.get('/assessments', {
        params: { enrollment__class: classId },
      });
      setAssessments(response.data.data || []);
    } catch (error) {
      console.error('❌ Lỗi tải bài tập:', error);
      message.error('Không thể tải danh sách bài tập');
    } finally {
      setLoading(false);
    }
  }, [api]);

  const loadUngradedAssessments = useCallback(async (classId) => {
    if (!classId) return;
    try {
      const response = await api.get(
        `/assessments/ungraded/class/${classId}`
      );
      setUngradedAssessments(response.data.data || []);
    } catch (error) {
      console.error('❌ Lỗi tải bài chưa chấm:', error);
      message.error('Không thể tải danh sách bài chưa chấm');
    }
  }, [api]);

  useEffect(() => {
    if (selectedClass) {
      loadAssessments(selectedClass);
      loadUngradedAssessments(selectedClass);
    }
  }, [selectedClass, loadAssessments, loadUngradedAssessments]);

  // ========== CREATE ASSESSMENT FOR CLASS ==========
  const handleCreateAssessmentForClass = async (values) => {
    try {
      setLoading(true);

      // Upload files nếu có
      let attachmentUrls = [];
      if (assignmentFileList.length > 0) {
        try {
          attachmentUrls = await fileService.uploadFiles(
            assignmentFileList.map(f => f.originFileObj),
            (percent, current, total) => {
              console.log(`Uploading file ${current}/${total}: ${percent}%`);
            }
          );
        } catch (uploadError) {
          message.error('Lỗi upload file: ' + uploadError.message);
          return;
        }
      }

      const payload = {
        ...values,
        classId: selectedClass,
        deadline: values.deadline ? values.deadline.toISOString() : undefined,
        attachments: attachmentUrls, // Thêm file URLs
      };

      const response = await api.post(
        '/assessments/create-for-class',
        payload
      );

      message.success(
        `Giao bài tập thành công cho ${response.data.data.count} học viên`
      );
      createForm.resetFields();
      setAssignmentFileList([]);
      setCreateModalVisible(false);
      loadAssessments(selectedClass);
    } catch (error) {
      console.error('❌ Lỗi tạo bài tập:', error);
      message.error(error.response?.data?.message || 'Lỗi tạo bài tập');
    } finally {
      setLoading(false);
    }
  };

  // ========== GRADE ASSESSMENT ==========
  const handleGradeAssessment = async (values) => {
    try {
      setLoading(true);
      await api.patch(`/assessments/${selectedAssessment._id}/grade`, {
        score: values.score,
        feedback: values.feedback,
      });

      message.success('Chấm điểm thành công');
      gradeForm.resetFields();
      setGradeModalVisible(false);
      loadAssessments(selectedClass);
      loadUngradedAssessments(selectedClass);
    } catch (error) {
      console.error('❌ Lỗi chấm điểm:', error);
      message.error(error.response?.data?.message || 'Lỗi chấm điểm');
    } finally {
      setLoading(false);
    }
  };

  // ========== BULK GRADE ==========
  const handleBulkGrade = async () => {
    try {
      setLoading(true);
      const grades = Object.entries(gradingData).map(
        ([assessmentId, { score, feedback }]) => ({
          assessmentId,
          score: parseInt(score),
          feedback,
        })
      );

      if (grades.length === 0) {
        message.warning('Vui lòng chấm điểm ít nhất một bài');
        return;
      }

      const response = await api.post('/assessments/bulk-grade', { grades });

      message.success(
        `Chấm điểm thành công ${response.data.data.successCount} bài`
      );
      if (response.data.data.failedCount > 0) {
        message.warning(`${response.data.data.failedCount} bài lỗi`);
      }

      setGradingData({});
      setBulkGradeModalVisible(false);
      loadAssessments(selectedClass);
      loadUngradedAssessments(selectedClass);
    } catch (error) {
      console.error('❌ Lỗi bulk grade:', error);
      message.error('Lỗi chấm điểm hàng loạt');
    } finally {
      setLoading(false);
    }
  };

  // ========== DELETE ASSESSMENT ==========
  const handleDeleteAssessment = async (assessmentId) => {
    try {
      setLoading(true);
      await api.delete(`/assessments/${assessmentId}`);
      message.success('Xóa bài tập thành công');
      loadAssessments(selectedClass);
    } catch (error) {
      console.error('❌ Lỗi xóa bài tập:', error);
      message.error('Lỗi xóa bài tập');
    } finally {
      setLoading(false);
    }
  };

  // ========== TABLE COLUMNS ==========
  const assessmentColumns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
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
      render: (status) => {
        const colors = {
          Pending: 'default',
          Submitted: 'processing',
          Graded: 'success',
          Late: 'warning',
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      },
    },
    {
      title: 'Deadline',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (deadline) =>
        deadline ? moment(deadline).format('DD/MM/YYYY HH:mm') : 'Không có',
      width: 150,
    },
    {
      title: 'Điểm',
      dataIndex: 'score',
      key: 'score',
      render: (score) => (score !== undefined ? `${score}/100` : '-'),
      width: 80,
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 200,
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
            />
          </Tooltip>
          {record.status !== 'Graded' && (
            <Tooltip title="Chấm điểm">
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => {
                  setSelectedAssessment(record);
                  gradeForm.setFieldsValue({ score: record.score || 0 });
                  setGradeModalVisible(true);
                }}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="Xóa bài tập?"
            description="Bạn chắc chắn muốn xóa bài tập này?"
            onConfirm={() => handleDeleteAssessment(record._id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="primary" danger ghost icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const ungradedColumns = [
    {
      title: 'Học viên',
      dataIndex: ['enrollment', 'user', 'fullName'],
      key: 'studentName',
      width: 150,
    },
    {
      title: 'Bài tập',
      dataIndex: 'title',
      key: 'title',
      width: 150,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Late' ? 'red' : 'orange'}>{status}</Tag>
      ),
    },
    {
      title: 'Ngày nộp',
      dataIndex: 'submissionDate',
      key: 'submissionDate',
      render: (date) =>
        date ? moment(date).format('DD/MM/YYYY HH:mm') : 'Chưa nộp',
      width: 150,
    },
    {
      title: 'Chấm điểm',
      key: 'grade',
      width: 150,
      render: (_, record) => (
        <Space>
          <InputNumber
            min={0}
            max={100}
            defaultValue={0}
            placeholder="Điểm"
            onChange={(value) => {
              setGradingData({
                ...gradingData,
                [record._id]: {
                  ...gradingData[record._id],
                  score: value,
                },
              });
            }}
          />
          <Input
            placeholder="Nhận xét"
            defaultValue={gradingData[record._id]?.feedback || ''}
            onChange={(e) => {
              setGradingData({
                ...gradingData,
                [record._id]: {
                  ...gradingData[record._id],
                  feedback: e.target.value,
                },
              });
            }}
          />
        </Space>
      ),
    },
  ];

  // ========== RENDER ==========
  return (
    <Spin spinning={loading}>
      <Card title="Quản Lý Bài Tập - Giáo Viên" style={{ margin: 20 }}>
        {/* Class Selection */}
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col span={24}>
            <label>Chọn lớp học:</label>
            <Select
              placeholder="Chọn lớp"
              value={selectedClass}
              onChange={setSelectedClass}
              style={{ width: '100%' }}
            >
              {classes.map((cls) => (
                <Select.Option key={cls._id} value={cls._id}>
                  {cls.title}
                </Select.Option>
              ))}
            </Select>
          </Col>
        </Row>

        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'create',
              label: '📝 Giao Bài Tập',
              children: (
                <div>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCreateModalVisible(true)}
                    style={{ marginBottom: 20 }}
                  >
                    Giao bài tập cho lớp
                  </Button>
                  <Table
                    columns={assessmentColumns}
                    dataSource={assessments}
                    rowKey="_id"
                    pagination={{ pageSize: 10 }}
                    loading={loading}
                    locale={{ emptyText: 'Không có bài tập' }}
                  />
                </div>
              ),
            },
            {
              key: 'grading',
              label: `📊 Chấm Bài (${ungradedAssessments.length})`,
              children: (
                <div>
                  <div style={{ marginBottom: 20 }}>
                    <Space>
                      <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        onClick={() => setBulkGradeModalVisible(true)}
                        disabled={ungradedAssessments.length === 0}
                      >
                        Chấm Hàng Loạt
                      </Button>
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={() => loadUngradedAssessments(selectedClass)}
                      >
                        Tải lại
                      </Button>
                    </Space>
                  </div>

                  {ungradedAssessments.length === 0 ? (
                    <Empty description="Tất cả bài tập đã được chấm" />
                  ) : (
                    <Table
                      columns={ungradedColumns}
                      dataSource={ungradedAssessments}
                      rowKey="_id"
                      pagination={{ pageSize: 10 }}
                      loading={loading}
                    />
                  )}
                </div>
              ),
            },
            {
              key: 'statistics',
              label: '📈 Thống Kê',
              children: (
                <div>
                  <Row gutter={16}>
                    <Col span={6}>
                      <Card>
                        <div style={{ textAlign: 'center' }}>
                          <h3>Tổng bài tập</h3>
                          <p style={{ fontSize: 24, fontWeight: 'bold' }}>
                            {assessments.length}
                          </p>
                        </div>
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card>
                        <div style={{ textAlign: 'center' }}>
                          <h3>Chưa chấm</h3>
                          <p style={{ fontSize: 24, fontWeight: 'bold', color: 'orange' }}>
                            {ungradedAssessments.length}
                          </p>
                        </div>
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card>
                        <div style={{ textAlign: 'center' }}>
                          <h3>Đã chấm</h3>
                          <p style={{ fontSize: 24, fontWeight: 'bold', color: 'green' }}>
                            {assessments.filter((a) => a.status === 'Graded').length}
                          </p>
                        </div>
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card>
                        <div style={{ textAlign: 'center' }}>
                          <h3>Bài muộn</h3>
                          <p style={{ fontSize: 24, fontWeight: 'bold', color: 'red' }}>
                            {assessments.filter((a) => a.status === 'Late').length}
                          </p>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Create Assessment Modal */}
      <Modal
        title="Giao Bài Tập Cho Lớp"
        visible={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          setAssignmentFileList([]);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={createForm}
          onFinish={handleCreateAssessmentForClass}
          layout="vertical"
        >
          <Form.Item
            name="title"
            label="Tiêu đề bài tập"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
          >
            <Input placeholder="Nhập tiêu đề bài tập" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Loại bài tập"
            rules={[{ required: true, message: 'Vui lòng chọn loại' }]}
          >
            <Select placeholder="Chọn loại bài tập">
              <Select.Option value="Assignment">Assignment</Select.Option>
              <Select.Option value="Quiz">Quiz</Select.Option>
              <Select.Option value="Project">Project</Select.Option>
              <Select.Option value="Midterm">Midterm</Select.Option>
              <Select.Option value="Final">Final</Select.Option>
              <Select.Option value="Presentation">Presentation</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="weight"
            label="Trọng số (%)"
            rules={[{ required: true, message: 'Vui lòng nhập trọng số' }]}
          >
            <InputNumber min={0} max={100} placeholder="10" />
          </Form.Item>

          <Form.Item name="deadline" label="Deadline">
            <DatePicker showTime format="DD/MM/YYYY HH:mm" />
          </Form.Item>

          <Form.Item label="File bài tập (tùy chọn)">
            <Upload
              fileList={assignmentFileList}
              onChange={(info) => setAssignmentFileList(info.fileList)}
              multiple
              beforeUpload={() => false}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt,.jpg,.png"
            >
              <Button icon={<UploadOutlined />}>
                Chọn file hướng dẫn/bài tập (PDF, Word, Excel, v.v.)
              </Button>
            </Upload>
            {assignmentFileList.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                  File sẽ được gửi cho tất cả học viên:
                </p>
                {assignmentFileList.map((file, index) => (
                  <div
                    key={index}
                    style={{
                      padding: 8,
                      backgroundColor: '#f5f5f5',
                      borderRadius: 4,
                      marginBottom: 4,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 12 }}>
                      📄 {file.name}
                    </span>
                    <span style={{ fontSize: 11, color: '#999' }}>
                      {fileService.formatFileSize(file.size)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Giao Bài Tập
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Grade Assessment Modal */}
      <Modal
        title="Chấm Điểm"
        visible={gradeModalVisible}
        onCancel={() => setGradeModalVisible(false)}
        footer={null}
      >
        <Form form={gradeForm} onFinish={handleGradeAssessment} layout="vertical">
          <div style={{ marginBottom: 16 }}>
            <p>
              <strong>Bài tập:</strong> {selectedAssessment?.title}
            </p>
            <p>
              <strong>Học viên:</strong>{' '}
              {selectedAssessment?.enrollment?.user?.fullName}
            </p>
          </div>

          <Form.Item
            name="score"
            label="Điểm (0-100)"
            rules={[
              { required: true, message: 'Vui lòng nhập điểm' },
              { type: 'number', min: 0, max: 100, message: 'Điểm phải từ 0-100' },
            ]}
          >
            <InputNumber min={0} max={100} />
          </Form.Item>

          <Form.Item name="feedback" label="Nhận xét">
            <Input.TextArea
              rows={4}
              placeholder="Nhập nhận xét cho học viên"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Chấm Điểm
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Bulk Grade Modal */}
      <Modal
        title="Chấm Điểm Hàng Loạt"
        visible={bulkGradeModalVisible}
        onCancel={() => setBulkGradeModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setBulkGradeModalVisible(false)}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleBulkGrade}
            loading={loading}
          >
            Chấm Điểm
          </Button>,
        ]}
        width={1000}
      >
        <Table
          columns={ungradedColumns}
          dataSource={ungradedAssessments}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
          loading={loading}
        />
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
            <p>
              <strong>Tiêu đề:</strong> {selectedAssessment.title}
            </p>
            <p>
              <strong>Loại:</strong>{' '}
              <Tag color="blue">{selectedAssessment.type}</Tag>
            </p>
            <p>
              <strong>Trạng thái:</strong>{' '}
              <Tag color={selectedAssessment.status === 'Graded' ? 'green' : 'orange'}>
                {selectedAssessment.status}
              </Tag>
            </p>
            <p>
              <strong>Trọng số:</strong> {selectedAssessment.weight}%
            </p>
            <p>
              <strong>Deadline:</strong>{' '}
              {selectedAssessment.deadline
                ? moment(selectedAssessment.deadline).format('DD/MM/YYYY HH:mm')
                : 'Không có'}
            </p>

            <Divider>Thông Tin Học Viên</Divider>
            <p>
              <strong>Tên:</strong>{' '}
              {selectedAssessment.enrollment?.user?.fullName}
            </p>
            <p>
              <strong>Email:</strong> {selectedAssessment.enrollment?.user?.email}
            </p>

            <Divider>Kết Quả</Divider>
            {selectedAssessment.status === 'Graded' ? (
              <>
                <p>
                  <strong>Điểm:</strong> {selectedAssessment.score}/100
                </p>
                <p>
                  <strong>Nhận xét:</strong> {selectedAssessment.feedback}
                </p>
                <p>
                  <strong>Ngày chấm:</strong>{' '}
                  {moment(selectedAssessment.gradedDate).format(
                    'DD/MM/YYYY HH:mm'
                  )}
                </p>
              </>
            ) : (
              <p style={{ color: 'orange' }}>Chưa chấm điểm</p>
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
                        ? null
                        : attachment.size;
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
                              <p style={{ margin: 0, fontWeight: 500 }}>{fileName}</p>
                              {fileSize && (
                                <p style={{ margin: 0, fontSize: 12, color: '#999' }}>
                                  {fileService?.formatFileSize(fileSize) || `${(fileSize / 1024).toFixed(2)} KB`}
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

export default LecturerAssessment;
