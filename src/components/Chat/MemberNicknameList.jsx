import React, { useState, useEffect } from 'react';
import api from '../../services/api';

/**
 * MemberNicknameList - Component sửa biệt danh cho từng thành viên + tên nhóm
 */
const MemberNicknameList = ({ conversationId, members = [], onRefresh, isGroupChat = false, groupName = '', onRenameGroup, onNicknameUpdated }) => {
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editingNickname, setEditingNickname] = useState('');
  const [editingGroupName, setEditingGroupName] = useState(groupName);
  const [saving, setSaving] = useState(false);

  // Sync editingGroupName when groupName prop changes (from socket event)
  useEffect(() => {
    setEditingGroupName(groupName);
  }, [groupName]);

  const handleSaveNickname = async (memberId) => {
    if (!editingNickname.trim()) {
      alert('Vui lòng nhập biệt danh');
      return;
    }

    setSaving(true);
    try {
      const res = await api.put(`/api/chat/${conversationId}/nickname`, {
        userId: memberId,
        nickname: editingNickname.trim()
      });
      // Close editor immediately on success, socket will update UI later
      setEditingMemberId(null);
      setEditingNickname('');
      console.log('[MemberNicknameList] Nickname updated successfully:', res?.message);
      // Refresh member list to show new nickname immediately
      if (onRefresh) onRefresh();
      // Notify parent so sidebar/header can refresh immediately
      if (typeof onNicknameUpdated === 'function') {
        try { onNicknameUpdated(memberId, editingNickname.trim()); } catch (e) { void e; }
      }
    } catch (e) {
      console.error('Error saving nickname:', e);
      alert('Lỗi: ' + (e.message || 'Cập nhật thất bại'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGroupName = async () => {
    if (!editingGroupName.trim()) {
      alert('Vui lòng nhập tên nhóm');
      return;
    }

    setSaving(true);
    try {
      const res = await api.put(`/api/chat/${conversationId}/name`, {
        conversationName: editingGroupName.trim()
      });
      console.log('[MemberNicknameList] Group name updated successfully:', res?.message);
      // Notify parent immediately so UI updates without waiting for socket
      if (typeof onRenameGroup === 'function') {
        try { onRenameGroup(editingGroupName.trim()); } catch (e) { void e; }
      }
      // Socket event will also arrive and refresh other clients
    } catch (e) {
      console.error('Error saving group name:', e);
      alert('Lỗi: ' + (e.message || 'Cập nhật thất bại'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#fff', fontSize: '14px' }}>
        ✏️ Sửa tên đoạn chat
      </h4>
      <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={editingGroupName}
            onChange={(e) => setEditingGroupName(e.target.value)}
            placeholder="Nhập tên đoạn chat mới..."
            style={{
              flex: 1,
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '12px'
            }}
          />
          <button
            onClick={handleSaveGroupName}
            disabled={saving || editingGroupName === groupName}
            style={{
              padding: '8px 12px',
              background: '#667eea',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              opacity: saving || editingGroupName === groupName ? 0.5 : 1
            }}
          >
            Lưu
          </button>
        </div>
      </div>

      <h4 style={{ margin: '0 0 12px 0', color: '#fff', fontSize: '14px' }}>
        ✏️ Sửa biệt danh thành viên
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
        {members.length === 0 ? (
          <div style={{ color: '#aaa', fontSize: '12px' }}>Không có thành viên</div>
        ) : (
          members.map(member => {
            console.log('[MemberNicknameList] member', member?.userId, member?.avatarUrl, member?.avatar);
            const displayName = member.nickname || member.fullName || member.username;
            const hasNickname = !!member.nickname;

            return (
              <div key={member.userId} style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '12px',
                display: 'flex',
                gap: '10px',
                alignItems: 'center'
              }}>
                <img
                  src={member.avatarUrl || member.avatar || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'}
                  alt="avatar"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'; }}
                  style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.06)' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '6px' }}>
                    <div style={{ color: '#fff', fontWeight: 500 }}>
                      {displayName}
                    </div>
                    {hasNickname && (
                      <div style={{ color: '#888', fontSize: '11px', marginTop: '2px' }}>
                        ({member.fullName || member.username})
                      </div>
                    )}
                  </div>
                  {editingMemberId === member.userId ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        placeholder="Biệt danh mới..."
                        value={editingNickname}
                        onChange={(e) => setEditingNickname(e.target.value)}
                        autoFocus
                        style={{
                          flex: 1,
                          padding: '4px 8px',
                          border: '1px solid #667eea',
                          borderRadius: '4px',
                          background: 'rgba(255,255,255,0.08)',
                          color: '#fff',
                          fontSize: '12px',
                          outline: 'none'
                        }}
                      />
                      <button
                        onClick={() => handleSaveNickname(member.userId)}
                        disabled={saving}
                        style={{
                          padding: '4px 8px',
                          background: '#667eea',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          opacity: saving ? 0.6 : 1
                        }}
                      >
                        Lưu
                      </button>
                      <button
                        onClick={() => setEditingMemberId(null)}
                        style={{
                          padding: '4px 8px',
                          background: '#444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '11px'
                        }}
                      >
                        Huỷ
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#aaa' }}>
                        {member.nickname || '(Chưa có biệt danh)'}
                      </span>
                      <button
                        onClick={() => {
                          setEditingMemberId(member.userId);
                          setEditingNickname(member.nickname || '');
                        }}
                        style={{
                          padding: '2px 6px',
                          background: 'transparent',
                          color: '#667eea',
                          border: '1px solid #667eea',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '10px'
                        }}
                      >
                        Sửa
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MemberNicknameList;
