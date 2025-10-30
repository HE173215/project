import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { GoogleOAuthProvider } from './components/auth';
import AppProviders from './context/AppProviders';
import AppRoutes from './routes/AppRoutes';

/**
 * Main App Component
 * 
 * Structure:
 * - ConfigProvider: Ant Design theme configuration
 * - App: Ant Design App component for static methods (message, notification)
 * - GoogleOAuthProvider: Google OAuth setup
 * - AppProviders: All context providers (Auth, Course, Class, etc.)
 * - Router: React Router setup
 * - AppRoutes: All application routes with role-based access
 */
function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
        },
      }}
    >
      <AntApp>
        <GoogleOAuthProvider>
          <AppProviders>
            <Router
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <AppRoutes />
            </Router>
          </AppProviders>
        </GoogleOAuthProvider>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
