# Routes Documentation

## 📁 Structure

```
routes/
├── index.js          # Main routes component
├── paths.js          # Route path constants
├── routeConfig.js    # Route configuration with metadata
└── README.md         # This file
```

## 🎯 Usage

### 1. Adding a New Route

**Step 1: Add path constant** (`paths.js`)
```javascript
export const USER_ROUTES = {
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings', // New route
};
```

**Step 2: Add route config** (`routeConfig.js`)
```javascript
{
  path: '/settings',
  component: Settings,
  type: 'private',
  title: 'Cài đặt',
}
```

**Step 3: Add route** (`index.js`)
```javascript
<Route path="/settings" element={
  <PrivateRoute>
    <Settings />
  </PrivateRoute>
} />
```

### 2. Route Types

- **public**: Accessible without authentication (e.g., login, register)
- **private**: Requires authentication (e.g., dashboard, profile)
- **admin**: Requires admin role (e.g., user management)

### 3. Using Path Constants

```javascript
import { USER_ROUTES, AUTH_ROUTES } from './routes/paths';

// In components
navigate(USER_ROUTES.DASHBOARD);
navigate(AUTH_ROUTES.LOGIN);

// In Links
<Link to={USER_ROUTES.PROFILE}>Profile</Link>
```

### 4. Route Protection

Routes are protected by wrapper components:

- `<PublicRoute>` - Redirects to dashboard if already logged in
- `<PrivateRoute>` - Redirects to login if not authenticated
- `<AdminRoute>` - Redirects to dashboard if not admin

## 📋 Current Routes

### Auth Routes (`/auth/*`)
- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/auth/verify-otp` - OTP verification
- `/auth/forgot-password` - Forgot password
- `/auth/reset-password` - Reset password

### User Routes
- `/dashboard` - User dashboard
- `/profile` - User profile

### Admin Routes (`/admin/*`)
- `/admin/users` - User management

### Legacy Redirects
- `/login` → `/auth/login`
- `/register` → `/auth/register`
- `/verify-otp` → `/auth/verify-otp`
- `/forgot-password` → `/auth/forgot-password`
- `/reset-password` → `/auth/reset-password`

## 🔧 Maintenance

### Adding Admin Routes

1. Add to `ADMIN_ROUTES` in `paths.js`
2. Add to `routeConfig.js` with `type: 'admin'`
3. Add route in `index.js` wrapped with `<AdminRoute>`
4. Update Navbar if needed

### Removing Routes

1. Remove from `paths.js`
2. Remove from `routeConfig.js`
3. Remove from `index.js`
4. Update any components using the route

## 🎨 Best Practices

1. **Always use path constants** instead of hardcoded strings
2. **Group related routes** (auth, user, admin)
3. **Add comments** for route sections
4. **Keep route config updated** when adding/removing routes
5. **Use meaningful route names** that describe the page

## 📝 Examples

### Navigate Programmatically
```javascript
import { useNavigate } from 'react-router-dom';
import { USER_ROUTES } from '../routes/paths';

const navigate = useNavigate();
navigate(USER_ROUTES.DASHBOARD);
```

### Link Component
```javascript
import { Link } from 'react-router-dom';
import { AUTH_ROUTES } from '../routes/paths';

<Link to={AUTH_ROUTES.LOGIN}>Login</Link>
```

### Conditional Rendering
```javascript
import { isAdminRoute, isAuthRoute } from '../routes/paths';

if (isAdminRoute(location.pathname)) {
  // Show admin layout
}
```
