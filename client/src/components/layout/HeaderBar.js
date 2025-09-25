import { useMemo } from 'react'
import { Button, Form, FormControl, Nav, Navbar } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'

const HeaderBar = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuthContext()

  const greeting = useMemo(() => {
    if (!user) {
      return 'Welcome'
    }
    return user.fullName || user.email || 'Welcome'
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <Navbar bg="light" className="px-3 py-2 shadow-sm" expand="sm">
      <Form className="d-none d-md-flex">
        <FormControl type="search" placeholder="Search" className="me-2" />
      </Form>
      <Nav className="ms-auto align-items-center">
        <span className="me-3 text-muted">Hi, {greeting}</span>
        <Button variant="outline-primary" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </Nav>
    </Navbar>
  )
}

export default HeaderBar
