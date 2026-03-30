// File: recaptchaV3.js (hoặc tên tương tự)

// 1. ĐỌC KEY 1 LẦN DUY NHẤT TỪ .env
const siteKey = import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY;

// 2. Kiểm tra key (quan trọng)
if (!siteKey) {
  console.error("VITE_RECAPTCHA_V3_SITE_KEY is not set in .env file");
}

/**
 * Tải script reCAPTCHA v3.
 * Hàm này KHÔNG cần tham số 'siteKey' nữa.
 */
export const loadRecaptcha = () => { // <-- 3. ĐÃ XÓA 'siteKey'
  return new Promise((resolve, reject) => {
    if (!siteKey) return reject(new Error('Missing reCAPTCHA site key'));

    // (Logic tải script giữ nguyên, đã đúng)
    if (window.grecaptcha && window.grecaptcha.execute) return resolve();
    const existing = document.querySelector('script[src^="https://www.google.com/recaptcha/api.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load reCAPTCHA')));
      return;
    }
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`; // <-- 4. Dùng 'siteKey' (biến nội bộ)
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA'));
    document.head.appendChild(script);
  });
};

/**
 * Lấy token v3 (cho luồng backend Email/Password).
 * Hàm này KHÔNG cần tham số 'siteKey' nữa.
 */
export const getRecaptchaToken = async (action = 'register') => { // <-- 5. ĐÃ XÓA 'siteKey'

  await loadRecaptcha(); // <-- 6. Gọi không cần tham số

  return new Promise((resolve, reject) => {
    if (!window.grecaptcha || !window.grecaptcha.execute) {
      return reject(new Error('reCAPTCHA not available'));
    }
    window.grecaptcha.ready(() => {
      window.grecaptcha
        .execute(siteKey, { action }) // <-- 7. Dùng 'siteKey' (biến nội bộ)
        .then(resolve)
        .catch(reject);
    });
  });
};