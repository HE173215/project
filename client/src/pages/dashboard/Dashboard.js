import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Tag, Typography, Space } from 'antd';
import {
  BookOutlined,
  TeamOutlined,
  FileTextOutlined,
  CheckSquareOutlined,
  TrophyOutlined,
  UserOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useCourse } from '../../context/CourseContext';
import { useClass } from '../../context/ClassContext';
import { useEnrollment } from '../../context/EnrollmentContext';
import { useAssessment } from '../../context/AssessmentContext';
import moment from 'moment';

const { Title, Text } = Typography;

const Dashboard = () => {
  const { user } = useAuth();
  const { courses, getAllCourses } = useCourse();
  const { classes, getAllClasses } = useClass();
  const { myEnrollments, getMyEnrollments } = useEnrollment();
  const { myAssessments, getMyAssessments } = useAssessment();

  const [stats, setStats] = useState({
    totalCourses: 0,
    totalClasses: 0,
    myEnrollments: 0,
    pendingAssessments: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      if (user?.role === 'student') {
        const enrollments = await getMyEnrollments();
        const assessments = await getMyAssessments();

        setStats({
          totalCourses: 0,
          totalClasses: 0,
          myEnrollments: enrollments?.length || 0,
          pendingAssessments: assessments?.filter(a => a.status === 'Pending').length || 0
        });
      } else {
        const coursesData = await getAllCourses();
        const classesData = await getAllClasses();

        setStats({
          totalCourses: coursesData?.total || 0,
          totalClasses: classesData?.total || 0,
          myEnrollments: 0,
          pendingAssessments: 0
        });
      }
    } catch (error) {
      console.error('Load dashboard error:', error);
    }
  };

  // Student Dashboard
  if (user?.role === 'student') {
    return (
      <div className="page-wrapper">
        {/* Page Header */}
        <div className="page-header-card">
          <div className="page-header-content">
            <div className="page-header-left">
              <Title level={2} className="page-header-title">
                Chào mừng, {user?.fullName || user?.username}! 👋
              </Title>
              <Text className="page-header-subtitle">
                Hôm nay là {moment().format('dddd, DD/MM/YYYY')}. Chúc bạn một ngày học tập hiệu quả!
              </Text>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)', color: '#667eea' }}>
              <TeamOutlined />
            </div>
            <div className="stat-card-label">Lớp học đang tham gia</div>
            <div className="stat-card-value">{stats.myEnrollments}</div>
            <div className="stat-card-change positive">
              <RiseOutlined /> +2 so với tháng trước
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, rgba(255, 77, 79, 0.1) 0%, rgba(255, 77, 79, 0.1) 100%)', color: '#ff4d4f' }}>
              <FileTextOutlined />
            </div>
            <div className="stat-card-label">Bài tập chưa nộp</div>
            <div className="stat-card-value">{stats.pendingAssessments}</div>
            <div className="stat-card-change negative">
              <FallOutlined /> Cần hoàn thành
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, rgba(250, 173, 20, 0.1) 0%, rgba(250, 173, 20, 0.1) 100%)', color: '#faad14' }}>
              <TrophyOutlined />
            </div>
            <div className="stat-card-label">Điểm trung bình</div>
            <div className="stat-card-value">85<Text style={{ fontSize: 18, color: '#999' }}>/100</Text></div>
            <div className="stat-card-change positive">
              <RiseOutlined /> +5 điểm
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, rgba(82, 196, 26, 0.1) 0%, rgba(82, 196, 26, 0.1) 100%)', color: '#52c41a' }}>
              <CheckSquareOutlined />
            </div>
            <div className="stat-card-label">Tỷ lệ tham gia</div>
            <div className="stat-card-value">92<Text style={{ fontSize: 18, color: '#999' }}>%</Text></div>
            <div className="stat-card-change positive">
              <RiseOutlined /> Tuyệt vời!
            </div>
          </div>
        </div>

        {/* Content Section */}
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={12}>
            <div className="content-card">
              <div className="content-card-header">
                <Title level={4} className="content-card-title">Lớp học của tôi</Title>
              </div>
              <div className="content-card-body">
                <Table
                  dataSource={myEnrollments}
                  rowKey="_id"
                  size="middle"
                  pagination={false}
                  columns={[
                    {
                      title: 'Lớp học',
                      dataIndex: ['class', 'title'],
                      key: 'class',
                      render: (title) => <Text strong>{title}</Text>
                    },
                    {
                      title: 'Trạng thái',
                      dataIndex: 'status',
                      key: 'status',
                      width: 120,
                      render: (status) => {
                        const colors = {
                          Pending: 'orange',
                          Approved: 'success',
                          Rejected: 'error'
                        };
                        return <Tag color={colors[status]}>{status}</Tag>;
                      }
                    }
                  ]}
                />
              </div>
            </div>
          </Col>

          <Col xs={24} lg={12}>
            <div className="content-card">
              <div className="content-card-header">
                <Title level={4} className="content-card-title">Bài tập gần đây</Title>
              </div>
              <div className="content-card-body">
                <Table
                  dataSource={myAssessments?.slice(0, 5)}
                  rowKey="_id"
                  size="middle"
                  pagination={false}
                  columns={[
                    {
                      title: 'Bài tập',
                      dataIndex: 'title',
                      key: 'title',
                      render: (title) => <Text strong>{title}</Text>
                    },
                    {
                      title: 'Trạng thái',
                      dataIndex: 'status',
                      key: 'status',
                      width: 120,
                      render: (status) => {
                        const colors = {
                          Pending: 'orange',
                          Submitted: 'blue',
                          Graded: 'success'
                        };
                        return <Tag color={colors[status]}>{status}</Tag>;
                      }
                    }
                  ]}
                />
              </div>
            </div>
          </Col>
        </Row>
      </div>
    );
  }

  // Admin/Manager/Lecturer Dashboard
  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header-card">
        <div className="page-header-content">
          <div className="page-header-left">
            <Title level={2} className="page-header-title">
              Chào mừng, {user?.fullName || user?.username}! 👋
            </Title>
            <Text className="page-header-subtitle">
              Tổng quan hệ thống quản lý giáo dục - {moment().format('DD/MM/YYYY')}
            </Text>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)', color: '#667eea' }}>
            <BookOutlined />
          </div>
          <div className="stat-card-label">Tổng khóa học</div>
          <div className="stat-card-value">{stats.totalCourses}</div>
          <div className="stat-card-change positive">
            <RiseOutlined /> +3 khóa mới
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, rgba(24, 144, 255, 0.1) 0%, rgba(24, 144, 255, 0.1) 100%)', color: '#1890ff' }}>
            <TeamOutlined />
          </div>
          <div className="stat-card-label">Tổng lớp học</div>
          <div className="stat-card-value">{stats.totalClasses}</div>
          <div className="stat-card-change positive">
            <RiseOutlined /> +5 lớp
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, rgba(114, 46, 209, 0.1) 0%, rgba(114, 46, 209, 0.1) 100%)', color: '#722ed1' }}>
            <UserOutlined />
          </div>
          <div className="stat-card-label">Sinh viên đang học</div>
          <div className="stat-card-value">245</div>
          <div className="stat-card-change positive">
            <RiseOutlined /> +12 sinh viên
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'linear-gradient(135deg, rgba(235, 47, 150, 0.1) 0%, rgba(235, 47, 150, 0.1) 100%)', color: '#eb2f96' }}>
            <TeamOutlined />
          </div>
          <div className="stat-card-label">Giảng viên</div>
          <div className="stat-card-value">18</div>
          <div className="stat-card-change positive">
            <RiseOutlined /> +2 giảng viên
          </div>
        </div>
      </div>

      {/* Content Section */}
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={12}>
          <div className="content-card">
            <div className="content-card-header">
              <Title level={4} className="content-card-title">Lớp học gần đây</Title>
            </div>
            <div className="content-card-body">
              <Table
                dataSource={classes?.slice(0, 5)}
                rowKey="_id"
                size="middle"
                pagination={false}
                columns={[
                  {
                    title: 'Tên lớp',
                    dataIndex: 'title',
                    key: 'title',
                    render: (title) => <Text strong>{title}</Text>
                  },
                  {
                    title: 'Sĩ số',
                    key: 'students',
                    width: 100,
                    render: (_, record) => (
                      <Tag color={record.currentStudents >= record.maxStudents ? 'error' : 'success'}>
                        {record.currentStudents || 0}/{record.maxStudents}
                      </Tag>
                    )
                  },
                  {
                    title: 'Trạng thái',
                    dataIndex: 'status',
                    key: 'status',
                    width: 120,
                    render: (status) => {
                      const colors = {
                        Pending: 'default',
                        Active: 'success',
                        Completed: 'blue'
                      };
                      return <Tag color={colors[status]}>{status}</Tag>;
                    }
                  }
                ]}
              />
            </div>
          </div>
        </Col>

        <Col xs={24} lg={12}>
          <div className="content-card">
            <div className="content-card-header">
              <Title level={4} className="content-card-title">Khóa học phổ biến</Title>
            </div>
            <div className="content-card-body">
              <Table
                dataSource={courses?.slice(0, 5)}
                rowKey="_id"
                size="middle"
                pagination={false}
                columns={[
                  {
                    title: 'Khóa học',
                    dataIndex: 'title',
                    key: 'title',
                    render: (title) => <Text strong>{title}</Text>
                  },
                  {
                    title: 'Cấp độ',
                    dataIndex: 'level',
                    key: 'level',
                    width: 100,
                    render: (level) => {
                      const colors = {
                        Beginner: 'green',
                        Intermediate: 'orange',
                        Advanced: 'red',
                        Expert: 'purple'
                      };
                      return <Tag color={colors[level]}>{level}</Tag>;
                    }
                  },
                  {
                    title: 'Trạng thái',
                    dataIndex: 'status',
                    key: 'status',
                    width: 100,
                    render: (status) => {
                      const colors = {
                        Draft: 'default',
                        Active: 'success',
                        Inactive: 'warning'
                      };
                      return <Tag color={colors[status]}>{status}</Tag>;
                    }
                  }
                ]}
              />
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
