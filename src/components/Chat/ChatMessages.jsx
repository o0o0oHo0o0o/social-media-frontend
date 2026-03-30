import React, { useEffect, useRef, useState } from 'react';
import '../../../styles/chat.css';

const ChatMessages = ({
  messages = [],
  me,
  loading,
  onLoadMore,
  hasMoreMessages,
  wsTyping,
  onImageClick,
  nicknames = {},
  members = [],
  conversationId
}) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const prevMessagesLengthRef = useRef(0);
  const isLoadingMoreRef = useRef(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Reset when conversation changes
  useEffect(() => {
    setIsInitialLoad(true);
    prevMessagesLengthRef.current = 0;
    isLoadingMoreRef.current = false;
  }, [conversationId]); // Reset when conversation changes

  // Handle scroll position after loading more messages
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const prevLength = prevMessagesLengthRef.current;
    const currentLength = messages.length;

    if (currentLength > prevLength) {
      if (isLoadingMoreRef.current) {
        // When loading more (older messages), maintain scroll position
        // Calculate how much content was added and adjust scroll
        const addedCount = currentLength - prevLength;
        // Get all message elements and calculate their heights
        requestAnimationFrame(() => {
          const messageElements = container.querySelectorAll('.message-group, .message-date-separator, .message-time-gap');
          let addedHeight = 0;
          for (let i = 0; i < Math.min(addedCount, messageElements.length); i++) {
            addedHeight += messageElements[i].offsetHeight + 8; // 8px gap
          }
          container.scrollTop = addedHeight;
        });
        isLoadingMoreRef.current = false;
      } else if (isInitialLoad) {
        // Initial load - scroll to bottom instantly
        scrollToBottom('instant');
        setIsInitialLoad(false);
      } else {
        // New message received - scroll to bottom smoothly
        scrollToBottom('smooth');
      }
    }

    prevMessagesLengthRef.current = currentLength;
  }, [messages, isInitialLoad]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop } = messagesContainerRef.current;

    // Trigger load more when scrolled near top (within 50px)
    if (scrollTop < 50 && hasMoreMessages && !loading) {
      console.log('[ChatMessages] Scroll near top, triggering loadMore');
      isLoadingMoreRef.current = true;
      onLoadMore?.();
    }
  };

  const getNickname = (sender) => {
    if (!sender) return 'Unknown';
    const senderId = sender.userId || sender.id;
    if (senderId === me?.id) return 'You';
    return nicknames[senderId] || sender.fullName || sender.name || sender.username || 'Unknown';
  };

  const getMemberById = (userId) => {
    return members.find(m => (m.userId || m.id) === userId);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return String(timestamp).substring(11, 16) || '';
      }
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  const getMessageTimestamp = (msg) => {
    return msg.sentAt || msg.timestamp || msg.createdAt || null;
  };

  // Get read by users for a message (excluding self)
  const getReadByAvatars = (msg) => {
    if (!msg.statusSummary?.readByUsers) return [];
    return msg.statusSummary.readByUsers
      .filter(user => user.userId !== me?.id && user.status === 'READ')
      .map(user => {
        const member = getMemberById(user.userId);
        return {
          userId: user.userId,
          username: user.username,
          avatar: member?.avatar || member?.avatarUrl || null,
          readAt: user.readAt
        };
      });
  };

  // Find the last message that each user has read (for showing seen avatars)
  const getLastReadMessageIdByUser = () => {
    const userLastRead = {}; // userId -> messageId

    // Go through messages in order to find the latest read message for each user
    messages.forEach(msg => {
      if (msg.statusSummary?.readByUsers) {
        msg.statusSummary.readByUsers.forEach(reader => {
          if (reader.userId !== me?.id && reader.status === 'READ') {
            userLastRead[reader.userId] = msg.messageId;
          }
        });
      }
    });

    return userLastRead;
  };

  // Get avatar info for "seen" indicator on a specific message
  const getSeenAvatarsForMessage = (msgId, userLastRead) => {
    const seenUsers = [];
    Object.entries(userLastRead).forEach(([userId, lastReadMsgId]) => {
      if (lastReadMsgId === msgId) {
        const member = getMemberById(parseInt(userId));
        if (member) {
          seenUsers.push({
            userId: parseInt(userId),
            username: member.username || member.fullName,
            avatar: member.avatar || member.avatarUrl
          });
        }
      }
    });
    return seenUsers;
  };

  // Get typing user info
  const getTypingUser = () => {
    if (!wsTyping || wsTyping.userId === me?.id) return null;
    const member = getMemberById(wsTyping.userId);
    return {
      ...wsTyping,
      avatar: member?.avatar || member?.avatarUrl || null
    };
  };

  // Group messages by sender and time
  const groupedMessages = [];
  let lastSenderId = null;
  let lastTimestamp = null;
  let lastMessageGroupIndex = -1;
  const timeDiffMinutes = 5;

  messages.forEach((msg, index) => {
    const senderId = msg.sender?.userId || msg.senderId;
    const timestamp = getMessageTimestamp(msg);

    // Check if we need a date separator
    if (lastTimestamp && timestamp) {
      const lastDate = new Date(lastTimestamp);
      const currentDate = new Date(timestamp);
      if (lastDate.toDateString() !== currentDate.toDateString()) {
        groupedMessages.push({
          type: 'date-separator',
          date: timestamp,
          key: `date-${timestamp}`
        });
        lastMessageGroupIndex = -1; // Reset to force new group
      }
    }

    // Check if we need a time gap separator
    if (lastTimestamp && timestamp) {
      const lastTime = new Date(lastTimestamp).getTime();
      const currentTime = new Date(timestamp).getTime();
      const diffMs = currentTime - lastTime;
      const diffMins = diffMs / (1000 * 60);

      if (diffMins > timeDiffMinutes) {
        groupedMessages.push({
          type: 'time-gap',
          key: `gap-${index}`
        });
        lastMessageGroupIndex = -1; // Reset to force new group
      }
    }

    // Add message to grouped array
    if (lastSenderId === senderId && lastMessageGroupIndex !== -1) {
      // Same sender, append to last message group
      groupedMessages[lastMessageGroupIndex].messages.push({ ...msg, senderId });
    } else {
      // New sender or first message
      lastMessageGroupIndex = groupedMessages.length;
      groupedMessages.push({
        type: 'message-group',
        senderId,
        sender: msg.sender,
        messages: [{ ...msg, senderId }],
        key: `group-${index}`
      });
    }

    lastSenderId = senderId;
    lastTimestamp = timestamp;
  });

  // Calculate which messages have "seen" avatars (last read message for each user)
  const userLastRead = getLastReadMessageIdByUser();
  const typingUser = getTypingUser();

  return (
    <div className="chat-messages-container" onScroll={handleScroll} ref={messagesContainerRef}>
      {loading && (
        <div className="messages-loading">
          <p>Loading messages...</p>
        </div>
      )}

      {!loading && messages.length === 0 && (
        <div className="empty-messages">
          <p>Start a conversation</p>
        </div>
      )}

      <div className="messages-list">
        {groupedMessages.map((group) => {
          if (group.type === 'date-separator') {
            return (
              <div key={group.key} className="message-date-separator">
                <span>{formatDate(group.date)}</span>
              </div>
            );
          }

          if (group.type === 'time-gap') {
            return <div key={group.key} className="message-time-gap" />;
          }

          // Message group
          const isOwn = group.senderId === me?.id;
          const lastMsg = group.messages[group.messages.length - 1];
          // Get seen avatars for the last message in this group (only for own messages)
          const seenAvatars = isOwn ? getSeenAvatarsForMessage(lastMsg.messageId, userLastRead) : [];

          return (
            <div key={group.key} className={`message-group ${isOwn ? 'sent-group' : 'received-group'}`}>
              {/* Avatar on LEFT for received messages */}
              {!isOwn && (
                <div className="message-group-avatar">
                  {group.sender?.avatarUrl || group.sender?.avatar ? (
                    <img
                      src={group.sender.avatarUrl || group.sender.avatar}
                      alt="avatar"
                      loading="lazy"
                      onError={(e) => {
                        try {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          const parent = e.target.parentNode;
                          if (parent && !parent.querySelector('.avatar-placeholder')) {
                            const ph = document.createElement('div');
                            ph.className = 'avatar-placeholder';
                            ph.textContent = ((group.sender?.fullName || group.sender?.username || '?').charAt(0) || '?').toUpperCase();
                            parent.appendChild(ph);
                          }
                        } catch (err) {
                          // ignore
                        }
                      }}
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {(group.sender?.fullName || group.sender?.username || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              )}

              <div className="message-group-content">
                {!isOwn && members && members.length > 2 && (
                  <div className="message-group-name">{getNickname(group.sender)}</div>
                )}

                <div className="message-group-items">
                  {group.messages.map((msg, idx) => {
                    const hasOnlyMedia = !msg.content && msg.media && msg.media.length > 0;
                    const hasText = msg.content && msg.content.trim();

                    return (
                      <div key={msg.messageId || idx} className="message-item-wrapper">
                        {/* Text content in bubble */}
                        {hasText && (
                          <div className="message-bubble">
                            <div className="message-text">{msg.content}</div>
                          </div>
                        )}

                        {/* Media WITHOUT bubble wrapper */}
                        {msg.media && msg.media.length > 0 && (
                          <div className="message-media-container">
                            {msg.media.map((file, fidx) => (
                              <div key={fidx} className="message-media-item">
                                {file.type === 'IMAGE' || file.mediaType === 'IMAGE' ? (
                                  <img
                                    src={file.url || file.mediaUrl}
                                    alt=""
                                    className="media-image"
                                    onClick={() => onImageClick?.(file)}
                                  />
                                ) : file.type === 'AUDIO' || file.mediaType === 'AUDIO' ? (
                                  <audio controls src={file.url || file.mediaUrl} preload="metadata" className="media-audio" />
                                ) : file.type === 'VIDEO' || file.mediaType === 'VIDEO' ? (
                                  <video controls src={file.url || file.mediaUrl} preload="metadata" className="media-video" />
                                ) : (
                                  <a href={file.url || file.mediaUrl} target="_blank" rel="noopener noreferrer" className="file-link-standalone">
                                    📎 {file.fileName || 'File'}
                                    {file.fileSize && <span className="file-size">({(file.fileSize / 1024).toFixed(1)} KB)</span>}
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Time removed - already shown in date separators */}
                      </div>
                    );
                  })}
                </div>

                {/* Seen avatars - shown under the last message that each user has read */}
                {isOwn && seenAvatars.length > 0 && (
                  <div className="seen-avatars">
                    {seenAvatars.slice(0, 5).map((reader) => (
                      <div key={reader.userId} className="seen-avatar" title={`Seen by ${reader.username}`}>
                        {reader.avatar ? (
                          <img src={reader.avatar} alt={reader.username} />
                        ) : (
                          <span>{reader.username?.charAt(0)?.toUpperCase() || '?'}</span>
                        )}
                      </div>
                    ))}
                    {seenAvatars.length > 5 && (
                      <div className="seen-avatar-more">+{seenAvatars.length - 5}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator with avatar */}
        {typingUser && (
          <div className="typing-indicator-wrapper">
            <div className="typing-avatar">
              {typingUser.avatar ? (
                <img
                  src={typingUser.avatar}
                  alt={typingUser.username}
                  loading="lazy"
                  onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="avatar-placeholder">
                  {(typingUser.username || '?').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="typing-bubble">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;