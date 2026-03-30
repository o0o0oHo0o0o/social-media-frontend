import React from 'react';
import Dialog from '../../Common/Dialog';

/**
 * LogoutDialog - Dialog xác nhận đăng xuất
 */
const LogoutDialog = ({ open, onClose, onConfirm }) => {
  return (
    <Dialog
      open={open}
      title="Đăng xuất"
      onClose={onClose}
      actions={(
        <>
          <button className="dialog-btn" onClick={onClose}>Huỷ</button>
          <button className="dialog-btn primary" onClick={onConfirm}>Đăng xuất</button>
        </>
      )}
    >
      <div>
        Bạn có chắc chắn muốn đăng xuất khỏi tài khoản hiện tại?
      </div>
    </Dialog>
  );
};

export default LogoutDialog;
