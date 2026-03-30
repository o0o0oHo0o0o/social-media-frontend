import React, { useEffect, useRef, useState } from 'react';
import Dialog from '../../Common/Dialog';
import api from '../../../services/api';

/**
 * ProfileDialog - Dialog hiển thị thông tin tài khoản hiện tại
 */
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const ProfileDialog = ({ open, onClose, me, onAvatarUpdated }) => {
  const fileInputRef = useRef(null);
  const [currentAvatar, setCurrentAvatar] = useState(me?.avatarUrl || '');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    setCurrentAvatar(me?.avatarUrl || me?.profilePictureURL || me?.profilePictureUrl || '');
  }, [me]);

  const handleOpenFilePicker = () => {
    if (!uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploadError('');

    if (!ALLOWED_IMAGE_TYPES.includes((file.type || '').toLowerCase())) {
      setUploadError('Only jpg, png, gif, webp are allowed.');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setUploadError('Image size must be 5MB or less.');
      return;
    }

    setUploading(true);
    try {
      const response = await api.updateMyAvatar(file);
      const newAvatarUrl = response?.newAvatarUrl || response?.avatarUrl || '';
      if (!newAvatarUrl) {
        throw new Error('Avatar updated but server did not return URL.');
      }

      setCurrentAvatar(newAvatarUrl);
      if (typeof onAvatarUpdated === 'function') {
        onAvatarUpdated(newAvatarUrl);
      }
    } catch (err) {
      setUploadError(err?.message || 'Failed to update avatar.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      title="Account profile"
      onClose={onClose}
      actions={<button className="dialog-btn primary" onClick={onClose}>Close</button>}
    >
      {me ? (
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, alignItems: 'center' }}>
          <div className="chat-avatar" style={{ width: 80, height: 80, fontSize: 28, overflow: 'hidden' }}>
            {currentAvatar ? (
              <img src={currentAvatar || undefined} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.removeAttribute('src'); }} />
            ) : (
              (me.fullName?.[0] || me.username?.[0] || 'M')
            )}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{me.fullName || me.username}</div>
            <div style={{ opacity: .8 }}>Username: {me.username}</div>
            {me.email ? <div style={{ opacity: .8 }}>Email: {me.email}</div> : null}
            {me.phone ? <div style={{ opacity: .8 }}>Phone: {me.phone}</div> : null}
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="dialog-btn"
                onClick={handleOpenFilePicker}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Change avatar'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>
            {uploadError ? <div style={{ marginTop: 8, color: '#d93025', fontSize: 13 }}>{uploadError}</div> : null}
          </div>
        </div>
      ) : (
        <div>Could not load account info.</div>
      )}
    </Dialog>
  );
};

export default ProfileDialog;
