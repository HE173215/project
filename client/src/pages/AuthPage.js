import { Card, Tabs, Typography } from 'antd'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginFormCustom from '../components/auth/LoginForm'
import RegisterFormCustom from '../components/auth/RegisterForm'
import { useAuthContext } from '../context/AuthContext'
import '../style/AuthPage.css'

const AuthPage = () => {
  const { user } = useAuthContext()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/home', { replace: true })
    }
  }, [user, navigate])

  return (
    <div className="auth-container">
      <Card className="auth-card" bordered={false}>
        <div className="auth-header">
          <Typography.Title level={3}>Welcome!</Typography.Title>
          <Typography.Text>Register or sign in to continue.</Typography.Text>
        </div>
        <Tabs
          defaultActiveKey="login"
          centered
          items={[
            {
              key: 'login',
              label: 'Sign in',
              children: (
                <div className="auth-form">
                  <LoginFormCustom />
                </div>
              ),
            },
            {
              key: 'register',
              label: 'Register',
              children: (
                <div className="auth-form">
                  <RegisterFormCustom />
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}

export default AuthPage
