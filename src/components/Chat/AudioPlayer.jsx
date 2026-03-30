import React, { useRef, useEffect, useState } from 'react';

/**
 * AudioPlayer - Component hiển thị và phát audio
 * Có thanh sóng sinh động (20 vạch)
 */
const AudioPlayer = ({ audioUrl, fileSize, fileName, isMe }) => {
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const animationRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadedMetadata = () => setDuration(audio.duration);

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Draw 20 thin waveform bars
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const bars = 20;
    const barWidth = canvas.width / bars;

    const barColor = isMe ? 'rgba(255, 255, 255, 0.9)' : 'rgba(138, 180, 248, 0.95)';
    const barBgColor = isMe ? 'rgba(255, 255, 255, 0.2)' : 'rgba(138, 180, 248, 0.25)';
    const progressColor = isMe ? 'rgba(255, 255, 255, 1)' : 'rgba(138, 180, 248, 1)';

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const progress = duration > 0 ? currentTime / duration : 0;
      const progressX = progress * canvas.width;

      for (let i = 0; i < bars; i++) {
        const x = i * barWidth + 0.5;
        const barRight = x + barWidth;

        ctx.fillStyle = barBgColor;
        ctx.fillRect(x, 0, barWidth - 1, canvas.height);

        const heightMultiplier = isPlaying
          ? Math.abs(Math.sin((currentTime + i * 0.1) * 3)) * 0.5 + 0.3
          : 0.3;

        if (barRight <= progressX) {
          ctx.fillStyle = progressColor;
          ctx.globalAlpha = 1;
        } else {
          ctx.fillStyle = barColor;
          ctx.globalAlpha = isPlaying ? 0.85 : 0.7;
        }

        const barHeight = canvas.height * heightMultiplier;
        ctx.fillRect(x, (canvas.height - barHeight) / 2, barWidth - 1, barHeight);
      }

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, currentTime, duration, isMe]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const displayTime = formatTime(currentTime);

  const getDisplaySize = () => {
    if (!fileSize || typeof fileSize !== 'number' || fileSize <= 0) {
      return '';
    }
    if (fileSize >= 1024 * 1024) {
      return (fileSize / (1024 * 1024)).toFixed(1) + ' MB';
    }
    return (fileSize / 1024).toFixed(0) + ' KB';
  };

  return (
    <div style={{
      padding: '14px 18px',
      background: isMe ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)',
      borderRadius: '22px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      minWidth: '300px',
      maxWidth: '360px'
    }}>
      <audio ref={audioRef} src={audioUrl} style={{ display: 'none' }} title={fileName} />

      <button
        onClick={togglePlay}
        style={{
          background: isMe ? 'rgba(255,255,255,0.25)' : 'rgba(138, 180, 248, 0.45)',
          border: 'none',
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '18px',
          flexShrink: 0,
          transition: 'all 0.2s',
          color: isMe ? '#fff' : '#8ab4f8'
        }}
        onMouseEnter={(e) => e.target.style.background = isMe ? 'rgba(255,255,255,0.35)' : 'rgba(138, 180, 248, 0.6)'}
        onMouseLeave={(e) => e.target.style.background = isMe ? 'rgba(255,255,255,0.25)' : 'rgba(138, 180, 248, 0.45)'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <canvas
        ref={canvasRef}
        width={130}
        height={36}
        style={{
          flex: 1,
          background: isMe ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.25)',
          borderRadius: '10px',
          cursor: 'pointer'
        }}
        onClick={(e) => {
          const canvas = canvasRef.current;
          const rect = canvas.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const percent = x / canvas.width;
          if (audioRef.current && audioRef.current.duration) {
            audioRef.current.currentTime = percent * audioRef.current.duration;
          }
        }}
      />

      <span style={{
        fontSize: '12px',
        opacity: 0.8,
        whiteSpace: 'nowrap',
        minWidth: '32px',
        textAlign: 'right',
        fontWeight: '500',
        fontFamily: 'monospace'
      }}>
        {displayTime}
      </span>
    </div>
  );
};

export default AudioPlayer;
