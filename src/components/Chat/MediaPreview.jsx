import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function MediaPreview({ open, media, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose && onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !media) return null;

  return createPortal(
    <div className="media-preview-backdrop" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
      <div className="media-preview" onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
        <button onClick={onClose} aria-label="Close" style={{ position: 'absolute', right: 8, top: 8, zIndex: 2, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer' }}>X</button>

        {media.type === 'IMAGE' && (
          <img src={media.url || media.fileUrl} alt={media.fileName || ''} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 6, boxShadow: '0 8px 30px rgba(0,0,0,0.6)' }} />
        )}

        {media.type === 'FILE' && (
          <div style={{ width: '80vw', height: '80vh', background: '#fff', borderRadius: 6, overflow: 'hidden' }}>
            <iframe title={media.fileName || 'file'} src={media.url || media.fileUrl} style={{ width: '100%', height: '100%', border: 0 }} />
          </div>
        )}

        {media.type === 'AUDIO' && (
          <audio controls style={{ width: '80vw' }} src={media.url || media.fileUrl} />
        )}
      </div>
    </div>,
    document.body
  );
}
