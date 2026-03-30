import React from 'react';
import Dialog from '../../Common/Dialog';

/**
 * UserInfoDialog - Dialog hiển thị thông tin người dùng khác
 */
const UserInfoDialog = ({ open, onClose, selectedUser }) => {
  return (
    <Dialog
      open={open}
      title="Thông tin người dùng"
      onClose={onClose}
      actions={<button className="dialog-btn primary" onClick={onClose}>Đóng</button>}
    >
      {selectedUser ? (
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 12, alignItems: 'center' }}>
          <div className="chat-avatar" style={{ width: 60, height: 60, fontSize: 24 }}>
            {selectedUser.fullName?.[0] || selectedUser.username?.[0] || 'U'}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedUser.fullName}</div>
            <div style={{ opacity: .8 }}>Username: {selectedUser.username}</div>
          </div>
        </div>
      ) : (
        <div>Không có thông tin.</div>
      )}
    </Dialog>
  );
};

export default UserInfoDialog;
