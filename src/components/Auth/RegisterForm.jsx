import React, { useRef, useState } from 'react';
import '../../styles/auth.css';
import '../../styles/input.css';
import '../../styles/button.css';
import { Mail, Lock, User, Check, X } from 'lucide-react';
import Input from '../Common/Input';
import Button from '../Common/Button';
import SocialButton from '../Common/SocialButton';
import { validateEmail, validatePassword, validatePhone } from '../../utils/validation';
import { getRecaptchaToken } from '../../utils/recaptcha';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import api from '../../services/api';
import { CONFIG } from '../../config/constants';

// Local helper toE164 (moved from removed firebase service)
function toE164(rawPhone) {
  if (!rawPhone) return '';
  let s = String(rawPhone).trim();
  s = s.replace(/[^0-9+]/g, '');
  if (s.startsWith('+')) return s;
  if (s.startsWith('00')) return '+' + s.slice(2);
  if (s.startsWith('0')) return '+84' + s.slice(1);
  if (/^\d+$/.test(s)) return '+' + s;
  return s;
}

const RegisterForm = ({ onSwitchToLogin, onRegisterSuccess, hideHeader = false, hideSocial = false }) => {
  const submittingRef = useRef(false);
  const lastSubmitAtRef = useRef(0);
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [formData, setFormData] = useState({
    fullName: '',
    identifier: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({});

  const validateField = (name, value) => {
    switch (name) {
      case 'fullName':
        return value.length < 2 ? 'Name must be at least 2 characters' : '';
      case 'identifier': {
        const isEmail = validateEmail(value);
        const isPhone = validatePhone(value);
        return !isEmail && !isPhone ? 'Invalid email or phone number' : '';
      }
      case 'password':
        const checks = validatePassword(value);
        setPasswordStrength(checks);
        return !Object.values(checks).every(v => v) ? 'Password requirements not met' : '';
      case 'confirmPassword':
        return value !== formData.password ? 'Passwords do not match' : '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

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
    // Chặn double-click/Enter nhanh bằng lock + debounce ngắn
    const now = Date.now();
    if (submittingRef.current || now - lastSubmitAtRef.current < 1200) {
      return;
    }
    submittingRef.current = true;
    lastSubmitAtRef.current = now;
    const newErrors = {
      fullName: validateField('fullName', formData.fullName),
      identifier: validateField('identifier', formData.identifier),
      password: validateField('password', formData.password),
      confirmPassword: validateField('confirmPassword', formData.confirmPassword)
    };

    setErrors(newErrors);
    setTouched({
      fullName: true,
      identifier: true,
      password: true,
      confirmPassword: true
    });

    if (Object.values(newErrors).some(err => err)) return;

    setLoading(true);
    try {
      const channel = validatePhone(formData.identifier) ? 'SMS' : 'EMAIL';
      const normalizedIdentifier = channel === 'SMS'
        ? toE164(formData.identifier)
        : formData.identifier;
      // Ưu tiên hook từ Provider, fallback sang util nếu chưa sẵn
      const recaptchaToken = executeRecaptcha
        ? await executeRecaptcha('register')
        : await getRecaptchaToken(CONFIG.RECAPTCHA_SITE_KEY, 'register');

      if (!recaptchaToken || typeof recaptchaToken !== 'string') {
        throw new Error('Không thể khởi tạo reCAPTCHA. Vui lòng tải lại trang hoặc kiểm tra site key.');
      }

      const payload = {
        fullName: formData.fullName,
        identifier: normalizedIdentifier,
        channel,
        password: formData.password,
        recaptchaToken,
        // Bổ sung các field tùy chọn để khớp DTO phía server
        authProvider: 'LOCAL',
      };
      // Nếu là EMAIL, gửi thêm email. Có thể map username theo fullName/identifier nếu backend cần.
      if (channel === 'EMAIL') {
        payload.email = normalizedIdentifier;
      }
      // Gợi ý: nếu backend yêu cầu username, có thể set mặc định
      if (!payload.username) {
        payload.username = formData.fullName?.trim() || formData.identifier;
      }

      await api.register(payload);
      onRegisterSuccess({ identifier: normalizedIdentifier, channel });
    } catch (err) {
      // Thân thiện hơn khi gặp 403/recaptcha
      const msg = String(err?.message || '');
      let friendly = msg;
      if (/forbidden|403|recaptcha/i.test(msg)) {
        friendly = 'Xác minh reCAPTCHA không hợp lệ hoặc đã hết hạn. Vui lòng thử lại (và đảm bảo đúng site key/secret giữa FE và BE).';
      }
      setErrors(prev => ({ ...prev, submit: friendly }));
    } finally {
      setLoading(false);
      // Mở khoá lại để user có thể thử lại khi lỗi
      submittingRef.current = false;
    }
  };

  const handleSocialLogin = (provider) => {
    window.location.href = CONFIG.OAUTH_REDIRECT[provider.toUpperCase()];
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {!hideHeader && (
        <div className="form-header">
          <h2>Create Account</h2>
          <p>Join us and start your journey</p>
        </div>
      )}

      <Input
        icon={User}
        type="text"
        name="fullName"
        placeholder="Full name"
        value={formData.fullName}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.fullName && errors.fullName}
      />

      <Input
        icon={Mail}
        type="text"
        name="identifier"
        placeholder="Email hoặc số điện thoại (0xxxxxxxxx hoặc +84xxxxxxxxx)"
        value={formData.identifier}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.identifier && errors.identifier}
      />

      {formData.identifier && !errors.identifier && (
        <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '-0.5rem' }}>
          Sẽ gửi mã OTP qua {validatePhone(formData.identifier) ? 'SMS' : 'Email'}.
        </div>
      )}

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

      {touched.password && formData.password && (
        <div className="password-strength">
          <div className={`strength-item ${passwordStrength.length ? 'valid' : ''}`}>
            {passwordStrength.length ? <Check size={14} /> : <X size={14} />}
            <span>8+ characters</span>
          </div>
          <div className={`strength-item ${passwordStrength.uppercase ? 'valid' : ''}`}>
            {passwordStrength.uppercase ? <Check size={14} /> : <X size={14} />}
            <span>Uppercase letter</span>
          </div>
          <div className={`strength-item ${passwordStrength.number ? 'valid' : ''}`}>
            {passwordStrength.number ? <Check size={14} /> : <X size={14} />}
            <span>Number</span>
          </div>
          <div className={`strength-item ${passwordStrength.special ? 'valid' : ''}`}>
            {passwordStrength.special ? <Check size={14} /> : <X size={14} />}
            <span>Special character</span>
          </div>
        </div>
      )}

      <Input
        icon={Lock}
        type="password"
        name="confirmPassword"
        placeholder="Confirm password"
        value={formData.confirmPassword}
        onChange={handleChange}
        onBlur={handleBlur}
        error={touched.confirmPassword && errors.confirmPassword}
        success={formData.confirmPassword && !errors.confirmPassword && touched.confirmPassword}
      />

      {errors.submit && (
        <div className="error-message">
          <X size={16} />
          {errors.submit}
        </div>
      )}

      <Button type="submit" loading={loading} loadingText="Đang xác thực…" size="lg">
        Create Account
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
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} className="link-btn primary">
          Sign in
        </button>
      </div>
    </form>
  );
};

export default RegisterForm;