import { LoginForm, ProFormText } from "@ant-design/pro-components"
import { LockOutlined, UserOutlined } from "@ant-design/icons"
import { App } from "antd"
import { useState } from "react"
import { loginUser, verifyOtp, resendOtp } from "../../api/auth"
import { useAuthContext } from "../../context/AuthContext"
import OtpModal from "./OtpModal"
import ForgotPasswordModal from "./ForgotPasswordModal"

const LoginFormCustom = () => {
  const { message } = App.useApp()
  const { setAuthState } = useAuthContext()
  const [otpModalOpen, setOtpModalOpen] = useState(false)
  const [targetEmail, setTargetEmail] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)

  const handleSubmit = async (values) => {
    try {
      const payload = {
        email: values.email.trim().toLowerCase(),
        password: values.password,
      }
      const data = await loginUser(payload)
      setAuthState({ nextUser: data.user, nextToken: data.token })
      message.success("Signed in successfully")
    } catch (error) {
      const status = error?.response?.status
      const apiMessage = error?.response?.data?.message
      const requiresOtp = error?.response?.data?.requiresOtp

      if (status === 403 && requiresOtp) {
        const email = values.email.trim().toLowerCase()
        setTargetEmail(email)
        setOtpModalOpen(true)
        message.info("Account not verified yet, please enter the OTP")
      } else {
        message.error(apiMessage || "Incorrect email or password")
      }
    }
  }

  const handleVerify = async (otp) => {
    if (!targetEmail) return
    setVerifying(true)
    try {
      const data = await verifyOtp({ email: targetEmail, otp })
      setAuthState({ nextUser: data.user, nextToken: data.token })
      message.success(data.message || "Verification successful")
      setOtpModalOpen(false)
    } catch (error) {
      const apiMessage = error?.response?.data?.message
      message.error(apiMessage || "Invalid OTP code")
    } finally {
      setVerifying(false)
    }
  }

  const handleResend = async () => {
    if (!targetEmail) return
    setResending(true)
    try {
      await resendOtp({ email: targetEmail })
      message.success("OTP resent")
    } catch (error) {
      const apiMessage = error?.response?.data?.message
      message.error(apiMessage || "Failed to resend OTP")
    } finally {
      setResending(false)
    }
  }

  return (
    <>
      <LoginForm
        title="Sign in"
        subTitle="Enter your email and password to continue"
        onFinish={handleSubmit}
        submitter={{
          searchConfig: {
            submitText: "Sign in",
          },
        }}
      >
        <ProFormText
          name="email"
          fieldProps={{
            size: "large",
            prefix: <UserOutlined />,
          }}
          placeholder="you@example.com"
          rules={[
            { required: true, message: "Please enter an email address" },
            { type: "email", message: "Please enter a valid email address" },
          ]}
        />
        <ProFormText.Password
          name="password"
          fieldProps={{
            size: "large",
            prefix: <LockOutlined />,
          }}
          placeholder="Password"
          rules={[{ required: true, message: "Please enter a password" }]}
        />
        <a className="forgot-link" onClick={() => setForgotOpen(true)}>
          Forgot your password?
        </a>
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
      <ForgotPasswordModal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        initialEmail={targetEmail}
      />
    </>
  )
}

export default LoginFormCustom
