import React from 'react';

export default function IncomingCall({ remoteUser, onAccept, onReject }) {
  return (
    <div className="incoming-call-card">
      <div className="avatar-placeholder">{remoteUser?.charAt(0)}</div>
      <h3>{remoteUser} đang gọi...</h3>
      <div className="call-actions">
        <button className="btn-decline" onClick={onReject}>Từ chối</button>
        <button className="btn-accept" onClick={onAccept}>Nghe máy</button>
      </div>
    </div>
  );
}
