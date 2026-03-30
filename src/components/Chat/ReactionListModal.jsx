import React from 'react';
import { createPortal } from 'react-dom';

export default function ReactionListModal({ open, onClose, messageId, users }) {
  if (!open) return null;

  return createPortal(
    <div className="reaction-modal-backdrop" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 12000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="reaction-modal" onClick={(e) => e.stopPropagation()} style={{ width: 360, maxHeight: '70vh', overflow: 'auto', background: '#0f1720', borderRadius: 12, padding: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.6)', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontWeight: 700 }}>Reactions</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>✕</button>
        </div>
        {/* messageId intentionally hidden from UI */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(!users || users.length === 0) ? (
            <div style={{ color: 'rgba(255,255,255,0.6)' }}>No reactions</div>
          ) : users.map((u, idx) => (
            <div key={u.userId || idx} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <img src={u.avatarUrl || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'} alt={u.username || u.fullName || ''} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_400x400.png'; }} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.06)' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: 600 }}>{u.fullName || u.username || `User ${u.userId || ''}`}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{u.username || ''}</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 18 }}>{u.reactionType === 'LOVE' ? '❤️' : (u.reactionType === 'HAHA' ? '😆' : (u.reactionType === 'SAD' ? '😢' : (u.reactionType === 'ANGRY' ? '😡' : '👍')))}</div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
