import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { App, Button, Form, Input, Typography } from 'antd'
import { useState } from 'react'
import { registerUser, verifyOtp, resendOtp } from '../../api/auth'
import { useAuthContext } from '../../context/AuthContext'
import OtpModal from './OtpModal'

const RegisterFormCustom = () => {
  const { message } = App.useApp()
  const { setAuthState } = useAuthContext()
  const [otpModalOpen, setOtpModalOpen] = useState(false)
  const [targetEmail, setTargetEmail] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [form] = Form.useForm()

  const handleSubmit = async (values) => {
    try {
      const payload = {
        fullName: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      }
      await registerUser(payload)
      setTargetEmail(payload.email)
      setOtpModalOpen(true)
      message.success('Registration successful, please check your email for the OTP')
    } catch (error) {
      const apiMessage = error?.response?.data?.message
      message.error(apiMessage || 'Unable to register, please try again')
    }
  }

  const handleVerify = async (otp) => {
    if (!targetEmail) return
    setVerifying(true)
    try {
      const data = await verifyOtp({ email: targetEmail, otp })
      setAuthState({ nextUser: data.user, nextToken: data.token })
      message.success(data.message || 'Verification successful')
      setOtpModalOpen(false)
    } catch (error) {
      const apiMessage = error?.response?.data?.message
      message.error(apiMessage || 'Invalid OTP code')
    } finally {
      setVerifying(false)
    }
  }

  const handleResend = async () => {
    if (!targetEmail) return
    setResending(true)
    try {
      await resendOtp({ email: targetEmail })
      message.success('OTP resent')
    } catch (error) {
      const apiMessage = error?.response?.data?.message
      message.error(apiMessage || 'Failed to resend OTP')
    } finally {
      setResending(false)
    }
  }

  return (
    <>
      <Form
        form={form}
        layout='vertical'
        size='large'
        className='auth-form-inner'
        onFinish={handleSubmit}
        requiredMark={false}
      >
        <Typography.Title level={4} className='auth-form-title'>
          Register
        </Typography.Title>

        <Form.Item
          label='Full name'
          name='fullName'
          rules={[{ required: true, message: 'Please enter your full name' }]}
        >
          <Input prefix={<UserOutlined />} placeholder='John Doe' autoComplete='name' />
        </Form.Item>

        <Form.Item
          label='Email'
          name='email'
          rules={[
            { required: true, message: 'Please enter an email address' },
            { type: 'email', message: 'Please enter a valid email address' },
          ]}
        >
          <Input prefix={<UserOutlined />} placeholder='you@example.com' autoComplete='email' />
        </Form.Item>

        <Form.Item
          label='Password'
          name='password'
          rules={[
            { required: true, message: 'Please enter a password' },
            { min: 6, message: 'Password must be at least 6 characters' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder='Password'
            autoComplete='new-password'
          />
        </Form.Item>

        <Form.Item
          label='Confirm password'
          name='confirmPassword'
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm your password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('Passwords do not match'))
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder='Confirm password'
            autoComplete='new-password'
          />
        </Form.Item>

        <Button type='primary' htmlType='submit' block>
          Register
        </Button>
      </Form>

      <OtpModal
        open={otpModalOpen}
        email={targetEmail}
        onClose={() => setOtpModalOpen(false)}
        onVerify={handleVerify}
        onResend={handleResend}
        verifying={verifying}
        resending={resending}
      />
    </>
  )
}

export default RegisterFormCustom
