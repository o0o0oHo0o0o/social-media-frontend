import React from 'react';

const ImagePreviewModal = ({ imagePreview, onClose }) => {
  if (!imagePreview) return null;
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img
          src={imagePreview}
          alt="Preview"
          style={{
            maxWidth: '90vw',
            maxHeight: '85vh',
            borderRadius: '12px',
            objectFit: 'contain',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
          }}
          onClick={e => e.stopPropagation()}
        />
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '-50px',
            right: '0',
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            fontSize: '24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
          onMouseLeave={e => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
          title="Close preview"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default ImagePreviewModal;
