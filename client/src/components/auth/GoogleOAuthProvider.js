import React from 'react';
import { GoogleOAuthProvider as GoogleProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const GoogleOAuthProvider = ({ children }) => {
  if (!GOOGLE_CLIENT_ID) {
    console.warn('⚠️ REACT_APP_GOOGLE_CLIENT_ID not configured');
    return children;
  }

  return (
    <GoogleProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleProvider>
  );
};

export default GoogleOAuthProvider;
