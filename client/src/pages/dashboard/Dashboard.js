import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Progress } from 'antd';
import {
  BookOutlined,
  TeamOutlined,
  FileTextOutlined,
  CheckSquareOutlined,
  TrophyOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useCourse } from '../../context/CourseContext';
import { useClass } from '../../context/ClassContext';
import { useEnrollment } from '../../context/EnrollmentContext';
import { useAssessment } from '../../context/AssessmentContext';
import moment from 'moment';

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
      <div>
        <h2>Chào mừng, {user?.fullName || user?.username}!</h2>
        
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Lớp học đang tham gia"
                value={stats.myEnrollments}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Bài tập chưa nộp"
                value={stats.pendingAssessments}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Điểm trung bình"
                value={85}
                suffix="/ 100"
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tỷ lệ tham gia"
                value={92}
                suffix="%"
                prefix={<CheckSquareOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} lg={12}>
            <Card title="Lớp học của tôi">
              <Table
                dataSource={myEnrollments}
                rowKey="_id"
                size="small"
                pagination={false}
                columns={[
                  {
                    title: 'Lớp học',
                    dataIndex: ['class', 'title'],
                    key: 'class'
                  },
                  {
                    title: 'Trạng thái',
                    dataIndex: 'status',
                    key: 'status',
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
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="Bài tập gần đây">
              <Table
                dataSource={myAssessments?.slice(0, 5)}
                rowKey="_id"
                size="small"
                pagination={false}
                columns={[
                  {
                    title: 'Bài tập',
                    dataIndex: 'title',
                    key: 'title'
                  },
                  {
                    title: 'Trạng thái',
                    dataIndex: 'status',
                    key: 'status',
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
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  // Admin/Manager/Lecturer Dashboard
  return (
    <div>
      <h2>Chào mừng, {user?.fullName || user?.username}!</h2>
      
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng khóa học"
              value={stats.totalCourses}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng lớp học"
              value={stats.totalClasses}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Sinh viên đang học"
              value={245}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Giảng viên"
              value={18}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Lớp học gần đây">
            <Table
              dataSource={classes?.slice(0, 5)}
              rowKey="_id"
              size="small"
              pagination={false}
              columns={[
                {
                  title: 'Tên lớp',
                  dataIndex: 'title',
                  key: 'title'
                },
                {
                  title: 'Sĩ số',
                  key: 'students',
                  render: (_, record) => `${record.currentStudents}/${record.maxStudents}`
                },
                {
                  title: 'Trạng thái',
                  dataIndex: 'status',
                  key: 'status',
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
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Khóa học phổ biến">
            <Table
              dataSource={courses?.slice(0, 5)}
              rowKey="_id"
              size="small"
              pagination={false}
              columns={[
                {
                  title: 'Khóa học',
                  dataIndex: 'title',
                  key: 'title'
                },
                {
                  title: 'Cấp độ',
                  dataIndex: 'level',
                  key: 'level',
                  render: (level) => <Tag>{level}</Tag>
                },
                {
                  title: 'Trạng thái',
                  dataIndex: 'status',
                  key: 'status',
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
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
