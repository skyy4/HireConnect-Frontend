import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/UI';

export default function OAuthRedirect() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const refreshToken = params.get('refreshToken');

    if (token) {
      const u = signIn({ token, refreshToken });
      if (u?.role === 'RECRUITER') {
        navigate('/recruiter/dashboard', { replace: true });
      } else {
        navigate('/jobs', { replace: true });
      }
    } else {
      navigate('/login', { replace: true });
    }
  }, [location.search, navigate, signIn]);

  return (
    <div className="full-screen-center">
      <LoadingSpinner />
      <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Authenticating...</p>
    </div>
  );
}
