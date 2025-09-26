import { Button, Space, Typography } from 'antd'
import { ModalForm, ProFormText } from '@ant-design/pro-components'

const OtpModal = ({
  open,
  email,
  onClose,
  onVerify,
  onResend,
  verifying,
  resending,
}) => {
  return (
    <ModalForm
      title="Enter OTP"
      open={open}
      modalProps={{
        destroyOnHidden: true,
        onCancel: onClose,
        footer: null,
      }}
      submitter={false}
      onFinish={async (values) => {
        await onVerify(values.otp)
        return true
      }}
    >
      <Typography.Paragraph>
        We have sent an OTP code to{' '}
        <Typography.Text strong>{email}</Typography.Text>. Please enter the code to
        complete verification.
      </Typography.Paragraph>

      <ProFormText
        name="otp"
        label="OTP code"
        placeholder="Enter 6 digits"
        rules={[
          { required: true, message: 'Please enter the OTP code' },
          { len: 6, message: 'OTP must be exactly 6 digits' },
        ]}
        fieldProps={{
          maxLength: 6,
          inputMode: 'numeric',
          autoFocus: true,
        }}
      />

      <Space
        style={{
          width: '100%',
          justifyContent: 'space-between',
          marginTop: 16,
        }}
      >
        <Button type="link" onClick={onResend} loading={resending}>
          Resend code
        </Button>
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={verifying}>
            Verify
          </Button>
        </Space>
      </Space>
    </ModalForm>
  )
}

export default OtpModal
