// Small formatting helpers for chat UI
export function formatTime(seconds = 0) {
  const s = Number(seconds) || 0;
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatFileSize(bytes = 0) {
  const b = Number(bytes) || 0;
  if (b >= 1024 * 1024) return (b / (1024 * 1024)).toFixed(1) + ' MB';
  if (b >= 1024) return (b / 1024).toFixed(0) + ' KB';
  return b + ' B';
}

// Hàm giúp hiển thị label cho media type bằng tiếng Việt
export function getMediaLabel(type) {
  if (!type) return '[Tập tin]';
  const t = String(type).toUpperCase();
  if (t.includes('IMAGE')) return '[Hình ảnh 📷]';
  if (t.includes('VIDEO')) return '[Video 🎥]';
  if (t.includes('AUDIO') || t.includes('SOUND') || t.includes('VOICE')) return '[Ghi âm 🎙️]';
  return '[Tập tin 📁]';
}

// Hàm format thời gian giống Messenger (10:30, Hôm qua 10:30, 20/12/2025 10:30)
export function formatChatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  if (diffDays === 0 && date.getDate() === now.getDate()) {
    return timeStr;
  } else if (diffDays === 1 || (diffDays === 0 && date.getDate() !== now.getDate())) {
    return `Hôm qua ${timeStr}`;
  } else if (diffDays < 7) {
    const weekday = date.toLocaleDateString('vi-VN', { weekday: 'short' });
    return `${weekday} ${timeStr}`;
  } else {
    return `${date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${timeStr}`;
  }
}
