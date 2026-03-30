import React, { memo, useRef } from 'react';

/**
 * ChatInput - Memoized component for chat input area
 * Extracted from Messenger.jsx to prevent message list re-render when typing
 */
const ChatInput = memo(function ChatInput({
  content,
  files,
  isRecording,
  recordingTime,
  onContentChange,
  onKeyDown,
  onPickFiles,
  onSend,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  onRemoveFile,
  onImagePreview
}) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <footer className="chat-composer">
      {/* File Preview */}
      {files?.length > 0 && (
        <div style={{ padding: '12px', borderBottom: '1px solid #333', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {files.map((f, idx) => {
            const isImage = f.type.startsWith('image');
            const isAudio = f.type.startsWith('audio');
            const objUrl = URL.createObjectURL(f);
            return (
              <div key={idx} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ borderRadius: '8px', overflow: 'hidden', border: '2px solid #667eea', background: '#1a1a2e', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', fontSize: '12px' }}>
                  {isImage ? (
                    <>
                      <img src={objUrl} alt={f.name} style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => onImagePreview(objUrl)}
                        title="Click to preview" />
                      <div style={{ flex: 1, maxWidth: '150px' }}>
                        <div style={{ wordBreak: 'break-word', color: '#fff', fontSize: '11px' }}>{f.name}</div>
                        <div style={{ opacity: 0.7, fontSize: '10px', marginTop: '2px' }}>{(f.size / 1024).toFixed(2)} KB</div>
                      </div>
                    </>
                  ) : isAudio ? (
                    <>
                      <span style={{ fontSize: '24px' }}>🎙️</span>
                      <div style={{ flex: 1, maxWidth: '150px' }}>
                        <div style={{ wordBreak: 'break-word', color: '#fff', fontSize: '11px' }}>{f.name}</div>
                        <div style={{ opacity: 0.7, fontSize: '10px', marginTop: '2px' }}>{(f.size / 1024).toFixed(2)} KB</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '24px' }}>📎</span>
                      <div style={{ flex: 1, maxWidth: '150px' }}>
                        <div style={{ wordBreak: 'break-word', color: '#fff', fontSize: '11px' }}>{f.name}</div>
                        <div style={{ opacity: 0.7, fontSize: '10px', marginTop: '2px' }}>{(f.size / 1024).toFixed(2)} KB</div>
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={() => onRemoveFile(idx)}
                  style={{ marginTop: '6px', background: '#ff4444', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', opacity: 0.9, transition: 'opacity 0.2s' }}
                  onMouseEnter={e => e.target.style.opacity = '1'}
                  onMouseLeave={e => e.target.style.opacity = '0.9'}
                  title="Remove file"
                >
                  ✕ Remove
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Recording UI */}
      {isRecording ? (
        <div style={{ padding: '12px', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(220, 20, 60, 0.1)', borderRadius: '8px', margin: '0 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            <span style={{ fontSize: '20px', animation: 'pulse 1s infinite' }}>🔴</span>
            <span style={{ color: '#ff4444', fontWeight: 'bold', fontSize: '14px' }}>Recording {formatTime(recordingTime)}</span>
          </div>
          <button
            onClick={onStopRecording}
            style={{ background: '#667eea', color: 'white', border: 'none', borderRadius: '20px', padding: '8px 16px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
            title="Stop recording"
          >
            ✓ Done
          </button>
          <button
            onClick={onCancelRecording}
            style={{ background: '#ff4444', color: 'white', border: 'none', borderRadius: '20px', padding: '8px 16px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
            title="Cancel recording"
          >
            ✕ Cancel
          </button>
        </div>
      ) : (
        <>
          {/* Input Area */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '12px' }}>
            {/* Emoji/Sticker (placeholder) */}
            <button
              onClick={() => { }}
              style={{ background: 'transparent', border: 'none', color: '#667eea', fontSize: '20px', cursor: 'pointer', padding: '8px' }}
              title="Emoji & sticker (coming soon)"
            >
              😊
            </button>

            {/* Textarea */}
            <textarea
              className="chat-textarea"
              placeholder="Nhập tin nhắn..."
              value={content}
              onChange={onContentChange}
              onKeyDown={onKeyDown}
              style={{ minHeight: '40px', maxHeight: '120px' }}
            />

            {/* File Upload */}
            <label style={{ position: 'relative', cursor: 'pointer' }}>
              <input
                id="chat-files"
                type="file"
                multiple
                onChange={onPickFiles}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                style={{ display: 'none' }}
              />
              <button
                as="div"
                onClick={e => document.getElementById('chat-files').click()}
                style={{ background: 'transparent', border: 'none', color: '#667eea', fontSize: '20px', cursor: 'pointer', padding: '8px' }}
                title="Attach file/photo"
              >
                📎
              </button>
            </label>

            {/* Voice Recording */}
            <button
              onClick={onStartRecording}
              style={{ background: 'transparent', border: 'none', color: '#667eea', fontSize: '20px', cursor: 'pointer', padding: '8px' }}
              title="Record audio message"
            >
              🎙️
            </button>

            {/* Send Button */}
            {(content.trim() || files.length > 0) && (
              <button
                onClick={onSend}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={e => e.target.style.opacity = '0.8'}
                onMouseLeave={e => e.target.style.opacity = '1'}
                title="Send message"
              >
                Send
              </button>
            )}
          </div>
        </>
      )}
    </footer>
  );
});

export default ChatInput;
