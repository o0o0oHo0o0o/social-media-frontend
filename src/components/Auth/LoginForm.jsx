import React, { useState } from 'react';
import '../../styles/auth.css';
import '../../styles/input.css';
import '../../styles/button.css';
import { Mail, Lock, X } from 'lucide-react';
import Input from '../Common/Input';
import Button from '../Common/Button';
import SocialButton from '../Common/SocialButton';
import { validateEmail, validatePhone } from '../../utils/validation';
import api from '../../services/api';
import { CONFIG } from '../../config/constants';

const LoginForm = ({ onSwitchToRegister, onLoginSuccess, hideHeader = false, hideSocial = false }) => {
  const [formData, setFormData] = useState({ identifier: '', password: '', rememberMe: false });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});

  const handleForgotPassword = () => {
    // TODO: Implement forgot password logic
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'identifier': {
        const isEmail = validateEmail(value);
        const isPhone = validatePhone(value);
        const isUsername = typeof value === 'string' && value.trim().length >= 3;
        return (!isEmail && !isPhone && !isUsername) ? 'Enter email, phone (+84/0...) or username' : '';
      }
      case 'password':
        return value.length < 8 ? 'Password must be at least 8 characters' : '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));

    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {
      identifier: validateField('identifier', formData.identifier),
      password: validateField('password', formData.password)
    };

    setErrors(newErrors);
    setTouched({ identifier: true, password: true });

    if (Object.values(newErrors).some(err => err)) return;

    setLoading(true);
    try {
      await api.login({
        identifier: formData.identifier,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });
      if (formData.rememberMe) {
        try { localStorage.setItem('autoLogin', '1'); } catch (e) { }
      } else {
        try { localStorage.removeItem('autoLogin'); } catch (e) { }
      }
      onLoginSuccess();
    } catch (err) {
      setErrors(prev => ({ ...prev, submit: err.message }));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    window.location.href = CONFIG.OAUTH_REDIRECT[provider.toUpperCase()];
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {!hideHeader && (
        <div className="form-header">
          <h2>Welcome Back</h2>
          <p>Sign in to continue to your account</p>
        </div>
      )}

      <Input
        icon={Mail}
        type="text"
        name="identifier"
        placeholder="Email, username hoặc số điện thoại (+84/0...)"
        value={formData.identifier}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.identifier && errors.identifier}
      />

      <Input
        icon={Lock}
        type="password"
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.password && errors.password}
      />

      <div className="remember-forgot">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="rememberMe"
            checked={formData.rememberMe}
            onChange={handleChange}
          />
          <span>Remember me</span>
        </label>
        <button type="button" onClick={handleForgotPassword} className="link-btn">Forgot password?</button>
      </div>

      {errors.submit && (
        <div className="error-message">
          <X size={16} />
          {errors.submit}
        </div>
      )}

      <Button type="submit" loading={loading} loadingText="Đang đăng nhập…">
        Sign In
      </Button>

      {!hideSocial && (
        <>
          <div className="divider">
            <span>Or continue with</span>
          </div>
          <div className="social-buttons">
            <SocialButton provider="google" onClick={() => handleSocialLogin('google')} />
            <SocialButton provider="facebook" onClick={() => handleSocialLogin('facebook')} />
          </div>
        </>
      )}

      <div className="form-footer">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitchToRegister} className="link-btn primary">
          Sign up
        </button>
      </div>
    </form>
  );
};

export default LoginForm;