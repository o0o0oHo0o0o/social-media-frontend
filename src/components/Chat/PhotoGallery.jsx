import React from 'react';

/**
 * PhotoGallery - Hiển thị gallery ảnh từ đoạn chat
 */
const PhotoGallery = ({ photos = [], loading, onLoadMore, hasMore }) => {
  // Flatten: convert từ [{urls: [url1, url2], fileNames: [...]}] thành [{url, fileName}, ...]
  const flattenedPhotos = photos.flatMap(message =>
    (message.urls || []).map((url, idx) => ({
      url,
      fileName: message.fileNames?.[idx] || `photo-${idx}`
    }))
  );

  const totalPhotos = flattenedPhotos.length;

  return (
    <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#fff', fontSize: '14px' }}>
        🖼️ Ảnh ({totalPhotos})
      </h4>
      {flattenedPhotos.length === 0 ? (
        <div style={{ color: '#aaa', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
          Không có ảnh
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            maxHeight: '300px',
            overflowY: 'auto',
            marginBottom: '8px'
          }}>
            {flattenedPhotos.map((photo, idx) => (
              <div
                key={idx}
                style={{
                  borderRadius: '8px',
                  overflow: 'hidden',
                  aspectRatio: '1',
                  background: '#222',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onClick={() => window.open(photo.url, '_blank')}
                title={photo.fileName}
              >
                <img
                  src={photo.url}
                  alt={photo.fileName}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              </div>
            ))}
          </div>
          {hasMore && (
            <button
              onClick={onLoadMore}
              disabled={loading}
              style={{
                width: '100%',
                padding: '8px',
                background: '#667eea',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Đang tải...' : 'Xem thêm'}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default PhotoGallery;
