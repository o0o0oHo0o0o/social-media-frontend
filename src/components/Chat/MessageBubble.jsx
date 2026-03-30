import React, { memo, useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import AudioPlayer from './AudioPlayer';
import api from '../../services/api';
import Dialog from '../../components/Common/Dialog';
import './message-reactions.css';

// MessageBubble: hiển thị một tin nhắn, gọn gàng và không lặp trạng thái
const MessageBubble = memo(function MessageBubble({
  msg,
  msgId,
  isMe,
  isNotification,
  senderName,
  senderInitial,
  messageTime,
  showTimestamp,
  sentAt,
  isConsecutive,
  isLastInGroup,
  isRead,
  isDelivered,
  isSending,
  isFailed,
  recipient,
  recipientInitial,
  isLastMessage,
  isGroupChat,
  onAvatarClick,
  onImagePreview,
  onMediaLoad,
  me,
  readReceipt
}) {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const bubbleRef = useRef(null);
  const baseReactions = msg?.reactions || msg?.interactableItem?.reactions || [];
  const [reactionsState, setReactionsState] = useState(baseReactions);

  useEffect(() => {
    try {
      const key = JSON.stringify((baseReactions || []).map(r => `${r.userId}:${r.reactionType}`));
      setReactionsState(prev => {
        const prevKey = JSON.stringify((prev || []).map(r => `${r.userId}:${r.reactionType}`));
        return key === prevKey ? prev : (baseReactions || []);
      });
    } catch (e) {
      setReactionsState(baseReactions || []);
    }
  }, [msgId, baseReactions]);

  // System/notification message renders as a divider
  if (isNotification) {
    return (
      <React.Fragment>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          margin: '16px 0',
          color: '#999',
          fontSize: '12px'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <div>{msg?.content || msg?.messageBody}</div>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        </div>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      {showTimestamp && sentAt && (
        <div className="chat-timestamp-divider">
          {sentAt.toLocaleString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit'
          })}
        </div>
      )}

      <div className={`message-row ${isMe ? 'me' : 'other'} ${isConsecutive ? 'consecutive' : ''}`}>
        {/* Avatar / spacer */}
        {!isMe && isLastInGroup ? (
          <div className="chat-bubble-avatar" title={senderName} onClick={onAvatarClick} style={{ cursor: 'pointer' }}>
            {(() => {
              const avatarUrl = msg?.sender?.profilePictureURL || msg?.sender?.avatarUrl;
              return (avatarUrl && !avatarFailed) ? (
                <img
                  src={avatarUrl}
                  alt={senderName}
                  loading="lazy"
                  onError={(e) => { setAvatarFailed(true); e.target.onerror = null; }}
                />
              ) : (
                senderInitial
              );
            })()}
          </div>
        ) : (!isMe && !isLastInGroup) ? (
          <div style={{ width: '32px', flexShrink: 0 }} />
        ) : null}

        {/* Bubble + summary wrapper */}
        <div style={{ position: 'relative', maxWidth: 'calc(80% - 30px)' }}>
          <div
            className={`chat-bubble ${isMe ? 'me' : 'other'} ${isConsecutive ? 'consecutive' : ''}`}
            data-message-id={msgId}
            data-is-me={isMe}
            ref={bubbleRef}
          >
            {/* Sender name is rendered by the surrounding message-group header to avoid duplicates */}

            {msg?.content && (
              <div className="chat-bubble-content" title={messageTime}>
                <span>{typeof msg === 'string' ? msg : (msg?.content || '')}</span>
              </div>
            )}

            {msg?.media && msg.media.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxWidth: '300px' }}>
                {msg.media.map((m, midx) => (
                  <div key={midx} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', maxWidth: '100%' }}>
                    {m.type === 'IMAGE' ? (
                      <img src={m.url} alt={m.fileName} style={{ maxWidth: '280px', maxHeight: '300px', borderRadius: '8px', cursor: 'pointer', display: 'block' }}
                        onClick={() => onImagePreview(m.url)}
                        onLoad={() => typeof onMediaLoad === 'function' && onMediaLoad(msgId)}
                        title="Click to preview" />
                    ) : m.type === 'VIDEO' ? (
                      <video controls style={{ maxWidth: '280px', maxHeight: '300px', borderRadius: '8px' }} onLoadedData={() => typeof onMediaLoad === 'function' && onMediaLoad(msgId)}>
                        <source src={m.url} />
                      </video>
                    ) : m.type === 'AUDIO' ? (
                      <AudioPlayer audioUrl={m.url} fileSize={m.fileSize} fileName={m.fileName} isMe={isMe} />
                    ) : (
                      <div style={{ padding: '8px 12px', background: '#333', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                        onClick={() => window.open(m.url, '_blank')} title="Click to download">
                        <span style={{ fontSize: '20px' }}>📎</span>
                        <div>
                          <div style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold', wordBreak: 'break-word' }}>{m.fileName}</div>
                          <div style={{ fontSize: '11px', color: '#aaa' }}>
                            {m.fileSize && typeof m.fileSize === 'number' && m.fileSize > 0
                              ? (m.fileSize >= 1024 * 1024
                                ? (m.fileSize / (1024 * 1024)).toFixed(1) + ' MB'
                                : (m.fileSize / 1024).toFixed(0) + ' KB')
                              : 'Unknown'
                            }
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isMe && isSending && isLastMessage && (
              <span className="chat-warning-text">⏳ Đang gửi...</span>
            )}
            {isMe && isFailed && isLastMessage && (
              <span className="chat-warning-text chat-error-text">⚠ Gửi thất bại</span>
            )}
          </div>

          {/* Reaction summary bubble (absolute, bottom corner) */}
          <ReactionSummaryDisplay
            reactions={reactionsState}
            reactionCounts={msg?.reactionCounts || msg?.interactableItem?.reactionCounts || null}
            msgId={msgId}
            me={me}
            isMe={isMe}
          />

          {/* Message status (sent / delivered / seen) positioned bottom-right of the bubble */}
          {(isMe && isLastMessage) && (
            <div className="chat-message-status">
              {isRead ? (
                <div className="chat-read-receipt">
                  <div className="chat-seen-avatar" title={(readReceipt?.reader?.fullName || readReceipt?.user?.fullName || readReceipt?.reader?.username || readReceipt?.user?.username || 'Đã xem') + ' đang xem'}>
                    {(() => {
                      const rUrl =
                        readReceipt?.reader?.avatarUrl ||
                        readReceipt?.reader?.profilePictureURL ||
                        readReceipt?.reader?.profilePictureUrl ||
                        readReceipt?.user?.avatarUrl ||
                        readReceipt?.user?.profilePictureURL ||
                        readReceipt?.user?.profilePictureUrl ||
                        null;
                      return rUrl ? (
                        <img src={rUrl}
                          alt="Seen"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        (readReceipt?.reader?.fullName || readReceipt?.reader?.username || readReceipt?.user?.fullName || readReceipt?.user?.username || recipientInitial)
                      );
                    })()}
                  </div>
                  <span>Đã xem</span>
                </div>
              ) : isDelivered ? (
                <span>Đã nhận</span>
              ) : (
                <span>Đã gửi</span>
              )}
            </div>
          )}
        </div>

        {/* Trigger button beside the bubble (click to open picker) */}
        {!isSending && !isFailed && (
          <ReactionsTrigger
            msgId={msgId}
            me={me}
            isMe={isMe}
            reactions={reactionsState}
            setReactions={setReactionsState}
          />
        )}
      </div>
    </React.Fragment>
  );
});

export default MessageBubble;

// --- ReactionSummaryDisplay: shows compact reaction icons at bubble corner ---
function ReactionSummaryDisplay({ reactions, reactionCounts, msgId, me, isMe }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogList, setDialogList] = useState([]);
  const EMOJI_MAP = { LIKE: '👍', LOVE: '❤️', HAHA: '😆', WOW: '😮', SAD: '😢', ANGRY: '😡' };

  const hasLocalReactions = reactions && reactions.length > 0;

  const counts = {};
  if (!hasLocalReactions && reactionCounts && typeof reactionCounts === 'object') {
    Object.entries(reactionCounts).forEach(([k, v]) => {
      counts[k] = Number(v) || 0;
    });
  }
  (reactions || []).forEach(r => { counts[r.reactionType] = (counts[r.reactionType] || 0) + 1; });

  const top = Object.keys(counts).sort((a, b) => (counts[b] - counts[a])).slice(0, 3);
  const total = Object.values(counts).reduce((sum, v) => sum + v, 0);
  const myReactionType = (reactions || []).find(r => String(r.userId) === String(me?.id))?.reactionType;

  const showDetail = async () => {
    try {
      const list = await api.getMessageReactions(msgId);
      setDialogList(list || []);
      setDialogOpen(true);
    } catch (e) {
      console.error('Get reaction details failed', e);
    }
  };

  if (!total) return null;

  return (
    <>
      <div className={`reaction-summary-bubble ${myReactionType ? 'mine' : ''}`} onClick={showDetail}>
        {top.map(t => (
          <span key={t} className={myReactionType === t ? 'mine-emoji' : ''} style={{ fontSize: 12 }}>
            {EMOJI_MAP[t]}
          </span>
        ))}
        <span style={{ marginLeft: 4, fontWeight: 700 }}>{total}</span>
      </div>

      <Dialog open={dialogOpen} title={`Reactions (${dialogList.length})`} onClose={() => setDialogOpen(false)} actions={(
        <button onClick={() => setDialogOpen(false)} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: '#2b2f36', color: '#fff' }}>Đóng</button>
      )}>
        <div className="reaction-dialog-animate">
          <div className="reaction-list">
            {dialogList.length === 0 && <div style={{ color: 'rgba(255,255,255,0.6)' }}>Chưa có ai thả reaction</div>}
            {dialogList.map((r, idx) => (
              <div key={idx} className="reaction-item">
                <div className="avatar">{(r.fullName || r.username || '?').charAt(0).toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{r.fullName || r.username}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{r.reactionType}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Dialog>
    </>
  );
}

// --- ReactionsTrigger: trigger button beside bubble and the emoji picker popover ---
function ReactionsTrigger({ msgId, me, reactions, setReactions }) {
  const REACTION_TYPES = [
    { key: 'LIKE', emoji: '👍' },
    { key: 'LOVE', emoji: '❤️' },
    { key: 'HAHA', emoji: '😆' },
    { key: 'WOW', emoji: '😮' },
    { key: 'SAD', emoji: '😢' },
    { key: 'ANGRY', emoji: '😡' }
  ];

  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const popoverRef = useRef(null);
  const [pickerPos, setPickerPos] = useState(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const onDoc = (e) => {
      if (containerRef.current && containerRef.current.contains(e.target)) return;
      if (popoverRef.current && popoverRef.current.contains(e.target)) return;
      setPickerOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [pickerOpen]);

  useLayoutEffect(() => {
    if (!pickerOpen) {
      setPickerPos(null);
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // popover height roughly 40 (see css). place 8px above button
    const top = rect.top - 40 - 8;
    const left = rect.left + rect.width / 2;
    setPickerPos({ top: Math.max(8, top), left });
  }, [pickerOpen]);

  const myReaction = (reactions || []).find(r => String(r.userId) === String(me?.id));

  const handleReact = async (type) => {
    if (!msgId) return;
    setLoading(true);
    const prev = reactions || [];
    const myR = prev.find(r => String(r.userId) === String(me?.id));
    let next;
    if (myR && myR.reactionType === type) next = prev.filter(r => String(r.userId) !== String(me?.id));
    else if (myR) next = prev.map(r => (String(r.userId) === String(me?.id) ? { ...r, reactionType: type } : r));
    else next = prev.concat([{ userId: me?.id, reactionType: type, fullName: me?.fullName || me?.username }]);
    setReactions(next);
    try {
      await api.reactToMessage({ messageId: msgId, reactionType: type });
      setPickerOpen(false);
    } catch (e) {
      console.error('Reaction API failed, rolling back', e);
      setReactions(prev);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="reaction-trigger-container">
      <button className={`reaction-trigger-btn ${pickerOpen ? 'active' : ''}`} onClick={() => setPickerOpen(p => !p)} title="Bày tỏ cảm xúc">☺</button>
      {pickerOpen && pickerPos && createPortal(
        <div ref={popoverRef} className="reaction-picker-popover" style={{ position: 'fixed', top: pickerPos.top + 'px', left: pickerPos.left + 'px', transform: 'translateX(-50%)' }}>
          {REACTION_TYPES.map(t => (
            <button key={t.key} className={`emoji-btn ${myReaction && myReaction.reactionType === t.key ? 'selected' : ''}`} onClick={() => handleReact(t.key)} disabled={loading}>{t.emoji}</button>
          ))}
        </div>
        , document.body)}
    </div>
  );
}

