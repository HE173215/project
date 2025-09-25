import { Nav } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', path: '/home/dashboard' },
  { key: 'messages', label: 'Messages', path: '/home/messages' },
  { key: 'account', label: 'Account', path: '/home/account' },
  { key: 'chart', label: 'Chart', path: '/home/chart' },
  { key: 'calendar', label: 'Calendar', path: '/home/calendar' },
  { key: 'reports', label: 'Reports', path: '/home/reports' },
  { key: 'departments', label: 'Departments', path: '/home/departments' },
]

const Sidebar = () => {
  const location = useLocation()

  const isActive = (path) => location.pathname.startsWith(path)

  return (
    <div
      className="bg-primary text-white d-flex flex-column align-items-center"
      style={{ width: 220, minHeight: '100vh', padding: '20px 0' }}
    >
      <h5 className="mb-4 text-center">YOUR LOGO</h5>
      <Nav className="flex-column w-100 text-center px-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path)
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
