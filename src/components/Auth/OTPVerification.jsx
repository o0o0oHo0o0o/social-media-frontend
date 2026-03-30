import React, { useState, useEffect, useRef } from 'react';
import '../../styles/otp.css';
import '../../styles/button.css';
import { Mail, Phone, Check, X, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import Button from '../Common/Button';

const OTPVerification = ({
  identifier,
  channel,
  onVerify,
  onBack,
  useFirebasePhone = false,
  autoSend = false
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [hasSent, setHasSent] = useState(false);
  const lastSendAtRef = useRef(0);
  const inputRefs = useRef([]);

  // Cleanup khi unmount (no Firebase phone flow anymore)
  useEffect(() => {
    return () => { };
  }, []);

  // Map Firebase errors sang tiếng Việt
  const mapFirebaseError = (err) => {
    const code = err?.code || '';
    const msg = err?.message || '';

    // Firebase specific errors
    if (code === 'auth/invalid-phone-number') {
      return 'Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng (+84xxxxxxxxx)';
    }
    if (code === 'auth/too-many-requests') {
      return 'Bạn đã thử quá nhiều lần. Vui lòng đợi 5-10 phút trước khi thử lại';
    }
    if (code === 'auth/quota-exceeded') {
      return 'Đã vượt hạn mức SMS của Firebase. Vui lòng liên hệ admin';
    }
    if (code === 'auth/invalid-verification-code') {
      return 'Mã xác thực không đúng. Vui lòng kiểm tra lại 6 số';
    }
    if (code === 'auth/code-expired') {
      return 'Mã đã hết hạn. Vui lòng bấm "Gửi lại mã"';
    }
    if (code === 'auth/session-expired') {
      return 'Phiên đã hết hạn. Vui lòng gửi lại OTP';
    }
    if (code === 'auth/missing-phone-number') {
      return 'Thiếu số điện thoại. Vui lòng quay lại và nhập lại';
    }

    // Custom errors from our code
    if (msg.includes('Vui lòng đợi')) {
      return msg; // Already in Vietnamese
    }
    if (msg.includes('Confirmation object is missing')) {
      return 'Vui lòng bấm "Gửi mã" trước khi nhập OTP';
    }
    if (msg.includes('reCAPTCHA')) {
      return 'Lỗi xác thực reCAPTCHA. Vui lòng tải lại trang và thử lại';
    }

    // Default
    return msg || 'Có lỗi xảy ra. Vui lòng thử lại';
  };

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-send OTP nếu autoSend = true (từ Register form)
  useEffect(() => {
    if (autoSend && useFirebasePhone && channel === 'SMS' && !hasSent && !loading) {
      console.log('[OTP] Auto-sending Firebase OTP...');
      handleSendOrResend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSend]);

  // Handle OTP input change
  const handleChange = (index, value) => {
    // Only allow single digit
    if (value.length > 1) return;

    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits entered
    if (newOtp.every(digit => digit !== '')) {
      handleVerify(newOtp.join(''));
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP code
  const handleVerify = async (code) => {
    setLoading(true);
    setError('');

    try {
      // Verify via backend for both Email and SMS
      await api.verifyOTP({ identifier, otp: code, channel });
      setSuccess(true);
      setTimeout(() => onVerify(), 1000);

    } catch (err) {
      console.error('[OTP] Verify error:', err);
      const errorMessage = mapFirebaseError(err);
      setError(errorMessage);

      // Reset OTP inputs
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Send or resend OTP
  const handleSendOrResend = async () => {
    // Prevent spam clicking
    const now = Date.now();
    if (now - lastSendAtRef.current < 3000) {
      console.warn('[OTP] Too fast, ignoring click');
      return;
    }

    console.log('[OTP] Sending OTP...', {
      useFirebasePhone,
      channel,
      identifier
    });

    setLoading(true);
    setError('');

    try {
      // Use backend resend for SMS or Email
      await api.resendOTP({ identifier, channel });
      setHasSent(true);
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

    } catch (err) {
      console.error('[OTP] Send error:', err);
      const errorMessage = mapFirebaseError(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-container">
      {/* Header */}
      <div className="otp-header">
        <div className="otp-icon">
          {channel === 'SMS' ? <Phone size={32} /> : <Mail size={32} />}
        </div>
        <h2>Xác thực {channel === 'SMS' ? 'Số điện thoại' : 'Email'}</h2>
        <p>Nhập mã gồm 6 số được gửi tới</p>
        <strong>{identifier}</strong>
        {useFirebasePhone && channel === 'SMS' && (
          <div style={{
            marginTop: '8px',
            fontSize: '0.85rem',
            color: '#666',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            justifyContent: 'center'
          }}>
            <AlertCircle size={14} />
            <span>Qua Firebase SMS Authentication</span>
          </div>
        )}
      </div>

      {/* Success message after sending */}
      {hasSent && !error && (
        <div className="success-message" style={{ marginTop: '1rem' }}>
          <Check size={16} />
          Mã OTP đã được gửi tới {identifier}
        </div>
      )}

      {/* OTP Inputs */}
      <div className="otp-inputs" style={{ marginTop: '1.5rem' }}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(index, e)}
            className={`otp-input ${error ? 'error' : ''} ${success ? 'success' : ''}`}
            autoFocus={index === 0}
            disabled={loading || success}
          />
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="error-message" style={{ marginTop: '1rem' }}>
          <X size={16} />
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="success-message" style={{ marginTop: '1rem' }}>
          <Check size={16} />
          Xác thực thành công!
        </div>
      )}

      {/* Footer actions */}
      <div className="otp-footer" style={{ marginTop: '1.5rem' }}>
        {useFirebasePhone && channel === 'SMS' ? (
          // Firebase flow: Show manual send button with countdown disable
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            alignItems: 'center'
          }}>
            <Button
              type="button"
              onClick={handleSendOrResend}
              loading={loading}
              disabled={loading || countdown > 0}
              variant={countdown > 0 ? 'secondary' : undefined}
            >
              {countdown > 0
                ? `Gửi lại sau ${countdown}s`
                : hasSent
                  ? 'Gửi lại mã OTP'
                  : 'Gửi mã OTP'}
            </Button>
          </div>
        ) : (
          // Backend Email/SMS flow
          <p style={{ textAlign: 'center', color: '#666' }}>
            Không nhận được mã?{' '}
            {countdown > 0 ? (
              <span className="countdown">Gửi lại sau {countdown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleSendOrResend}
                className="link-btn"
                disabled={loading}
              >
                Gửi lại
              </button>
            )}
          </p>
        )}

        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          className="link-btn"
          style={{ marginTop: '12px' }}
          disabled={loading || success}
        >
          ← Quay lại đăng ký
        </button>
      </div>
    </div>
  );
};

export default OTPVerification;