import React, { useEffect, useRef, useState } from 'react';
import { CALL_STATUS } from '../../hooks/useWebRTC';
import './videoCall.css';

// Component hiển thị Video
const VideoPlayer = ({ stream, isLocal = false, style }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isLocal} // Luôn mute local để tránh vọng tiếng
      style={{
        transform: isLocal ? 'scaleX(-1)' : 'none', // Lật gương camera mình
        ...style
      }}
    />
  );
};

// Component chính
export default function VideoCallUI({
  callStatus,
  localStream,
  remoteStream,
  remoteUser,
  remoteAvatar, // Thêm prop này để hiện Avatar đẹp hơn
  onAccept,
  onReject,
  onEndCall,
  isVideoCall = true // Mặc định là video, nếu false thì là Audio Call
}) {
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const audioCtxRef = useRef(null);
  const oscRef = useRef(null);
  const gainRef = useRef(null);

  // Timer đếm giờ cuộc gọi
  useEffect(() => {
    let interval;
    if (callStatus === CALL_STATUS.CONNECTED) {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  // Rung chuông khi có cuộc gọi đến
  useEffect(() => {
    let pulseInterval = null;
    const startRingtone = async () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        audioCtxRef.current = new AudioCtx();
        // Try to resume if suspended (autoplay policy)
        if (audioCtxRef.current.state === 'suspended') {
          try { await audioCtxRef.current.resume(); } catch (e) { console.warn('AudioContext resume failed', e); }
        }

        gainRef.current = audioCtxRef.current.createGain();
        gainRef.current.gain.value = 0;
        gainRef.current.connect(audioCtxRef.current.destination);

        oscRef.current = audioCtxRef.current.createOscillator();
        oscRef.current.type = 'sine';
        oscRef.current.frequency.value = 620; // tone
        oscRef.current.connect(gainRef.current);
        oscRef.current.start();

        // Pulse the gain to create a ringtone-like pattern
        let on = false;
        pulseInterval = setInterval(() => {
          on = !on;
          gainRef.current.gain.setTargetAtTime(on ? 0.18 : 0, audioCtxRef.current.currentTime, 0.02);
        }, 600);
      } catch (e) {
        console.warn('Cannot play ringtone (autoplay?):', e);
      }
    };

    const stopRingtone = () => {
      try {
        if (pulseInterval) { clearInterval(pulseInterval); pulseInterval = null; }
        if (oscRef.current) {
          try { oscRef.current.stop(); } catch (e) { }
          try { oscRef.current.disconnect(); } catch (e) { }
          oscRef.current = null;
        }
        if (gainRef.current) { try { gainRef.current.disconnect(); } catch (e) { } gainRef.current = null; }
        if (audioCtxRef.current) {
          try { audioCtxRef.current.close(); } catch (e) { }
          audioCtxRef.current = null;
        }
      } catch (e) { console.warn('Error stopping ringtone', e); }
    };

    if (callStatus === CALL_STATUS.INCOMING) {
      startRingtone();
    } else {
      stopRingtone();
    }

    return () => {
      stopRingtone();
    };
  }, [callStatus]);

  // Format thời gian 00:00
  const formatTime = (s) => {
    const min = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  if (callStatus === CALL_STATUS.IDLE) return null;

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => t.enabled = muted); // Đảo ngược logic
      setMuted(!muted);
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => t.enabled = cameraOff);
      setCameraOff(!cameraOff);
    }
  };

  return (
    <div className="video-call-overlay">

      {/* --- MÀN HÌNH NHẬN CUỘC GỌI --- */}
      {callStatus === CALL_STATUS.INCOMING && (
        <div className="incoming-call-card">
          <div className="incoming-avatar">
            {remoteAvatar ? <img src={remoteAvatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : (remoteUser?.charAt(0) || 'U')}
          </div>
          <div className="incoming-info">
            <h3>{remoteUser}</h3>
            <p>Đang gọi {isVideoCall ? 'Video' : 'Thoại'}...</p>
          </div>
          <div className="call-actions">
            <button className="action-btn btn-decline" onClick={onReject}>
              <div className="btn-circle">
                <svg viewBox="0 0 24 24"><path d="M12 2c5.5 0 10 4.5 10 10s-4.5 10-10 10S2 17.5 2 12 17.5 2 12 2zm0 2c-1.9 0-3.6.6-4.9 1.7l11.2 11.2c1-1.4 1.7-3.1 1.7-4.9 0-4.4-3.6-8-8-8zm-6.6 3.1l11.2 11.2c-1.4 1-3.1 1.7-4.9 1.7-4.4 0-8-3.6-8-8 0-1.8.6-3.5 1.7-4.9z" fill="currentColor" /></svg>
              </div>
              <span>Từ chối</span>
            </button>
            <button className="action-btn btn-accept" onClick={onAccept}>
              <div className="btn-circle">
                <svg viewBox="0 0 24 24"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.07 21 3 13.93 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.25 1.01l-2.2 2.21z" fill="currentColor" /></svg>
              </div>
              <span>Nghe máy</span>
            </button>
          </div>
        </div>
      )}

      {/* --- MÀN HÌNH ĐANG GỌI --- */}
      {(callStatus === CALL_STATUS.CALLING || callStatus === CALL_STATUS.CONNECTED) && (
        <div className="video-grid">

          {/* 1. REMOTE VIEW (FULL SCREEN) */}
          <div className="remote-video-container">
            {isVideoCall && remoteStream ? (
              <VideoPlayer stream={remoteStream} />
            ) : (
              // Giao diện Audio Call (hoặc khi đang kết nối)
              <div className="audio-only-placeholder">
                <div className="pulsing-avatar">
                  {remoteAvatar ? <img src={remoteAvatar} alt="" /> : <span style={{ fontSize: 40, color: 'white' }}>{remoteUser?.charAt(0)}</span>}
                </div>
                <div className="remote-name">{remoteUser}</div>
                <div className="call-timer">
                  {callStatus === CALL_STATUS.CONNECTED ? formatTime(duration) : 'Đang kết nối...'}
                </div>
                {/* Audio Element ẩn để phát tiếng */}
                {remoteStream && <VideoPlayer stream={remoteStream} style={{ display: 'none' }} />}
              </div>
            )}
          </div>

          {/* 2. LOCAL VIEW (PIP) - Chỉ hiện khi là Video Call */}
          {isVideoCall && (
            <div className="local-video-container">
              {localStream && !cameraOff ? (
                <VideoPlayer stream={localStream} isLocal={true} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777' }}>
                  Camera Off
                </div>
              )}
            </div>
          )}

          {/* 3. CONTROLS BAR */}
          <div className="call-controls-bar">
            {/* Nút Mic */}
            <button className={`control-btn ${muted ? 'active' : ''}`} onClick={toggleMute} title="Bật/Tắt Mic">
              {muted ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
              )}
            </button>

            {/* Nút Camera (Chỉ hiện nếu là Video Call) */}
            {isVideoCall && (
              <button className={`control-btn ${cameraOff ? 'active' : ''}`} onClick={toggleCamera} title="Bật/Tắt Camera">
                {cameraOff ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1l22 22" /><path d="M21 21l-2-2m-3.28-3.28A6 6 0 0 1 13 16H7a6 6 0 0 1-6-6 6 6 0 0 1 1.63-3.89" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                )}
              </button>
            )}

            {/* Nút Kết thúc */}
            <button className="control-btn end-call" onClick={onEndCall} title="Kết thúc">
              <svg viewBox="0 0 24 24" fill="white" stroke="white" strokeLinecap="round" strokeLinejoin="round" style={{ fill: 'white', stroke: 'none' }}><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.07 21 3 13.93 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.24.2 2.45.57 3.57a1 1 0 0 1-.25 1.01l-2.2 2.21z" transform="rotate(135 12 12)" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}