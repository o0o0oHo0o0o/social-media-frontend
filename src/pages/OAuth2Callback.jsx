import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function OAuth2Callback({ onAuthSuccess }) {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const handleOAuth2Success = async () => {
      try {
        // Delay để browser kịp lưu cookies sau OAuth2 redirect
        await new Promise(resolve => setTimeout(resolve, 300));

        // Thử refresh access token trước (dùng refresh cookie)
        try {
          await api.refresh();
        } catch (e) { /* ignore */ }

        // Kiểm tra session hiện tại sau OAuth2 redirect
        const user = await api.me();

        if (!mounted) return;

        if (user) {
          // Đăng nhập thành công, lưu autoLogin và chuyển dashboard
          try {
            localStorage.setItem('autoLogin', '1');
          } catch (e) {
            console.warn('Failed to set autoLogin:', e);
          }

          if (typeof onAuthSuccess === 'function') {
            onAuthSuccess();
          }
        } else {
          setError('Authentication failed. Please try again.');
          setTimeout(() => {
            navigate('/auth', { replace: true });
          }, 2000);
        }
      } catch (err) {
        if (!mounted) return;
        console.error('OAuth2 callback error:', err);
        setError('Authentication failed. Redirecting...');
        setTimeout(() => {
          navigate('/auth', { replace: true });
        }, 2000);
      }
    };

    handleOAuth2Success();

    return () => {
      mounted = false;
    };
  }, [onAuthSuccess]);

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '1.2rem', color: '#ef4444' }}>{error}</div>
        <div style={{ fontSize: '0.9rem', color: '#999' }}>Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      gap: '1rem'
    }}>
      <div className="spinner" style={{
        width: '40px',
        height: '40px',
        border: '4px solid rgba(255,255,255,0.1)',
        borderTopColor: '#3b82f6',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }}></div>
      <div style={{ fontSize: '1rem', color: '#999' }}>Completing login...</div>
    </div>
  );
}
