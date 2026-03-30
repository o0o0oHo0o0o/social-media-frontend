import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import MemberNicknameList from './MemberNicknameList';
import PhotoGallery from './PhotoGallery';
import FileList from './FileList';
import { useConversationPhotos, useConversationFiles, useConversationMembers } from '../../hooks/useConversationMedia';

/**
 * ChatDrawer - Panel bên phải hiển thị thông tin đoạn chat
 * Gồm: Nicknames, Photos, Files
 */
const ChatDrawer = ({ open, conversationId, onClose, isGroupChat = false, groupName = '', conversationAvatar = '', groupAvatarUrl = '', refreshKey = 0, onRenameGroup, onNicknameUpdated }) => {
  console.log('[ChatDrawer] header render', { conversationId, isGroupChat, conversationAvatar, groupAvatarUrl, groupName });
  const [activeTab, setActiveTab] = useState('members'); // 'members', 'photos', 'files'
  const [prevConversationId, setPrevConversationId] = useState(null);
  const [currentAvatar, setCurrentAvatar] = useState(groupAvatarUrl || conversationAvatar || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setCurrentAvatar(groupAvatarUrl || conversationAvatar || '');
  }, [groupAvatarUrl, conversationAvatar]);

  const { members, loadingMembers, fetchMembers, resetMembers } = useConversationMembers(conversationId);
  const { photos, hasMorePhotos, loadingPhotos, fetchPhotos, resetPhotos } = useConversationPhotos(conversationId);
  const { files, hasMoreFiles, loadingFiles, fetchFiles, resetFiles } = useConversationFiles(conversationId);

  // Reset ALL data and refetch when conversationId changes
  useEffect(() => {
    if (conversationId && conversationId !== prevConversationId) {
      console.log('[ChatDrawer] Conversation changed:', prevConversationId, '->', conversationId);
      setPrevConversationId(conversationId);

      // Reset all data first
      resetMembers();
      resetPhotos();
      resetFiles();

      // Refetch all data for new conversation when drawer is open
      if (open) {
        fetchMembers();
        fetchPhotos(0);
        fetchFiles(0);
        // Reset to members tab when switching conversation
        setActiveTab('members');
      }
    }
  }, [conversationId, prevConversationId, open, fetchMembers, fetchPhotos, fetchFiles, resetMembers, resetPhotos, resetFiles]);

  // Refetch when refreshKey changes (triggered by socket events)
  useEffect(() => {
    if (open && conversationId && refreshKey > 0) {
      console.log('[ChatDrawer] Refreshing due to refreshKey:', refreshKey);
      fetchMembers();
    }
  }, [refreshKey, open, conversationId, fetchMembers]);

  // Debug logging to help trace why content may be empty
  useEffect(() => {
    console.log('[ChatDrawer] render debug:', { open, conversationId, activeTab, membersCount: members.length, photosCount: photos.length, filesCount: files.length });
  }, [open, conversationId, activeTab, members.length, photos.length, files.length]);

  useEffect(() => {
    if (!open || !conversationId) return;

    // Fetch data khi drawer mở theo tab
    if (activeTab === 'members' && members.length === 0) {
      fetchMembers();
    } else if (activeTab === 'photos' && photos.length === 0) {
      fetchPhotos(0);
    } else if (activeTab === 'files' && files.length === 0) {
      fetchFiles(0);
    }
  }, [open, activeTab, members.length, photos.length, files.length, fetchMembers, fetchPhotos, fetchFiles, conversationId]);

  const handleLoadMorePhotos = () => {
    fetchPhotos(Math.ceil(photos.length / 20));
  };

  const handleLoadMoreFiles = () => {
    fetchFiles(Math.ceil(files.length / 10));
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '360px',
        background: '#000',
        borderLeft: '1px solid rgba(25,118,210,0.08)',
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.6)',
        animation: 'slideInRight 0.28s ease-out'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '12px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.3)',
        flexDirection: 'column',
        alignItems: 'flex-start'
      }}>
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: 600 }}>
            Chi tiết đoạn chat
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '0 4px',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.7'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            ✕
          </button>
        </div>
        {groupName ? (
          <div style={{ marginTop: '8px', color: '#ddd', fontSize: '13px', width: '100%', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', width: 72, height: 72 }}>
              <img
                src={currentAvatar || (isGroupChat ? (groupAvatarUrl || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png') : (conversationAvatar || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'))}
                alt="avatar"
                loading="lazy"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'; }}
                style={{ width: '100%', height: '100%', borderRadius: 12, objectFit: 'cover', border: '2px solid rgba(25,118,210,0.14)' }}
              />
              {/* Pencil edit button */}
              <button
                aria-label="Thay ảnh nhóm"
                title="Thay ảnh nhóm"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                style={{
                  position: 'absolute',
                  right: -6,
                  bottom: -6,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: '1.5px solid rgba(255,255,255,0.18)',
                  background: 'rgba(0,0,0,0.45)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                  padding: 0,
                  transition: 'all 0.12s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(100,116,255,0.18)'; e.currentTarget.style.border = '1.5px solid rgba(100,116,255,0.28)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.45)'; e.currentTarget.style.border = '1.5px solid rgba(255,255,255,0.18)'; e.currentTarget.style.color = '#ffffff'; }}
              >
                {uploading ? (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
                  </svg>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const f = e.target.files && e.target.files[0];
                  if (!f) return;
                  if (!f.type.startsWith('image/')) { alert('Vui lòng chọn file ảnh hợp lệ'); e.target.value = ''; return; }
                  try {
                    setUploading(true);
                    const res = await api.updateConversationAvatar(conversationId, f);
                    // Backend may return { message, data } or simple url
                    const newUrl = res?.data || res?.url || (typeof res === 'string' ? res : null) || res?.mediaUrl || null;
                    if (newUrl) {
                      setCurrentAvatar(newUrl);
                      // dispatch a global event so other parts can react
                      if (typeof window !== 'undefined' && window?.dispatchEvent) {
                        window.dispatchEvent(new CustomEvent('conversationAvatarUpdated', { detail: { conversationId, avatarUrl: newUrl } }));
                      }
                    }
                  } catch (err) {
                    console.error('Upload avatar failed', err);
                    alert('Tải ảnh thất bại: ' + (err?.message || 'Lỗi'));
                  } finally {
                    setUploading(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }
                }}
              />
            </div>
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', color: '#e6f0ff', fontWeight: 600 }}>{groupName}</div>
          </div>
        ) : null}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0',
        padding: '8px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.2)'
      }}>
        {[
          { id: 'members', label: '👥', title: 'Thành viên' },
          { id: 'photos', label: '🖼️', title: 'Ảnh' },
          { id: 'files', label: '📁', title: 'File' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            title={tab.title}
            style={{
              flex: 1,
              padding: '8px',
              background: activeTab === tab.id ? '#667eea' : 'rgba(255,255,255,0.05)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'all 0.2s',
              marginRight: '4px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0'
      }}>
        {activeTab === 'members' && (
          <MemberNicknameList
            isGroupChat={isGroupChat}
            groupName={groupName}
            conversationId={conversationId}
            members={members}
            onRefresh={fetchMembers}
            onRenameGroup={onRenameGroup}
            onNicknameUpdated={onNicknameUpdated}
          />
        )}

        {activeTab === 'members' && !loadingMembers && members.length === 0 && (
          <div style={{ padding: '12px', color: '#ccc', fontSize: '13px' }}>Không có thành viên để hiển thị</div>
        )}

        {activeTab === 'photos' && (
          <PhotoGallery
            photos={photos}
            loading={loadingPhotos}
            onLoadMore={handleLoadMorePhotos}
            hasMore={hasMorePhotos}
          />
        )}

        {activeTab === 'files' && (
          <FileList
            files={files}
            loading={loadingFiles}
            onLoadMore={handleLoadMoreFiles}
            hasMore={hasMoreFiles}
          />
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatDrawer;

