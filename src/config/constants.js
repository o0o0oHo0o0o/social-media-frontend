// File: config/constants.js

// Đọc các biến môi trường (VITE_...) từ file .env
const env = import.meta.env;

// ===================================
// VALIDATION - Kiểm tra key bắt buộc
// ===================================

// Firebase configuration removed: this app no longer uses Firebase Phone Auth

// reCAPTCHA v3 (CHỈ cần cho Email/Password backend, KHÔNG cần cho Firebase Phone)
if (!env.VITE_RECAPTCHA_V3_SITE_KEY && !env.VITE_RECAPTCHA_SITE_KEY) {
  console.warn(
    "[CONFIG WARNING] 'VITE_RECAPTCHA_V3_SITE_KEY' không tồn tại. " +
    "Luồng đăng ký Email/Password (qua backend) sẽ không có reCAPTCHA protection."
  );
}

// ===================================
// PARSE CONFIG VALUES
// ===================================

// reCAPTCHA v3 key (CHỈ cho backend Email/Password)
const RECAPTCHA_V3_KEY = (
  env.VITE_RECAPTCHA_V3_SITE_KEY ||
  env.VITE_RECAPTCHA_SITE_KEY ||
  ''
).trim();

// API base URL và prefix
// Ưu tiên biến môi trường, fallback về backend Render để tránh hard-code localhost.
const API_BASE = (env.VITE_API_BASE || 'https://social-media-backend-s3qe.onrender.com').trim();
// Luôn bỏ API prefix để khớp BE map `/auth/*` (tránh bị `/api/auth/*`)
const API_PREFIX = (env.VITE_API_PREFIX || '').trim();

// ===================================
// EXPORT CONFIG
// ===================================

export const CONFIG = {
  // API Configuration
  API_BASE_URL: API_BASE,
  API_PREFIX: API_PREFIX,

  // App Info
  APP_NAME: 'DebateNet',
  LOGO_URL: '/logo.svg',

  // reCAPTCHA v3 (CHỈ cho backend Email/Password)
  RECAPTCHA_SITE_KEY: RECAPTCHA_V3_KEY,

  // reCAPTCHA handled by backend/frontend integration (no Firebase Phone Auth)

  // OAuth Redirect URLs (must use absolute URL to backend - proxy doesn't work for window.location)
  OAUTH_REDIRECT: {
    GOOGLE: `${API_BASE}/oauth2/authorization/google`,
    FACEBOOK: `${API_BASE}/oauth2/authorization/facebook`
  },

  // Debug
  DEBUG: env.MODE === 'development'
};

// Log config khi development (để debug)
if (CONFIG.DEBUG) {
  console.log('[CONFIG] Loaded configuration:', {
    API_BASE_URL: CONFIG.API_BASE_URL || '(empty - using relative path)',
    API_PREFIX: CONFIG.API_PREFIX,
    HAS_RECAPTCHA_KEY: !!CONFIG.RECAPTCHA_SITE_KEY,
    OAUTH_GOOGLE: CONFIG.OAUTH_REDIRECT.GOOGLE,
    OAUTH_FACEBOOK: CONFIG.OAUTH_REDIRECT.FACEBOOK
  });
}