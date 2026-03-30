import React, { useState } from 'react';
import api from '../../../services/api';

/**
 * NicknameDialog - Dialog chỉnh sửa biệt danh
 */
const NicknameDialog = ({ open, onClose, conversationId, onSave }) => {
  const [newNickname, setNewNickname] = useState('');

  const handleSaveNickname = async () => {
    if (!newNickname.trim()) {
      alert('Vui lòng nhập biệt danh');
      return;
    }

    try {
      const response = await api.put(`/api/chat/${conversationId}/nickname`, {
        nickname: newNickname.trim()
      });

      alert(response?.message || 'Cập nhật biệt danh thành công');
      setNewNickname('');
      onClose();
      if (onSave) onSave();
    } catch (e) {
      console.error('Error updating nickname:', e);
      alert('Lỗi: ' + (e?.response?.data?.message || e.message || 'Cập nhật biệt danh thất bại'));
    }
  };

  return (
    open && (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            borderRadius: '16px',
            padding: '32px',
            minWidth: '300px',
            maxWidth: '500px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
          onClick={e => e.stopPropagation()}
        >
          <h3 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '18px', fontWeight: 600 }}>
            Chỉnh sửa biệt danh
          </h3>

          <input
            type="text"
            placeholder="Nhập biệt danh mới..."
            value={newNickname}
            onChange={(e) => setNewNickname(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSaveNickname();
              }
            }}
            autoFocus
            style={{
              width: '100%',
              padding: '12px 16px',
              marginBottom: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              transition: 'all 0.2s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = 'rgba(100, 200, 255, 0.5)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
          />

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
            >
              Hủy
            </button>
            <button
              onClick={handleSaveNickname}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              Lưu
            </button>
          </div>
        </div>
      </div>
    )
  );
};

export default NicknameDialog;
