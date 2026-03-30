import React, { useRef, useEffect, useState } from 'react';
import './ChatComposer.css';
import { getMediaLabel } from '../../utils/format';

// Component Sóng âm (Visualizer)
const AudioVisualizer = () => {
  return (
    <div className="audio-wave">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="wave-bar"></div>
      ))}
    </div>
  );
};

export default function ChatComposer({
  content,
  onContentChange,
  onTextareaKeyDown,
  onPickFiles,
  sendMessage,
  isRecording,
  recordingTime,
  startRecording,
  stopRecording,
  cancelRecording,
  files = [],
  removeFile,
  replyMessage,
  onCancelReply,
}) {
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const [previews, setPreviews] = useState([]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  // Prepare preview URLs for image files and clean up when files change
  useEffect(() => {
    // revoke previous
    previews.forEach(u => { if (u) URL.revokeObjectURL(u); });
    const urls = (files || []).map(f => (f && f.type && f.type.startsWith('image/')) ? URL.createObjectURL(f) : null);
    setPreviews(urls);
    return () => {
      urls.forEach(u => { if (u) URL.revokeObjectURL(u); });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const handleAttachClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handlePickFiles = (e) => {
    if (typeof onPickFiles === 'function') onPickFiles(e);
  };

  const handleSendRecording = () => {
    if (typeof stopRecording === 'function') stopRecording();
  };

  const handleCancelRecording = () => {
    if (typeof cancelRecording === 'function') cancelRecording();
  };

  // Logic kiểm tra có nội dung để gửi hay không
  const hasContent = (content && content.trim() !== '') || (files && files.length > 0);

  const renderPreviews = () => {
    if (!files || files.length === 0) return null;
    return (
      <div className="preview-list">
        {files.map((file, index) => {
          const isImage = file && file.type && file.type.startsWith('image/');
          const previewUrl = previews[index] || null;
          return (
            <div key={index} className="preview-item">
              {isImage && previewUrl ? (
                <img src={previewUrl} alt="preview" className="preview-img" />
              ) : (
                <div className="preview-file-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="#c8ccd1"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>
                </div>
              )}
              <button className="remove-file-btn" type="button" onClick={() => { if (typeof removeFile === 'function') removeFile(index); }}>
                ✕
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  const renderReplyPreview = () => {
    if (!replyMessage) return null;
    const sender = replyMessage.sender?.nickname || replyMessage.sender?.fullName || replyMessage.sender?.username || 'Bạn';

    let text = replyMessage.content && replyMessage.content.trim().length > 0 ? replyMessage.content : '';
    if (!text) {
      if (replyMessage.media && replyMessage.media.length > 0) {
        const firstFile = replyMessage.media[0] || {};
        const type = firstFile.type || firstFile.mediaType || replyMessage.mediaType || 'FILE';
        text = getMediaLabel(type);
      } else {
        text = '[Tin nhắn]';
      }
    }

    return (
      <div className="reply-preview-bar">
        <div className="reply-left">Trả lời <strong>{sender}</strong></div>
        <div className="reply-center">{text}</div>
        <button className="reply-cancel" onClick={() => onCancelReply && onCancelReply()} title="Hủy trả lời">✕</button>
      </div>
    );
  };

  // --- TRẠNG THÁI GHI ÂM (Hiển thị thanh ghi âm đè lên input) ---
  if (isRecording) {
    return (
      <div className="chat-composer recording-mode">
        <div className="recording-container">
          <button
            type="button"
            className="composer-btn cancel-record-btn"
            onClick={handleCancelRecording}
            title="Hủy"
          >
            <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
          </button>

          <span className="recording-timer">{recordingTime || '0:00'}</span>
          <AudioVisualizer />

          <button
            type="button"
            className="composer-btn send-record-btn"
            onClick={handleSendRecording}
            title="Gửi ghi âm"
          >
            <svg viewBox="0 0 24 24" style={{ marginLeft: 2 }}><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
          </button>
        </div>
      </div>
    );
  }

  // --- TRẠNG THÁI BÌNH THƯỜNG ---
  return (
    <div className="chat-composer">
      {/* 1. Nút Đính kèm */}
      <button type="button" className="composer-btn" onClick={handleAttachClick} title="Đính kèm">
        <svg viewBox="0 0 24 24"><path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 0 1 5 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5a2.5 2.5 0 0 0 5 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" /></svg>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={handlePickFiles}
        style={{ display: 'none' }}
      />

      {/* 2. Nút Micro (Chuyển sang bên trái) */}
      <button
        type="button"
        className="composer-btn voice-btn"
        onClick={startRecording}
        title="Ghi âm"
      >
        <svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" /><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" /></svg>
      </button>

      {/* 3. Ô Nhập liệu */}
      <div className="input-wrapper">
        {renderReplyPreview()}
        {renderPreviews()}
        <textarea
          ref={textareaRef}
          className="composer-textarea"
          value={content}
          onChange={onContentChange}
          onKeyDown={onTextareaKeyDown}
          placeholder="Nhập tin nhắn..."
          rows={1}
        />
      </div>

      {/* 4. Nút Gửi (Luôn nằm bên phải) */}
      <button
        type="button"
        className="composer-btn send-text"
        onClick={sendMessage}
        disabled={!hasContent} // Chỉ disable khi không có nội dung
        title="Gửi"
      >
        <svg viewBox="0 0 24 24" style={{ marginLeft: 3 }}><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
      </button>
    </div>
  );
}