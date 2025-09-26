import { Navigate, Outlet, Route, Routes } from "react-router-dom"
import Sidebar from "../components/layout/Sidebar"
import HeaderBar from "../components/layout/HeaderBar"
import FooterBar from "../components/layout/FooterBar"
import DepartmentPage from "./DepartmentPage"
import UserManagementPage from "./UserManagementPage"
import { DepartmentProvider } from "../context/DepartmentContext"
import { UserProvider } from "../context/UserContext"

const Placeholder = ({ title }) => (
  <div
    className="d-flex flex-column align-items-center justify-content-center text-center text-muted"
    style={{ minHeight: "60vh" }}
  >
    <h4 className="mb-2">{title}</h4>
    <p className="mb-0">This area is under construction.</p>
  </div>
)

const HomeLayout = () => {
  return (
    <div className="d-flex min-vh-100" style={{ background: "#f5f5f5" }}>
      <Sidebar />
      <div className="flex-grow-1 d-flex flex-column w-100" style={{ maxWidth: "100%" }}>
        <HeaderBar />
        <main
          className="flex-grow-1 p-4"
          style={{ background: "#f5f5f5", minHeight: 0, width: "100%" }}
        >
          <Outlet />
        </main>
        <FooterBar />
      </div>
    </div>
  )
}

const HomePage = () => {
  return (
    <Routes>
      <Route path="/" element={<HomeLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Placeholder title="Dashboard" />} />
        <Route path="messages" element={<Placeholder title="Messages" />} />
        <Route path="account" element={<Placeholder title="Account" />} />
        <Route path="chart" element={<Placeholder title="Chart" />} />
        <Route path="calendar" element={<Placeholder title="Calendar" />} />
        <Route path="reports" element={<Placeholder title="Reports" />} />
        <Route
          path="departments"
          element={
            <DepartmentProvider>
              <DepartmentPage />
            </DepartmentProvider>
          }
        />
        <Route
          path="users"
          element={
            <UserProvider>
              <UserManagementPage />
            </UserProvider>
          }
        />
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  )
}

export default HomePage
