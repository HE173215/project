import { ConfigProvider, App as AntdApp } from "antd"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import AuthPage from "./pages/AuthPage"
import HomePage from "./pages/HomePage"
import { AuthProvider } from "./context/AuthContext"

const App = () => (
  <ConfigProvider
    theme={{ token: { colorPrimary: "#1677ff" } }}
  >
    <AntdApp>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route path="/home/*" element={<HomePage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AntdApp>
  </ConfigProvider>
)

export default App
