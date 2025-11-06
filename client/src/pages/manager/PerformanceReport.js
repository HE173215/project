import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Space,
  Progress,
  Tag
} from 'antd';
import {
  UserOutlined,
  BookOutlined,
  TeamOutlined,
  TrophyOutlined,
  ReloadOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const PerformanceReport = () => {
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalCourses: 0,
    avgGrade: 0
  });
  const [classPerformance, setClassPerformance] = useState([]);
  const [teacherPerformance, setTeacherPerformance] = useState([]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadClassPerformance(),
        loadTeacherPerformance()
      ]);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Load classes
      const classesRes = await api.get('/classes');
      const classes = classesRes.data.data || [];

      // Load enrollments
      const enrollmentsRes = await api.get('/enrollments');
      const enrollments = enrollmentsRes.data.data || [];

      // Load courses
      const coursesRes = await api.get('/courses');
      const courses = coursesRes.data.data || [];

      // Calculate stats
      const totalStudents = new Set(enrollments.map(e => e.student?._id)).size;
      const gradesWithValue = enrollments.filter(e => e.finalGrade > 0);
      const avgGrade = gradesWithValue.length > 0
        ? gradesWithValue.reduce((sum, e) => sum + e.finalGrade, 0) / gradesWithValue.length
        : 0;

      setStats({
        totalClasses: classes.length,
        totalStudents,
        totalCourses: courses.length,
        avgGrade: avgGrade.toFixed(2)
      });
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const loadClassPerformance = async () => {
    try {
      const classesRes = await api.get('/classes');
      const classes = classesRes.data.data || [];

      const enrollmentsRes = await api.get('/enrollments');
      const enrollments = enrollmentsRes.data.data || [];

      const performance = classes.map(cls => {
        const classEnrollments = enrollments.filter(
          e => e.class?._id === cls._id && e.status === 'Approved'
        );

        const gradesWithValue = classEnrollments.filter(e => e.finalGrade > 0);
        const avgGrade = gradesWithValue.length > 0
          ? gradesWithValue.reduce((sum, e) => sum + e.finalGrade, 0) / gradesWithValue.length
          : 0;

        const avgAttendance = classEnrollments.length > 0
          ? classEnrollments.reduce((sum, e) => sum + (e.attendanceRate || 0), 0) / classEnrollments.length
          : 0;

        return {
          _id: cls._id,
          className: cls.title,
          course: cls.course?.title || 'N/A',
          teacher: cls.teacher?.name || 'N/A',
          totalStudents: classEnrollments.length,
          avgGrade: avgGrade.toFixed(2),
          avgAttendance: avgAttendance.toFixed(2),
          status: cls.status
        };
      });

      setClassPerformance(performance);
    } catch (error) {
      console.error('Load class performance error:', error);
    }
  };

  const loadTeacherPerformance = async () => {
    try {
      const teachersRes = await api.get('/teachers');
      const teachers = teachersRes.data.data || [];

      const classesRes = await api.get('/classes');
      const classes = classesRes.data.data || [];

      const enrollmentsRes = await api.get('/enrollments');
      const enrollments = enrollmentsRes.data.data || [];

      const performance = teachers.map(teacher => {
        const teacherClasses = classes.filter(
          c => c.teacher?._id === teacher._id
        );

        const teacherEnrollments = enrollments.filter(e =>
          teacherClasses.some(c => c._id === e.class?._id) && e.status === 'Approved'
        );

        const gradesWithValue = teacherEnrollments.filter(e => e.finalGrade > 0);
        const avgGrade = gradesWithValue.length > 0
          ? gradesWithValue.reduce((sum, e) => sum + e.finalGrade, 0) / gradesWithValue.length
          : 0;

        return {
          _id: teacher._id,
          teacherName: teacher.name || teacher.user?.fullName,
          department: teacher.department || 'N/A',
          totalClasses: teacherClasses.length,
          totalStudents: teacherEnrollments.length,
          avgGrade: avgGrade.toFixed(2)
        };
      });

      setTeacherPerformance(performance.filter(t => t.totalClasses > 0));
    } catch (error) {
      console.error('Load teacher performance error:', error);
    }
  };

  const classColumns = [
    {
      title: 'Lớp học',
      dataIndex: 'className',
      key: 'className'
    },
    {
      title: 'Khóa học',
      dataIndex: 'course',
      key: 'course'
    },
    {
      title: 'Giảng viên',
      dataIndex: 'teacher',
      key: 'teacher'
    },
    {
      title: 'Số SV',
      dataIndex: 'totalStudents',
      key: 'totalStudents',
      width: 80
    },
    {
      title: 'Điểm TB',
      dataIndex: 'avgGrade',
      key: 'avgGrade',
      width: 100,
      render: (grade) => (
        <Tag color={grade >= 8 ? 'green' : grade >= 6.5 ? 'blue' : grade >= 5 ? 'orange' : 'red'}>
          {grade}
        </Tag>
      )
    },
    {
      title: 'Tỷ lệ tham gia',
      dataIndex: 'avgAttendance',
      key: 'avgAttendance',
      width: 150,
      render: (rate) => (
        <Progress
          percent={parseFloat(rate)}
          size="small"
          status={rate >= 80 ? 'success' : rate >= 60 ? 'normal' : 'exception'}
        />
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
          Completed: 'blue',
          Cancelled: 'error'
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      }
    }
  ];

  const teacherColumns = [
    {
      title: 'Giảng viên',
      dataIndex: 'teacherName',
      key: 'teacherName'
    },
    {
      title: 'Khoa',
      dataIndex: 'department',
      key: 'department'
    },
    {
      title: 'Số lớp',
      dataIndex: 'totalClasses',
      key: 'totalClasses',
      width: 100
    },
    {
      title: 'Tổng SV',
      dataIndex: 'totalStudents',
      key: 'totalStudents',
      width: 100
    },
    {
      title: 'Điểm TB',
      dataIndex: 'avgGrade',
      key: 'avgGrade',
      width: 120,
      render: (grade) => (
        <Tag color={grade >= 8 ? 'green' : grade >= 6.5 ? 'blue' : grade >= 5 ? 'orange' : 'red'}>
          {grade}
        </Tag>
      )
    }
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Tổng lớp học"
              value={stats.totalClasses}
              prefix={<TeamOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Tổng sinh viên"
              value={stats.totalStudents}
              prefix={<UserOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Tổng khóa học"
              value={stats.totalCourses}
              prefix={<BookOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Điểm trung bình"
              value={stats.avgGrade}
              prefix={<TrophyOutlined />}
              suffix="/ 10"
            />
          </Col>
        </Row>
      </Card>

      <Card
        title="Hiệu suất theo lớp học"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              Làm mới
            </Button>
            <Button icon={<DownloadOutlined />}>
              Xuất báo cáo
            </Button>
          </Space>
        }
        style={{ marginBottom: 16 }}
      >
        <Table
          columns={classColumns}
          dataSource={classPerformance}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Card title="Hiệu suất giảng viên">
        <Table
          columns={teacherColumns}
          dataSource={teacherPerformance}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default PerformanceReport;
