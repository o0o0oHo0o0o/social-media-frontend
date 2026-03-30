import React from 'react';

/**
 * FileList - Hiển thị danh sách file từ đoạn chat
 */
const FileList = ({ files = [], loading, onLoadMore, hasMore }) => {
  const formatFileSize = (bytes) => {
    if (!bytes || bytes <= 0) return 'Unknown';
    if (bytes >= 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  const getFileIcon = (fileName) => {
    const ext = fileName?.split('.')?.pop()?.toLowerCase() || '';
    const iconMap = {
      'pdf': '📄',
      'doc': '📝',
      'docx': '📝',
      'xls': '📊',
      'xlsx': '📊',
      'zip': '🗜️',
      'rar': '🗜️',
      'txt': '📃',
      'ppt': '🎬',
      'pptx': '🎬'
    };
    return iconMap[ext] || '📎';
  };

  // Flatten: convert từ [{urls: [url1, url2], fileNames: [...], fileSizes: [...]}] thành [{url, fileName, fileSize}, ...]
  const flattenedFiles = files.flatMap(message =>
    (message.urls || []).map((url, idx) => ({
      url,
      fileName: message.fileNames?.[idx] || `file-${idx}`,
      fileSize: message.fileSizes?.[idx] || 0
    }))
  );

  const totalFiles = flattenedFiles.length;

  return (
    <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#fff', fontSize: '14px' }}>
        📁 File ({totalFiles})
      </h4>
      {flattenedFiles.length === 0 ? (
        <div style={{ color: '#aaa', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
          Không có file
        </div>
      ) : (
        <>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '300px',
            overflowY: 'auto',
            marginBottom: '8px'
          }}>
            {flattenedFiles.map((file, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onClick={() => window.open(file.url, '_blank')}
                title={`Tải: ${file.fileName}`}
              >
                <span style={{ fontSize: '18px' }}>
                  {getFileIcon(file.fileName)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 500,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {file.fileName}
                  </div>
                  <div style={{
                    color: '#aaa',
                    fontSize: '11px',
                    marginTop: '2px'
                  }}>
                    {formatFileSize(file.fileSize)}
                  </div>
                </div>
                <span style={{
                  color: '#667eea',
                  fontSize: '18px'
                }}>
                  ↓
                </span>
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

export default FileList;
