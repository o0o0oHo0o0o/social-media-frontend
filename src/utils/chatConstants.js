/**
 * Chat constants
 */

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const MESSAGE_TYPES = {
  TEXT: 'TEXT',
  TYPING: 'TYPING',
  READ_RECEIPT: 'READ_RECEIPT',
  MESSAGE: 'MESSAGE'
};

export const MESSAGE_STATUS = {
  SENDING: 'SENDING',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
  FAILED: 'FAILED'
};

export const MEDIA_TYPES = {
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
  FILE: 'FILE'
};

// Pagination defaults
export const MESSAGES_PAGE_SIZE = 30;
export const INITIAL_LOAD_LIMIT = 100;
