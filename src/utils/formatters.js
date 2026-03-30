/**
 * Formatter utilities cho chat
 */

// Format time as M:SS
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Format file size (bytes -> KB/MB)
export const getDisplayFileSize = (fileSize) => {
  if (!fileSize || typeof fileSize !== 'number' || fileSize <= 0) {
    return '';
  }
  if (fileSize >= 1024 * 1024) {
    return (fileSize / (1024 * 1024)).toFixed(1) + ' MB';
  }
  return (fileSize / 1024).toFixed(0) + ' KB';
};

// Format timestamp to locale string
export const formatTimestamp = (date) => {
  if (!date) return '';
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit'
  });
};

// Format message time
export const formatMessageTime = (date) => {
  if (!date) return '';
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};
