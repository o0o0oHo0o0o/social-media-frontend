import React, { useEffect, useState } from 'react';
import Dialog from '../Common/Dialog';
import api from '../../services/api';
import { FollowApi } from '../../utils/feedApi';
import './ChatSidebar.css'; // Import file CSS mới

const ChatSidebar = ({
  conversations,
  activeConv,
  onSelectConversation,
  me,
  onOpenProfile,
  conversationId,
  setConversationId,
  addConversation,
  activityByUser,
  activityNow,
  onNavigateToFeed,
  onLogout
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [inboxTab, setInboxTab] = useState('FRIENDS');
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [memberQuery, setMemberQuery] = useState('');
  const [memberResults, setMemberResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupLoading, setGroupLoading] = useState(false);
  const [memberSearching, setMemberSearching] = useState(false);
  const [groupError, setGroupError] = useState('');

  const normalizedType = (type) => {
    const t = String(type || '').toUpperCase();
    if (t === 'FRIENDS' || t === 'PRIMARY') return 'FRIENDS';
    if (t === 'STRANGERS' || t === 'GENERAL' || t === 'REQUEST') return 'STRANGERS';
    return 'STRANGERS';
  };

  const conversationsByTab = conversations.filter(c => normalizedType(c?.inboxType) === inboxTab);
  const filteredConversations = conversationsByTab.filter(c =>
    c.conversationName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const friendsCount = conversations.filter(c => normalizedType(c?.inboxType) === 'FRIENDS').length;
  const strangersCount = conversations.filter(c => normalizedType(c?.inboxType) === 'STRANGERS').length;

  const getUserId = (u) => u?.id ?? u?.userId ?? u?.UserID;
  const getUserName = (u) => u?.username ?? u?.userName ?? u?.Username;
  const getDisplayName = (u) => u?.fullName ?? u?.displayName ?? getUserName(u) ?? 'Unknown';
  const getAvatarUrl = (u) => u?.avatarUrl ?? u?.profilePictureURL ?? u?.profilePictureUrl ?? u?.avatar ?? null;

  useEffect(() => {
    if (!groupDialogOpen) return;

    const q = memberQuery.trim();
    if (q.length < 2) {
      setMemberResults([]);
      return;
    }

    let cancelled = false;
    setMemberSearching(true);
    setGroupError('');

    const t = setTimeout(async () => {
      try {
        const result = await FollowApi.searchGroupCandidates(q);
        if (!result.ok) throw new Error(`Search failed (HTTP ${result.status})`);
        const list = Array.isArray(result.data) ? result.data : [];

        if (cancelled) return;
        const meId = getUserId(me);
        const normalized = list
          .filter(u => String(getUserId(u)) !== String(meId))
          .map(u => ({
            ...u,
            _id: getUserId(u),
            _username: getUserName(u),
            _displayName: getDisplayName(u),
            _avatarUrl: getAvatarUrl(u),
            _isMutualFollow: Boolean(u?.isMutualFollow),
            _eligibleForGroup: (typeof u?.eligibleForGroup === 'boolean') ? u.eligibleForGroup : Boolean(u?.isMutualFollow),
            _eligibilityReason: u?.eligibilityReason || null
          }));
        setMemberResults(normalized);
      } catch (err) {
        if (!cancelled) {
          console.error('[ChatSidebar] search users failed', err);
          setGroupError(err?.message || 'Không thể tìm người dùng');
        }
      } finally {
        if (!cancelled) setMemberSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [groupDialogOpen, memberQuery, me]);

  const resetGroupDialog = () => {
    setGroupDialogOpen(false);
    setGroupName('');
    setMemberQuery('');
    setMemberResults([]);
    setSelectedMembers([]);
    setGroupLoading(false);
    setMemberSearching(false);
    setGroupError('');
  };

  const toggleMember = (candidate) => {
    if (!candidate?._id) return;
    if (!candidate._eligibleForGroup) {
      setGroupError(candidate._eligibilityReason || 'Người này chưa đủ điều kiện để vào nhóm.');
      return;
    }
    setGroupError('');
    setSelectedMembers(prev => {
      const exists = prev.some(m => String(m._id) === String(candidate._id));
      if (exists) return prev.filter(m => String(m._id) !== String(candidate._id));
      return [...prev, candidate];
    });
  };

  const removeSelected = (uid) => {
    setSelectedMembers(prev => prev.filter(m => String(m._id) !== String(uid)));
  };

  const handleCreateGroup = async () => {
    const trimmedName = groupName.trim();
    if (!trimmedName) {
      setGroupError('Vui lòng nhập tên nhóm.');
      return;
    }
    if (selectedMembers.length < 2) {
      setGroupError('Nhóm cần ít nhất 2 thành viên (ngoài bạn).');
      return;
    }

    setGroupLoading(true);
    setGroupError('');
    try {
      const conversation = await api.createConversation({
        name: trimmedName,
        isGroup: true,
        memberIds: selectedMembers.map(m => Number(m._id)).filter(Boolean)
      });

      addConversation?.(conversation);
      onSelectConversation?.(conversation);
      resetGroupDialog();
    } catch (err) {
      console.error('[ChatSidebar] create group failed', err);
      setGroupError(err?.message || 'Không thể tạo nhóm lúc này.');
    } finally {
      setGroupLoading(false);
    }
  };

  const formatLastActive = (isoDate) => {
    if (!isoDate) return 'Không hoạt động gần đây';
    const ts = new Date(isoDate).getTime();
    if (!Number.isFinite(ts)) return 'Không hoạt động gần đây';
    const diffMin = Math.floor(((activityNow || Date.now()) - ts) / 60000);
    if (diffMin <= 1) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDay = Math.floor(diffHour / 24);
    return `${diffDay} ngày trước`;
  };

  const getConversationActivity = (conv) => {
    const isGroup = Boolean(conv?.isGroupChat || conv?.isGroup);
    if (isGroup) {
      return {
        isGroup: true,
        isOnline: false,
        isTyping: false,
        lastActiveAt: null
      };
    }

    const otherId = conv?.otherUserId || conv?.otherUserID || conv?.recipientId || null;
    const byId = otherId ? activityByUser?.[`id:${otherId}`] : null;
    const byUsername = conv?.otherUserUsername ? activityByUser?.[`u:${conv.otherUserUsername}`] : null;
    const tracked = byId || byUsername || null;

    const lastActiveAt = tracked?.lastActiveAt || conv?.lastActiveAt || conv?.otherUserLastActiveAt || null;
    const isRecent = lastActiveAt
      ? (((activityNow || Date.now()) - new Date(lastActiveAt).getTime()) <= 2 * 60 * 1000)
      : false;

    const isOnline = Boolean(conv?.isOnline || conv?.otherUserOnline || tracked?.typing || tracked?.online || isRecent);
    return {
      isGroup: false,
      isOnline,
      isTyping: Boolean(tracked?.typing),
      lastActiveAt
    };
  };

  return (
    <aside className="chat-sidebar">
      {/* 1. HEADER: Title to + Icons */}
      <div className="chat-sidebar-header">
        <div className="chat-sidebar-title-large">Chat</div>
        <div className="header-actions">
          {/* Nút Profile (Avatar nhỏ của mình) */}
          <button
            className="icon-btn"
            title="Trang cá nhân"
            onClick={onOpenProfile}
          >
            {me?.avatarUrl ? (
              <img src={me.avatarUrl} alt="me" />
            ) : (
              <span>{(me?.fullName?.[0] || 'M')}</span>
            )}
          </button>

          {/* Nút Feed */}
          <button className="icon-btn" title="Về trang tin" onClick={onNavigateToFeed}>
            <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
          </button>

          {/* Nút tạo nhóm */}
          <button className="icon-btn" title="Tạo nhóm chat" onClick={() => setGroupDialogOpen(true)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2l1.9 4.1L18 8l-4.1 1.9L12 14l-1.9-4.1L6 8l4.1-1.9L12 2zm7 10l1.1 2.4L22.5 15l-2.4 1.1L19 18.5l-1.1-2.4L15.5 15l2.4-1.1L19 12zm-14 0l1 2.2L8.2 15 6 16l-1 2.2L4 16l-2.2-1L4 14l1-2z" />
            </svg>
          </button>

          {/* Nút Logout */}
          <button className="icon-btn" title="Đăng xuất" onClick={onLogout}>
            <svg viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" /></svg>
          </button>
        </div>
      </div>

      {/* 2. SEARCH BAR */}
      <div className="chat-search-container">
        <div className="search-input-wrapper">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="#b0b3b8"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" /></svg>
          <input
            placeholder="Tìm kiếm trên Messenger"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="chat-inbox-tabs">
        <button
          type="button"
          className={`chat-inbox-tab ${inboxTab === 'FRIENDS' ? 'active' : ''}`}
          onClick={() => setInboxTab('FRIENDS')}
        >
          Bạn bè
          <span className="chat-inbox-count">{friendsCount}</span>
        </button>
        <button
          type="button"
          className={`chat-inbox-tab ${inboxTab === 'STRANGERS' ? 'active' : ''}`}
          onClick={() => setInboxTab('STRANGERS')}
        >
          Người lạ
          <span className="chat-inbox-count">{strangersCount}</span>
        </button>
      </div>

      {/* 3. CHAT LIST */}
      <div className="chat-list">
        {filteredConversations.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 40, color: '#b0b3b8', fontSize: 14 }}>
            {inboxTab === 'FRIENDS'
              ? 'Chưa có cuộc trò chuyện trong luồng Bạn bè.'
              : 'Chưa có cuộc trò chuyện trong luồng Người lạ.'}
          </div>
        ) : filteredConversations.map(c => {
          const activity = getConversationActivity(c);

          // Logic hiển thị time
          const timeStr = c.lastMessageTime ? (() => {
            try {
              const time = new Date(c.lastMessageTime);
              const now = new Date();
              const diff = (now - time) / 1000 / 60; // minutes
              if (diff < 1) return 'vừa xong';
              if (diff < 60) return `${Math.floor(diff)}p`;
              if (diff < 1440) return time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
              return time.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            } catch (e) { return ''; }
          })() : '';

          // Logic hiển thị preview text
          const lastSender = c.lastSender || {};
          const senderName = lastSender.fullName || lastSender.username || lastSender.name || lastSender.displayName;
          const senderId = lastSender.userId || lastSender.id || lastSender.senderId;
          const myId = me?.id || me?.userId;
          const isMe = myId && senderId && String(senderId) === String(myId);
          const prefix = isMe ? 'Bạn: ' : (senderName ? `${senderName}: ` : '');

          let preview = c.lastMessageContent || 'Đã gửi file đính kèm';
          if (!c.lastMessageContent && !c.lastMessageTime) preview = 'Bắt đầu trò chuyện ngay';

          const isActive = activeConv?.conversationId === c.conversationId;
          const isUnread = c.unreadCount > 0;

          return (
            <div
              key={c.conversationId}
              className={`chat-item ${isActive ? 'active' : ''} ${isUnread ? 'unread' : ''}`}
              onClick={() => onSelectConversation(c)}
            >
              {/* Avatar */}
              <div className="avatar-wrapper">
                {c.avatarUrl ? (
                  <img src={c.avatarUrl} alt="" className="chat-item-avatar" onError={(e) => e.target.style.display = 'none'} />
                ) : (
                  <div className="avatar-placeholder">{(c.conversationName || 'U')[0]}</div>
                )}
                {!activity.isGroup && (
                  <div className={`status-dot ${activity.isOnline ? 'online' : 'offline'}`}></div>
                )}
              </div>

              {/* Info */}
              <div className="chat-info">
                <div className="chat-name">{c.conversationName || `Chat ${c.conversationId}`}</div>
                <div className="chat-preview-row">
                  <div className="preview-text">
                    {isUnread && <span style={{ color: '#2e89ff', marginRight: 4 }}>●</span>}
                    <span className={isUnread ? "sender-name" : ""}>{prefix}</span>
                    {preview}
                  </div>
                  <div className="chat-meta">
                    <span className={`presence-text ${activity.isOnline ? 'online' : 'offline'}`}>
                      {activity.isGroup
                        ? 'Nhóm'
                        : activity.isTyping
                          ? 'Đang nhập...'
                          : (activity.isOnline ? 'Đang hoạt động' : `Offline ${formatLastActive(activity.lastActiveAt)}`)}
                    </span>
                    {timeStr && <span>· {timeStr}</span>}
                  </div>
                </div>
              </div>

              {/* Unread Dot (Blue) */}
              {isUnread && <div className="unread-dot"></div>}
            </div>
          );
        })}
      </div>

      {/* Debug area removed per request */}

      <Dialog
        open={groupDialogOpen}
        onClose={resetGroupDialog}
        title="Create Circle"
        className="group-create-dialog"
        backdropClassName="group-create-backdrop"
        actions={(
          <>
            <button className="dialog-btn cancel" onClick={resetGroupDialog} disabled={groupLoading}>Close</button>
            <button className="dialog-btn confirm" onClick={handleCreateGroup} disabled={groupLoading}>
              {groupLoading ? 'Creating...' : 'Create'}
            </button>
          </>
        )}
      >
        <div className="group-create-body">
          <div className="group-create-accent" aria-hidden="true">
            <span>✦</span>
            <span>Pick members • Name • Go</span>
          </div>

          <input
            className="group-input"
            placeholder="Group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />

          <div className="group-rule-row">
            <span className="group-rule-chip">Mutual follow</span>
            <span className="group-rule-chip">Min 2 members</span>
          </div>

          <input
            className="group-input"
            placeholder="Search @username"
            value={memberQuery}
            onChange={(e) => setMemberQuery(e.target.value)}
          />

          {selectedMembers.length > 0 && (
            <div className="group-selected-list">
              {selectedMembers.map(m => (
                <button key={m._id} type="button" className="group-selected-chip" onClick={() => removeSelected(m._id)} title="Bỏ khỏi nhóm">
                  {m._displayName}
                </button>
              ))}
            </div>
          )}

          <div className="group-search-list">
            {memberSearching ? (
              <div className="group-search-empty">Searching...</div>
            ) : memberResults.length === 0 ? (
              <div className="group-search-empty">No match</div>
            ) : memberResults.map(candidate => {
              const chosen = selectedMembers.some(m => String(m._id) === String(candidate._id));
              const blocked = !candidate._eligibleForGroup;
              return (
                <button
                  key={candidate._id}
                  type="button"
                  className={`group-search-item ${chosen ? 'selected' : ''} ${blocked ? 'blocked' : ''}`}
                  onClick={() => toggleMember(candidate)}
                >
                  <div className="group-member-left">
                    {candidate._avatarUrl ? (
                      <img className="group-member-avatar" src={candidate._avatarUrl} alt={candidate._displayName} />
                    ) : (
                      <div className="group-member-avatar placeholder">{(candidate._displayName || 'U')[0]}</div>
                    )}
                    <div className="group-member-text">
                      <div className="group-member-name">{candidate._displayName}</div>
                      <div className="group-member-sub">@{candidate._username || 'unknown'}</div>
                    </div>
                  </div>
                  <div className={`group-member-badge ${candidate._isMutualFollow ? 'friend' : 'stranger'}`}>
                    {candidate._isMutualFollow ? 'Friend' : 'Other'}
                  </div>
                  {blocked && (
                    <div className="group-member-badge stranger" style={{ marginLeft: 6 }}>
                      {candidate._eligibilityReason || 'Unavailable'}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {groupError && <div className="group-error">{groupError}</div>}
        </div>
      </Dialog>
    </aside>
  );
};

export default ChatSidebar;