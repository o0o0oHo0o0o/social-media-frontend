import React, { memo, useMemo, useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { createPortal } from 'react-dom';
import MediaPreview from './MediaPreview';
import InlineAudioPlayer from './InlineAudioPlayer';
import ReactionListModal from './ReactionListModal';
import MessageShimmer from './MessageShimmer';
import { getMediaLabel, formatChatTime } from '../../utils/format';

const MessageList = memo(function MessageList({
  messages,
  me,
  typingUsers,
  msgLoading,
  onAvatarClick,
  readReceipts,
  onReactionClick,
  onMediaLoad,
  onReplyClick
}) {
  const [activeReactionId, setActiveReactionId] = useState(null);
  const [activeReactionMsg, setActiveReactionMsg] = useState(null);
  const [menuPos, setMenuPos] = useState(null);
  const [reactionsCache, setReactionsCache] = useState({});

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [reactionModalOpen, setReactionModalOpen] = useState(false);
  const [reactionModalData, setReactionModalData] = useState([]);
  const [reactionModalMsgId, setReactionModalMsgId] = useState(null);

  const markReadDebounceRef = useRef(null);
  const pendingMarkReadRef = useRef(0);
  const observerRef = useRef(null);
  const prevLastMessageIdRef = useRef(null);
  const prevTypingLengthRef = useRef(0);
  const ENABLE_LOCAL_MARK_READ = false;

  // --- LOGIC INTERSECTION & OBSERVER (Giữ nguyên) ---
  useEffect(() => {
    if (!ENABLE_LOCAL_MARK_READ) return;
    const handleIntersection = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const msgId = parseInt(entry.target.getAttribute('data-message-id'));
          const isMe = entry.target.getAttribute('data-is-me') === 'true';
          if (!isMe && msgId && msgId > pendingMarkReadRef.current) {
            pendingMarkReadRef.current = msgId;
            if (markReadDebounceRef.current) clearTimeout(markReadDebounceRef.current);
            markReadDebounceRef.current = setTimeout(() => {
              const idToMark = pendingMarkReadRef.current;
              const conversationId = messages[0]?.payload?.conversationId || messages[0]?.conversationId;
              if (conversationId && idToMark > 0) {
                api.markChatRead({ conversationId, lastMessageId: idToMark }).catch(err => console.error(err));
              }
            }, 500);
          }
        }
      });
    };
    observerRef.current = new IntersectionObserver(handleIntersection, { root: null, threshold: 0.5 });
    return () => {
      if (observerRef.current) observerRef.current.disconnect();
      if (markReadDebounceRef.current) clearTimeout(markReadDebounceRef.current);
    };
  }, [messages]);

  useEffect(() => {
    if (!ENABLE_LOCAL_MARK_READ) return;
    const obs = observerRef.current;
    if (!obs) return;
    const els = document.querySelectorAll('.message-row[data-is-me="false"]');
    els.forEach(el => obs.observe(el));
    return () => { try { obs.disconnect(); } catch (e) { } };
  }, [messages]);

  // --- LOGIC MENU & CACHE (Giữ nguyên) ---
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveReactionId(null);
      setActiveReactionMsg(null);
      setMenuPos(null);
    };
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('resize', handleClickOutside);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('resize', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!messages || messages.length === 0) return;
    const updates = {};
    messages.forEach(m => {
      const msg = m.payload || m;
      const mid = msg?.messageId;
      if (!mid) return;
      if (Array.isArray(msg.reactions) && msg.reactions.length > 0) {
        updates[mid] = msg.reactions;
      } else if (msg.myReactionType) {
        updates[mid] = { myReactionType: msg.myReactionType };
      }
    });
    if (Object.keys(updates).length > 0) setReactionsCache(prev => ({ ...prev, ...updates }));
  }, [messages]);

  useEffect(() => {
    const chatArea = document.querySelector('.chat-messages');
    if (!chatArea) return;
    const onScroll = () => { setActiveReactionId(null); setActiveReactionMsg(null); setMenuPos(null); };
    chatArea.addEventListener('scroll', onScroll);
    return () => chatArea.removeEventListener('scroll', onScroll);
  }, []);

  // --- SCROLL LOGIC (Giữ nguyên) ---
  useEffect(() => {
    const el = document.querySelector('.chat-messages');
    if (!el) return;
    const lastMsg = (messages && messages.length > 0) ? messages[messages.length - 1] : null;
    const currentLastId = lastMsg?.messageId || lastMsg?._tempId || null;
    const currentTypingLen = typingUsers?.length || 0;
    const isNewMessageArrived = currentLastId !== prevLastMessageIdRef.current;
    const isTypingChanged = currentTypingLen !== prevTypingLengthRef.current;
    const isTyping = currentTypingLen > 0;
    prevLastMessageIdRef.current = currentLastId;
    prevTypingLengthRef.current = currentTypingLen;

    if (isNewMessageArrived || (isTyping && isTypingChanged)) {
      const t = setTimeout(() => {
        try {
          const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 500;
          el.scrollTo({ top: el.scrollHeight, behavior: isNearBottom ? 'smooth' : 'auto' });
        } catch (e) { el.scrollTop = el.scrollHeight; }
      }, 50);
      return () => clearTimeout(t);
    }
  }, [messages, typingUsers]);

  // --- HELPER FUNCTIONS (ĐÃ FIX LỖI MẤT STATUS SEEN) ---

  // 1. Lấy Avatar người nhận (Fix logic tìm ID)
  const recipientAvatar = useMemo(() => {
    // Tìm tin nhắn của người khác
    const otherMsg = messages.find(m => {
      const payload = m.payload || m;
      const senderObj = payload.sender || {};
      const sId = senderObj.id || senderObj.userId || payload.senderId;
      return String(sId) !== String(me?.id);
    });

    const payload = otherMsg?.payload || otherMsg;
    return payload?.sender?.avatarUrl || "https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png";
  }, [messages, me]);

  const messageGroups = useMemo(() => {
    if (!messages || messages.length === 0) return [];

    const groups = [];
    let currentGroup = null;
    let lastTimeProcessed = null;

    messages.forEach((m) => {
      // Chuẩn hóa message object
      const msg = m.payload || m;

      // Bỏ qua tin nhắn đang gõ
      if (msg.type === 'TYPING') return;

      // 1. Xử lý Thời gian (Time Separator)
      const currentTime = msg.sentAt ? new Date(msg.sentAt) : new Date();
      const shouldShowTime = !lastTimeProcessed || (currentTime - lastTimeProcessed > 20 * 60 * 1000);

      if (shouldShowTime) {
        if (currentGroup) { groups.push(currentGroup); currentGroup = null; }
        groups.push({ type: 'TIME', content: formatChatTime(msg.sentAt) });
        lastTimeProcessed = currentTime;
      } else {
        lastTimeProcessed = currentTime;
      }

      // 2. Xử lý System Message
      const isSystem = (msg.type === 'SYSTEM') || (msg.messageType === 'SYSTEM') || (msg.messageType === 'NOTIFICATION');
      if (isSystem) {
        if (currentGroup) { groups.push(currentGroup); currentGroup = null; }
        const content = msg.content || msg.message || msg.messageBody || 'Thông báo hệ thống';
        groups.push({ type: 'SYSTEM', content });
        return;
      }

      // 3. Xử lý Sender & isMe (FIX QUAN TRỌNG)
      const senderObj = msg.sender || {};
      let senderId = senderObj.id || senderObj.userId || msg.senderId;
      const myId = me?.id || me?.userId;

      // [FIX]: Nếu tin nhắn không có senderId nhưng có _tempId (tin local vừa gửi),
      // thì mặc định coi như là CỦA MÌNH.
      if (!senderId && msg._tempId && myId) {
        senderId = myId;
      }

      const isMe = myId && senderId && (String(myId) === String(senderId));

      // 4. Lấy Sender Info (Fallback nếu thiếu)
      const senderName = senderObj.fullName || senderObj.username || senderObj.nickname || (isMe ? (me.fullName || 'Tôi') : "Người dùng");
      const senderAvatar = senderObj.avatarUrl || senderObj.avatar || (isMe ? me.avatarUrl : null);

      // 5. Kiểm tra nội dung (FIX QUAN TRỌNG: Chấp nhận nhiều key content khác nhau)
      const mediaList = msg.media || [];
      const rawContent = msg.content || msg.message || msg.messageBody || ""; // Check cả msg.message

      const hasContent = (String(rawContent).trim().length > 0);
      const hasFiles = mediaList.length > 0;
      const hasReply = !!msg.replyToMessage;

      // Nếu rỗng tuếch thì mới bỏ qua
      if (!hasContent && !hasFiles && !hasReply) return;

      // 6. Gom nhóm
      if (!currentGroup || String(currentGroup.senderId) !== String(senderId)) {
        if (currentGroup) groups.push(currentGroup);
        currentGroup = {
          type: 'USER',
          id: `group-${msg.messageId || msg._tempId || Math.random()}`,
          senderId,
          senderName,
          senderAvatar,
          isMe,
          messages: [msg]
        };
      } else {
        currentGroup.messages.push(msg);
      }
    });

    if (currentGroup) groups.push(currentGroup);
    return groups;
  }, [messages, me]);

  const openReactionList = async (messageId) => {
    if (!messageId) return;
    try {
      const details = await api.getMessageReactions(messageId);
      setReactionModalData(Array.isArray(details) ? details : (details?.items || []));
      setReactionModalMsgId(messageId);
      setReactionModalOpen(true);
    } catch (e) {
      setReactionModalData([]);
      setReactionModalMsgId(messageId);
      setReactionModalOpen(true);
    }
  };

  // --- REUSABLE COMPONENT: Reaction Trigger & Menu ---
  // Hàm này trả về JSX nút "Mặt cười" và Portal Menu
  const renderReactionUI = (msg) => {
    const msgId = msg.messageId || msg._tempId;
    const isReactionOpen = activeReactionId === msgId;

    return (
      <div className={`chat-actions ${isReactionOpen ? 'active' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div
          className="reply-trigger"
          style={{ padding: '0 6px', cursor: 'pointer' }}
          title="Trả lời"
          onClick={(e) => { e.stopPropagation(); onReplyClick && onReplyClick(msg); }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M10 9V5l-7 7 7 7v-4.1c5.05 0 8.5 1.79 11 5.1-1-5-4.95-11-11-11z" /></svg>
        </div>

        <div
          className="reaction-trigger"
          style={{ padding: '0 6px' }}
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = { x: rect.left + rect.width / 2, y: rect.top };
            setMenuPos(pos);
            setActiveReactionId(isReactionOpen ? null : msgId);
            setActiveReactionMsg(isReactionOpen ? null : msg);
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" /></svg>
        </div>

        {/* MENU PORTAL */}
        {isReactionOpen && activeReactionMsg && menuPos &&
          createPortal(
            <div
              className="reaction-menu portal"
              style={{
                left: menuPos.x,
                top: menuPos.y,
                position: 'fixed',
                display: 'flex',
                gap: '8px',
                overflow: 'visible',
                whiteSpace: 'nowrap',
                padding: '6px',
                zIndex: 9999
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const emojiToType = { '👍': 'LIKE', '❤️': 'LOVE', '😆': 'HAHA', '😮': 'WOW', '😢': 'SAD', '😡': 'ANGRY' };
                const baseItemStyle = { padding: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 6, transition: 'transform .12s, box-shadow .12s, background .12s' };
                const activeStyle = { transform: 'scale(1.14)', boxShadow: '0 0 0 8px rgba(33,150,243,0.16)', background: 'rgba(33,150,243,0.18)', color: '#0d47a1' };

                return ['👍', '❤️', '😆', '😮', '😢', '😡'].map((emoji) => {
                  const reactionType = emojiToType[emoji] || 'LIKE';
                  const cacheKey = activeReactionMsg.messageId || activeReactionMsg._tempId;
                  const cachedForActive = reactionsCache[cacheKey];
                  let currentMyReactionType = activeReactionMsg?.myReactionType || null;

                  if (cachedForActive) {
                    if (Array.isArray(cachedForActive)) {
                      const found = cachedForActive.find(d => {
                        const uid = d.user?.userId || d.userId || d.user;
                        const username = d.user?.username;
                        return String(uid) === String(me?.id) || (username && String(username) === String(me?.username));
                      });
                      if (found) currentMyReactionType = found.reactionType || found.reaction;
                    } else if (typeof cachedForActive === 'object' && cachedForActive.myReactionType) {
                      currentMyReactionType = cachedForActive.myReactionType;
                    }
                  }

                  const isActiveIcon = currentMyReactionType === reactionType;
                  return (
                    <span
                      key={emoji}
                      className={`reaction-item${isActiveIcon ? ' active' : ''}`}
                      style={isActiveIcon ? { ...baseItemStyle, ...activeStyle } : baseItemStyle}
                      onClick={async () => {
                        try {
                          if (onReactionClick) {
                            onReactionClick(activeReactionMsg, emoji);
                          } else {
                            await api.reactToMessage({ messageId: activeReactionMsg.messageId || activeReactionMsg._tempId, reactionType });
                          }
                          try {
                            const details = await api.getMessageReactions(activeReactionMsg.messageId || activeReactionMsg._tempId);
                            setReactionsCache(prev => ({ ...prev, [activeReactionMsg.messageId || activeReactionMsg._tempId]: details }));
                          } catch (e) { }
                        } catch (e) { console.error('React error', e); }
                        finally { setActiveReactionId(null); setActiveReactionMsg(null); setMenuPos(null); }
                      }}
                    >
                      {emoji}
                    </span>
                  );
                });
              })()}
            </div>,
            document.body
          )}
      </div>
    );
  };

  // --- REUSABLE COMPONENT: Reaction Status Display ---
  // Hàm này trả về JSX hiển thị icon cảm xúc đã thả
  const renderReactionDisplay = (msg) => {
    const mid = msg.messageId || msg._tempId;
    const cachedDetails = reactionsCache[mid];

    // Helper render
    const renderCounts = (counts) => (
      <div className="message-reactions-display" style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); openReactionList(mid); }}>
        {Object.entries(counts).map(([type, count]) => {
          const emojiMap = { LIKE: '👍', LOVE: '❤️', HAHA: '😆', WOW: '😮', SAD: '😢', ANGRY: '😡' };
          return <span key={type}>{emojiMap[type] || '👍'} {count}</span>;
        })}
      </div>
    );

    // 1. From Cache (Array or Object)
    if (cachedDetails) {
      if (Array.isArray(cachedDetails)) {
        if (cachedDetails.length === 0) return null;
        const counts = {};
        cachedDetails.forEach(d => { counts[d.reactionType] = (counts[d.reactionType] || 0) + 1; });
        return renderCounts(counts);
      } else if (typeof cachedDetails === 'object') {
        const entries = Object.entries(cachedDetails).filter(([, v]) => v > 0);
        if (entries.length === 0) return null;
        // Transform entries back to object for helper
        const counts = Object.fromEntries(entries);
        return renderCounts(counts);
      }
    }

    // 2. From Server (ReactionCounts)
    if (msg.reactionCounts && Object.keys(msg.reactionCounts).length > 0) {
      const entries = Object.entries(msg.reactionCounts).filter(([, v]) => v > 0);
      if (entries.length > 0) return renderCounts(Object.fromEntries(entries));
    }

    // 3. From Server (Legacy Array)
    if (msg.reactions && msg.reactions.length > 0) {
      return (
        <div className="message-reactions-display" style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); openReactionList(mid); }}>
          {msg.reactions.map((r, ri) => <span key={ri}>{r.reactionType || r}</span>)}
        </div>
      );
    }
    return null;
  };

  // 2. Tính toán tin nhắn cuối cùng đã đọc (Fix logic tìm ID và fallback sender)
  const lastReadMessageId = useMemo(() => {
    if (!messages || messages.length === 0) return null;

    // Duyệt ngược từ dưới lên để tìm tin nhắn mới nhất của MÌNH đã được đọc
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i].payload || messages[i];
      const mid = m.messageId || m._tempId;

      if (!mid) continue; // Bỏ qua nếu không có ID
      if (m.type === 'TYPING' || m.type === 'SYSTEM' || m.messageType === 'NOTIFICATION') continue; // Bỏ qua tin hệ thống

      // --- FIX QUAN TRỌNG: Logic lấy ID sender an toàn ---
      const senderObj = m.sender || {};
      const senderId = senderObj.id || senderObj.userId || m.senderId;
      // --------------------------------------------------

      // Kiểm tra có phải tin của mình không
      const isMeMsg = me && senderId && String(me.id) === String(senderId);

      // Kiểm tra trạng thái đã đọc (từ Socket realtime hoặc dữ liệu có sẵn)
      const isReadLocal = Boolean(readReceipts?.[mid] || m.isRead);

      if (isMeMsg && isReadLocal) return mid;
    }
    return null;
  }, [messages, readReceipts, me]);

  // 3. Lấy danh sách người đã đọc (Avatar nhỏ xíu)
  const lastReadReaders = useMemo(() => {
    if (!lastReadMessageId) return [];

    let readers = [];

    // Ưu tiên 1: Lấy từ realtime socket (readReceipts prop)
    const r = readReceipts?.[lastReadMessageId];

    if (Array.isArray(r)) readers = r;
    else if (r && typeof r === 'object') {
      if (Array.isArray(r.users)) readers = r.users;
      else if (Array.isArray(r.readers)) readers = r.readers;
      else if (Array.isArray(r.userIds)) readers = r.userIds;
    }

    // Ưu tiên 2: Nếu realtime không có, tìm trong message gốc
    if (!readers || readers.length === 0) {
      for (let i = messages.length - 1; i >= 0; i--) {
        const mm = (messages[i].payload || messages[i]);
        if ((mm.messageId || mm._tempId) !== lastReadMessageId) continue;

        // Backend có thể trả về nhiều tên biến khác nhau
        if (Array.isArray(mm.readBy)) { readers = mm.readBy; break; }
        if (Array.isArray(mm.readers)) { readers = mm.readers; break; }
        if (Array.isArray(mm.readersInfo)) { readers = mm.readersInfo; break; }
      }
    }

    // Map lại dữ liệu cho chuẩn format hiển thị
    return (readers || []).map(item => {
      if (!item) return null;
      // Trường hợp item là ID (số hoặc string)
      if (typeof item === 'string' || typeof item === 'number') {
        return { userId: item, avatarUrl: null, name: 'User' };
      }
      // Trường hợp item là User Object
      if (typeof item === 'object') {
        return {
          userId: item.userId || item.id,
          avatarUrl: item.avatarUrl || item.avatar || item.profilePictureURL,
          name: item.fullName || item.username || item.name
        };
      }
      return null;
    }).filter(Boolean);
  }, [lastReadMessageId, readReceipts, messages]);

  // --- MỚI: Tìm ID tin nhắn cuối cùng do mình gửi ---
  const lastMyMessageId = useMemo(() => {
    if (!messages || messages.length === 0) return null;

    // Duyệt ngược từ dưới lên, gặp tin nào của mình đầu tiên thì lấy luôn
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i].payload || messages[i];

      // Bỏ qua tin hệ thống
      if (m.type === 'TYPING' || m.type === 'SYSTEM' || m.messageType === 'NOTIFICATION') continue;

      const senderObj = m.sender || {};
      const senderId = senderObj.id || senderObj.userId || m.senderId;

      // Nếu là tin của mình -> Return ngay lập tức
      if (me && senderId && String(me.id) === String(senderId)) {
        return m.messageId || m._tempId;
      }
    }
    return null;
  }, [messages, me]);

  if (msgLoading && messages.length === 0) {
    return <MessageShimmer count={4} />;
  }

  if (messages.length === 0) return <div className="chat-empty">Chưa có tin nhắn.</div>;

  return (
    <>
      {msgLoading && messages.length > 0 && <MessageShimmer count={2} />}

      {messageGroups.map((group, gIdx) => {
        // TIME separator
        if (group.type === 'TIME') {
          return (
            <div key={`time-${gIdx}`} className="message-time-separator">
              <span>{group.content}</span>
            </div>
          );
        }

        if (group.type === 'SYSTEM') return <div key={`sys-${gIdx}`} className="message-system"><span>{group.content}</span></div>;

        return (
          <div key={group.id || gIdx} className={`message-group ${group.isMe ? "me" : ""}`}>
            {!group.isMe && (
              <div className="message-group-avatar">
                <img
                  src={group.senderAvatar || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'}
                  referrerPolicy='no-referrer'
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'; }}
                  loading="lazy"
                  onClick={() => onAvatarClick && onAvatarClick(group)}
                  alt=""
                  style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.06)' }}
                />
              </div>
            )}

            <div className="message-group-content">
              {!group.isMe && <div className="message-group-name">{group.senderName}</div>}

              {group.messages.map((msg, mIdx) => {
                const isLastInGroup = mIdx === group.messages.length - 1;
                const isRead = readReceipts?.[msg.messageId] || msg.isRead;
                const msgId = msg.messageId || msg._tempId;

                return (
                  <div key={msgId || mIdx} className="message-row" data-message-id={msgId} data-is-me={group.isMe ? "true" : "false"}>
                    <div className="message-content-stack" style={{ display: 'flex', flexDirection: 'column', alignItems: group.isMe ? 'flex-end' : 'flex-start', gap: 6 }}>

                      {/* --- 1. TEXT BUBBLE --- */}
                      {(msg.content && msg.content.trim().length > 0) && (
                        <div className="chat-bubble-wrapper">
                          {renderReactionUI(msg)}
                          <div className={`chat-bubble ${group.isMe ? "me" : "other"}`}>

                            {/* === [MỚI] PHẦN HIỂN THỊ REPLY === */}
                            {msg.replyToMessage && (
                              <div
                                className="reply-quote-block"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const targetId = msg.replyToMessage.messageId || msg.replyToMessage._tempId;
                                  try {
                                    const el = document.querySelector(`[data-message-id="${targetId}"]`);
                                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  } catch (err) { }
                                }}
                              >
                                <div className="reply-quote-line"></div>
                                <div className="reply-quote-content">
                                  <div className="reply-quote-name">
                                    {group.isMe && ((msg.replyToMessage.senderName === (me && me.nickname)) || (msg.replyToMessage.sender && msg.replyToMessage.sender.nickname === (me && me.nickname))) ? 'Chính mình' : (msg.replyToMessage.senderName || (msg.replyToMessage.sender && (msg.replyToMessage.sender.nickname || msg.replyToMessage.sender.fullName)) || 'Unknown')}
                                  </div>
                                  <div className="reply-quote-text">
                                    {(() => {
                                      if (msg.replyToMessage.content && msg.replyToMessage.content.trim() !== '') return msg.replyToMessage.content;
                                      // Nếu có media, ưu tiên lấy mediaType từ object media hoặc mediaType trên message
                                      if (msg.replyToMessage.media && msg.replyToMessage.media.length > 0) {
                                        const first = msg.replyToMessage.media[0] || {};
                                        const t = first.type || first.mediaType || msg.replyToMessage.mediaType || 'FILE';
                                        return getMediaLabel(t);
                                      }
                                      if (msg.replyToMessage.hasMedia) return getMediaLabel(msg.replyToMessage.mediaType || 'FILE');
                                      return 'Tin nhắn đã bị xóa';
                                    })()}
                                  </div>
                                </div>
                              </div>
                            )}
                            {/* === KẾT THÚC PHẦN REPLY === */}

                            <div className="chat-bubble-content">{msg.content}</div>
                            {renderReactionDisplay(msg)}
                          </div>
                        </div>
                      )}

                      {/* --- 2. MEDIA FILES (IMAGE / AUDIO) --- */}
                      {/* Bọc media trong chat-bubble-wrapper để có nút reaction */}
                      {msg.media && msg.media.length > 0 && (
                        <div className="message-media-stack" style={{ display: 'flex', flexDirection: 'column', alignItems: group.isMe ? 'flex-end' : 'flex-start', gap: 6 }}>
                          {msg.media.map((f, i) => {
                            const url = f.url || f.fileUrl;
                            const name = f.fileName || '';
                            const isAudio = f.type === 'AUDIO' || (f.type === 'FILE' && /\.(mp3|wav|ogg|m4a|flac)$/i.test(name));
                            const isImage = f.type === 'IMAGE';

                            // Chỉ IMAGE và AUDIO mới cho phép Reaction kiểu này (File thường thì thôi cho đỡ rối)
                            if (isImage || isAudio) {
                              return (
                                <div key={i} className="chat-bubble-wrapper media-wrapper">
                                  {/* Trigger Menu */}
                                  {renderReactionUI(msg)}

                                  {/* Content */}
                                  <div className="media-content" style={{ position: 'relative' }}>
                                    {isImage && (
                                      <img
                                        src={url}
                                        alt={name}
                                        style={{ maxWidth: 240, borderRadius: 10, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', display: 'block' }}
                                        onClick={(e) => { e.stopPropagation(); setPreviewMedia(f); setPreviewOpen(true); }}
                                        onLoad={onMediaLoad}
                                      />
                                    )}
                                    {isAudio && (
                                      <div onClick={(e) => e.stopPropagation()}>
                                        <InlineAudioPlayer src={url} />
                                      </div>
                                    )}

                                    {/* Display Reactions for this message underneath the media */}
                                    {renderReactionDisplay(msg)}
                                  </div>
                                </div>
                              );
                            }

                            // FILE thường (không có reaction wrapper cho đỡ rối, hoặc bạn có thể bọc nốt nếu muốn)
                            return (
                              <div key={i} className="media-file" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.16)' }} onClick={(e) => { e.stopPropagation(); setPreviewMedia(f); setPreviewOpen(true); }}>
                                <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 6 }}>
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM13 3.5L18.5 9H13V3.5zM8 13h8v2H8v-2zm0-4h8v2H8V9z" /></svg>
                                </div>
                                <div>
                                  <div style={{ fontSize: 14, fontWeight: 600 }}>{name || 'file'}</div>
                                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{f.fileSize ? `${Math.round(f.fileSize / 1024)} KB` : ''}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                    </div>

                    {/* STATUS SEEN/SENT */}
                    {group.isMe && (
                      (msgId === lastReadMessageId)
                        ? (() => {
                          const readers = lastReadReaders && lastReadReaders.length > 0 ? lastReadReaders : [{ avatarUrl: recipientAvatar }];
                          const maxShow = 3;
                          const show = readers.slice(0, maxShow);
                          const extra = readers.length - show.length;
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginTop: 4 }}>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                {show.map((r, idx) => (
                                  <img key={r.userId || idx} src={r.avatarUrl || recipientAvatar} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = recipientAvatar; }} alt="seen" title={r.name || ''} style={{ width: 14, height: 14, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.12)', marginLeft: idx === 0 ? 0 : -4 }} />
                                ))}
                                {extra > 0 && <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, marginLeft: -4 }}>+{extra}</div>}
                              </div>
                            </div>
                          );
                        })()
                        : (msgId === lastMyMessageId) ? <div className="status-text" style={{ textAlign: 'right', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Đã gửi</div> : null
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {typingUsers && typingUsers.length > 0 && (
        <div className="message-group">
          <div className="message-group-avatar">
            <img
              src={(typingUsers[0] && (typingUsers[0].avatarUrl || typingUsers[0].avatar)) || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'}
              alt={typingUsers[0]?.username || typingUsers[0]?.name || 'typing'}
              style={{ width: 32, height: 32, borderRadius: '50%' }}
            />
          </div>
          <div className="message-group-content">
            <div className="chat-bubble other typing-bubble">
              <div className="chat-bubble-content">
                <div className="typing-dots"><span></span><span></span><span></span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ float: "left", clear: "both", height: 1 }}></div>
      <MediaPreview open={previewOpen} media={previewMedia} onClose={() => { setPreviewOpen(false); setPreviewMedia(null); }} />
      <ReactionListModal open={reactionModalOpen} onClose={() => setReactionModalOpen(false)} messageId={reactionModalMsgId} users={reactionModalData} />
    </>
  );
});

export default MessageList;