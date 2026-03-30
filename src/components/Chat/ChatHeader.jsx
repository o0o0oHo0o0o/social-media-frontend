import React from 'react';
import './ChatHeader.css'; // Import file CSS mới

const ChatHeader = ({
  activeConv,
  activityStatus,
  onToggleDrawer,
  onStartCall,       // Gọi thoại (Audio)
  onStartVideoCall   // Gọi Video (Nếu có)
}) => {

  // Logic hiển thị Avatar: Ảnh > Chữ cái đầu > 'C'
  const avatarUrl = activeConv?.avatarUrl || null;
  const conversationName = activeConv?.conversationName || `Conversation ${activeConv?.conversationId || ''}`;
  const firstChar = conversationName ? conversationName.charAt(0) : 'C';

  const formatLastActive = (isoDate) => {
    if (!isoDate) return 'Vừa hoạt động';
    const ts = new Date(isoDate).getTime();
    if (!Number.isFinite(ts)) return 'Vừa hoạt động';
    const diffMin = Math.floor((Date.now() - ts) / 60000);
    if (diffMin <= 1) return 'Vừa hoạt động';
    if (diffMin < 60) return `Hoạt động ${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `Hoạt động ${diffHour} giờ trước`;
    return 'Đã hoạt động trước đó';
  };

  const isOnline = Boolean(activityStatus?.isOnline);
  const isTyping = Boolean(activityStatus?.isTyping);
  const statusText = activeConv?.isGroupChat
    ? `${activeConv.memberCount || 2} thành viên`
    : (isTyping ? 'Đang nhập...' : (isOnline ? 'Đang hoạt động' : formatLastActive(activityStatus?.lastActiveAt)));

  return (
    <header className="chat-header">
      {/* 1. Bên trái: Avatar + Tên */}
      <div className="chat-header-left">
        <div className="header-avatar-container">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="header-avatar-img" />
          ) : (
            <div className="header-avatar-placeholder">{firstChar}</div>
          )}
          {/* Chấm xanh chỉ hiện nếu không phải group chat (hoặc tùy logic của bạn) */}
          {!activeConv?.isGroupChat && isOnline && <div className="online-status-dot" />}
        </div>

        <div className="header-info">
          <div className="header-title" title={conversationName}>{conversationName}</div>
          <div className="header-subtitle">{statusText}</div>
        </div>
      </div>

      {/* 2. Bên phải: Các nút hành động */}
      <div className="chat-header-actions">
        {/* Nút Gọi Thoại */}
        <button
          className="header-icon-btn"
          onClick={(e) => { e.stopPropagation(); onStartCall && onStartCall(); }}
          title="Bắt đầu gọi thoại"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.07 21 3 13.93 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.25 1.01l-2.2 2.21z" /></svg>
        </button>

        {/* Nút Gọi Video (Thêm vào cho đẹp, nếu chưa có logic thì để đó tính sau) */}
        <button
          className="header-icon-btn"
          onClick={(e) => { e.stopPropagation(); onStartVideoCall && onStartVideoCall(); }}
          title="Bắt đầu gọi video"
        >
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 10.48V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4.48l4 3.98v-11l-4 3.98z" /></svg>
        </button>

        {/* Nút Thông tin (Dấu 3 chấm hoặc chữ i) */}
        <button
          className="header-icon-btn info-btn"
          onClick={onToggleDrawer}
          title="Thông tin hội thoại"
        >
          {/* Icon chữ i tròn (giống Messenger) */}
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>

          {/* Hoặc dùng Icon 3 chấm nếu bạn thích */}
          {/* <svg viewBox="0 0 24 24"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg> */}
        </button>
      </div>
    </header>
  );
};

export default ChatHeader;