import { Button, Space, Steps, Typography, App } from 'antd'
import { ModalForm, ProFormText } from '@ant-design/pro-components'
import { useEffect, useMemo, useState } from 'react'
import { requestPasswordReset, resetPassword } from '../../api/auth'
import { useAuthContext } from '../../context/AuthContext'

const ForgotPasswordModal = ({ open, onClose, initialEmail = '' }) => {
  const { message } = App.useApp()
  const { setAuthState } = useAuthContext()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (!open) {
      setStep(1)
      setEmail('')
      setLoading(false)
      setResending(false)
    }
  }, [open])

  const handleRequest = async (values) => {
    setLoading(true)
    const normalizedEmail = values.email.trim().toLowerCase()
    try {
      await requestPasswordReset({ email: normalizedEmail })
      setEmail(normalizedEmail)
      setStep(2)
      message.success('OTP sent, please check your inbox')
      return true
    } catch (error) {
      const apiMessage = error?.response?.data?.message
      message.error(apiMessage || 'Unable to send OTP, please try again later')
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (values) => {
    if (!email) {
      message.error('Please enter an email first')
      return false
    }
    setLoading(true)
    try {
      const data = await resetPassword({
        email,
        otp: values.otp,
        newPassword: values.newPassword,
      })
      setAuthState({ nextUser: data.user, nextToken: data.token })
      message.success(data.message || 'Password reset successfully')
      onClose?.()
      return true
    } catch (error) {
      const apiMessage = error?.response?.data?.message
      message.error(apiMessage || 'Unable to reset password')
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) {
      message.error('Email must be provided before requesting an OTP')
      return
    }
    setResending(true)
    try {
      await requestPasswordReset({ email })
      message.success('OTP resent')
    } catch (error) {
      const apiMessage = error?.response?.data?.message
      message.error(apiMessage || 'Failed to resend OTP')
    } finally {
      setResending(false)
    }
  }

  const stepsItems = useMemo(
    () => [
      { title: 'Enter email', description: 'We will send an OTP code to this email' },
      { title: 'Verify OTP', description: 'Enter the code and your new password' },
    ],
    []
  )

  return (
    <ModalForm
      title="Forgot password"
      open={open}
      submitter={false}
      modalProps={{
        destroyOnClose: true,
        onCancel: onClose,
        footer: null,
      }}
      onFinish={step === 1 ? handleRequest : handleReset}
    >
      <Steps
        current={step - 1}
        items={stepsItems}
        size="small"
        style={{ marginBottom: 24 }}
      />

      {step === 1 && (
        <>
          <ProFormText
            name="email"
            label="Email"
            initialValue={initialEmail}
            placeholder="you@example.com"
            rules={[
              { required: true, message: 'Please enter an email address' },
              { type: 'email', message: 'Please enter a valid email address' },
            ]}
          />
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Send OTP
            </Button>
          </Space>
        </>
      )}

      {step === 2 && (
        <>
          <Typography.Paragraph>
            OTP has been sent to <Typography.Text strong>{email}</Typography.Text>.
          </Typography.Paragraph>

          <ProFormText
            name="otp"
            label="OTP code"
            placeholder="Enter 6 digits"
            rules={[
              { required: true, message: 'Please enter the OTP code' },
              { len: 6, message: 'OTP must be exactly 6 digits' },
            ]}
            fieldProps={{ maxLength: 6, inputMode: 'numeric' }}
          />

          <ProFormText.Password
            name="newPassword"
            label="New password"
            placeholder="Enter your new password"
            rules={[
              { required: true, message: 'Please enter a new password' },
              { min: 6, message: 'Password must be at least 6 characters' },
            ]}
          />

          <ProFormText.Password
            name="confirmPassword"
            label="Confirm password"
            placeholder="Re-enter your new password"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('Passwords do not match'))
                },
              }),
            ]}
          />

          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button type="link" onClick={handleResend} loading={resending}>
              Resend OTP
            </Button>
            <Space>
              <Button onClick={() => setStep(1)}>Back</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Confirm
              </Button>
            </Space>
          </Space>
        </>
      )}
    </ModalForm>
  )
}

export default ForgotPasswordModal
