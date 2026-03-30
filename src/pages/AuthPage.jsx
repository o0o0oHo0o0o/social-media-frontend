import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { CONFIG } from '../config/constants';
import '../styles/base.css';
import '../styles/auth.css';
import '../styles/form.css';
import '../styles/responsive.css';
import LoginForm from '../components/Auth/LoginForm';
import RegisterForm from '../components/Auth/RegisterForm';
import OTPVerification from '../components/Auth/OTPVerification';
import SocialButton from '../components/Common/SocialButton';

const AuthPage = ({ isDark, onToggleDark, onAuthSuccess }) => {
  const [mode, setMode] = useState('login');
  const [showOTP, setShowOTP] = useState(false);
  const [shouldAutoSend, setShouldAutoSend] = useState(false);
  const [registeredIdentifier, setRegisteredIdentifier] = useState('');
  const [registeredChannel, setRegisteredChannel] = useState('EMAIL');
  const handleSwitch = (newMode) => {
    setMode(newMode);
  };

  const handleRegisterSuccess = ({ identifier, channel }) => {
    setRegisteredIdentifier(identifier);
    setRegisteredChannel(channel || 'EMAIL');
    setShowOTP(true);
    // Lần đầu vào màn OTP sau đăng ký thì auto gửi mã
    setShouldAutoSend(true);
  };

  const handleVerifySuccess = () => {
    if (typeof onAuthSuccess === 'function') {
      onAuthSuccess();
    } else {
      window.location.href = '/dashboard';
    }
  };

  const handleLoginSuccess = () => {
    if (typeof onAuthSuccess === 'function') {
      onAuthSuccess();
    } else {
      window.location.href = '/dashboard';
    }
  };

  const handleSocialLogin = (provider) => {
    window.location.href = CONFIG.OAUTH_REDIRECT[provider.toUpperCase()];
  };

  const rightTitle = showOTP ? 'Xác thực OTP' : (mode === 'login' ? 'Welcome Back' : 'Create Account');
  const rightSubtitle = showOTP
    ? 'Chúng tôi đã gửi mã OTP, vui lòng kiểm tra và nhập để tiếp tục.'
    : (mode === 'login' ? 'Đăng nhập để tiếp tục trải nghiệm.' : 'Tham gia cộng đồng của chúng tôi ngay hôm nay.');

  return (
    <div className="auth-page">
      <button className="theme-toggle" onClick={onToggleDark}>
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      <div className={`auth-card split ${showOTP ? 'show-otp' : ''}`}>
        <div className="auth-columns">
          <div className="auth-left">
            {/* Tabs chuyển đổi Sign In / Sign Up */}
            {!showOTP && (
              <div className="auth-tabs" role="tablist" aria-label="Auth switcher">
                <button
                  role="tab"
                  aria-selected={mode === 'login'}
                  className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                  onClick={() => {
                    if (mode !== 'login') {
                      setShowOTP(false);
                      handleSwitch('login');
                    }
                  }}
                >
                  Sign In
                </button>
                <button
                  role="tab"
                  aria-selected={mode === 'register'}
                  className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                  onClick={() => {
                    if (mode !== 'register') {
                      setShowOTP(false);
                      handleSwitch('register');
                    }
                  }}
                >
                  Sign Up
                </button>
              </div>
            )}

            {!showOTP ? (
              <>
                {mode === 'login' ? (
                  <LoginForm
                    hideHeader
                    hideSocial
                    onSwitchToRegister={() => handleSwitch('register')}
                    onLoginSuccess={handleLoginSuccess}
                  />
                ) : (
                  <RegisterForm
                    hideHeader
                    hideSocial
                    onSwitchToLogin={() => handleSwitch('login')}
                    onRegisterSuccess={handleRegisterSuccess}
                  />
                )}
              </>
            ) : (
              <OTPVerification
                identifier={registeredIdentifier}
                channel={registeredChannel}
                onVerify={handleVerifySuccess}
                onResend={() => { }}
                onBack={() => {
                  setShowOTP(false);
                  setShouldAutoSend(false);
                }}
                useFirebasePhone={registeredChannel === 'SMS'}
                autoSend={shouldAutoSend}
              />
            )}
          </div>

          <div className="auth-right">
            <div className="welcome-block">
              <h3>{rightTitle}</h3>
              <p>{rightSubtitle}</p>
            </div>
            <div className="social-section">
              <div className="divider"><span>Hoặc tiếp tục với</span></div>
              <div className="social-buttons">
                <SocialButton provider="google" onClick={() => handleSocialLogin('google')} />
                <SocialButton provider="facebook" onClick={() => handleSocialLogin('facebook')} />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* reCAPTCHA container removed (no Firebase phone auth) */}
      <div className="auth-footer">
        <p>© 2025 {CONFIG.APP_NAME}. All rights reserved.</p>
      </div>
    </div>
  );
};

export default AuthPage;