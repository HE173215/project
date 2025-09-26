import { useMemo } from 'react'
import { Nav } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', path: '/home/dashboard', roles: ['*'] },
  { key: 'messages', label: 'Messages', path: '/home/messages', roles: ['admin', 'manager', 'accountant', 'employee', 'learn'] },
  { key: 'account', label: 'Account', path: '/home/account', roles: ['admin', 'manager', 'accountant', 'employee', 'learn'] },
  { key: 'chart', label: 'Chart', path: '/home/chart', roles: ['admin', 'manager'] },
  { key: 'calendar', label: 'Calendar', path: '/home/calendar', roles: ['admin', 'manager'] },
  { key: 'reports', label: 'Reports', path: '/home/reports', roles: ['admin'] },
  { key: 'departments', label: 'Departments', path: '/home/departments', roles: ['admin', 'manager'] },
  { key: 'users', label: 'Users', path: '/home/users', roles: ['admin', 'manager', 'accountant', 'employee', 'learn'] },
]

const Sidebar = () => {
  const location = useLocation()
  const { user } = useAuthContext()

  const roles = useMemo(
    () => (user?.roles || []).map((role) => (role === 'user' ? 'employee' : role)),
    [user],
  )

  const hasRole = (itemRoles) => {
    if (itemRoles.includes('*')) {
      return true
    }
    return itemRoles.some((role) => roles.includes(role))
  }

  const visibleItems = NAV_ITEMS.filter((item) => hasRole(item.roles))

  return (
    <div
      className="bg-primary text-white d-flex flex-column align-items-center"
      style={{ width: 220, minHeight: '100vh', padding: '20px 0' }}
    >
      <h5 className="mb-4 text-center">YOUR LOGO</h5>
      <Nav className="flex-column w-100 text-center px-2">
        {visibleItems.map((item) => {
          const active = location.pathname.startsWith(item.path)
          const className = [
            'd-block w-100 px-3 py-2 my-1 rounded text-decoration-none',
            active ? 'bg-white text-primary fw-semibold' : 'text-white',
          ].join(' ')

          return (
            <Nav.Link
              key={item.key}
              as={Link}
              to={item.path}
              className={className}
              active={active}
            >
              {item.label}
            </Nav.Link>
          )
        })}
      </Nav>
    </div>
  )
}

export default Sidebar
