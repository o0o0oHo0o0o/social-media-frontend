/**
 * Chat utility functions
 */

// Normalize message to wrapper format (ensure payload structure)
export const normalizeMessage = (message) => {
  if (!message) return null;

  if (message?.payload) {
    return message; // Already wrapped
  }

  return {
    payload: message,
    type: 'MESSAGE'
  };
};

// Extract message ID from both flat and wrapper formats
export const getMessageId = (message) => {
  return message?.payload?.messageId || message?.messageId;
};

// Extract sender ID from message
export const getSenderId = (message) => {
  return message?.payload?.sender?.userId || message?.sender?.userId || message?.payload?.senderId || message?.senderId;
};

// Check if message is from current user
export const isMessageFromMe = (message, currentUserId) => {
  return getSenderId(message) === currentUserId;
};

// Check if should show timestamp divider (10+ minute gap)
export const shouldShowTimestamp = (currentMsg, previousMsg) => {
  if (!previousMsg) return true;

  const currTime = new Date(currentMsg?.payload?.sentAt || currentMsg?.sentAt);
  const prevTime = new Date(previousMsg?.payload?.sentAt || previousMsg?.sentAt);

  if (!currTime || !prevTime) return false;

  const diffMinutes = (currTime - prevTime) / 1000 / 60;
  return diffMinutes >= 10;
};

// Check if messages are from same sender (for grouping)
export const isSameSender = (msg1, msg2) => {
  const id1 = getSenderId(msg1);
  const id2 = getSenderId(msg2);
  return id1 === id2 && id1 !== undefined;
};

// Check if messages are consecutive (within 1 minute)
export const isConsecutiveMessage = (currentMsg, previousMsg) => {
  if (!isSameSender(currentMsg, previousMsg)) return false;

  const currTime = new Date(currentMsg?.payload?.sentAt || currentMsg?.sentAt);
  const prevTime = new Date(previousMsg?.payload?.sentAt || previousMsg?.sentAt);

  if (!currTime || !prevTime) return false;

  const diffMinutes = (currTime - prevTime) / 1000 / 60;
  return diffMinutes < 1;
};
