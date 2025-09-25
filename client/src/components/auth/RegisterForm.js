import { LoginForm, ProFormText } from '@ant-design/pro-components'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { App } from 'antd'
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
      <LoginForm
        title="Register"
        subTitle="Create a new account"
        onFinish={handleSubmit}
        submitter={{
          searchConfig: {
            submitText: 'Register',
          },
        }}
      >
        <ProFormText
          name="fullName"
          fieldProps={{
            size: 'large',
            prefix: <UserOutlined />,
          }}
          placeholder="John Doe"
          rules={[{ required: true, message: 'Please enter your full name' }]}
        />
        <ProFormText
          name="email"
          fieldProps={{
            size: 'large',
            prefix: <UserOutlined />,
          }}
          placeholder="you@example.com"
          rules={[
            { required: true, message: 'Please enter an email address' },
            { type: 'email', message: 'Please enter a valid email address' },
          ]}
        />
        <ProFormText.Password
          name="password"
          fieldProps={{
            size: 'large',
            prefix: <LockOutlined />,
          }}
          placeholder="Password"
          rules={[
            { required: true, message: 'Please enter a password' },
            { min: 6, message: 'Password must be at least 6 characters' },
          ]}
        />
        <ProFormText.Password
          name="confirmPassword"
          fieldProps={{
            size: 'large',
            prefix: <LockOutlined />,
          }}
          placeholder="Confirm password"
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
        />
      </LoginForm>
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
