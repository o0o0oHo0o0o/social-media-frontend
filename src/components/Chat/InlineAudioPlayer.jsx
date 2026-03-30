import React, { useEffect, useRef, useState } from 'react';

export default function InlineAudioPlayer({ src }) {
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const sourceRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    if (!audio || !canvas) return;

    const ctx = canvas.getContext('2d');
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    const initAudioContext = () => {
      if (audioCtxRef.current) return;

      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();

        const analyser = audioCtx.createAnalyser();
        // THAY ĐỔI 1: Tăng độ phân giải mẫu để có nhiều vạch hơn
        // 64 -> 32 vạch, 128 -> 64 vạch, 256 -> 128 vạch
        analyser.fftSize = 128;

        const source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        audioCtxRef.current = audioCtx;
        analyserRef.current = analyser;
        sourceRef.current = source;
      } catch (e) {
        console.error("Audio Context Error:", e);
      }
    };

    const draw = () => {
      if (!analyserRef.current) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // Tính toán chiều rộng cột dựa trên số lượng cột
      // Gap là khoảng cách giữa các cột
      const gap = 2;
      const barTotalWidth = (WIDTH / bufferLength);
      const barWidth = barTotalWidth - gap;

      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        // Tính chiều cao tương đối (0-255 đổi sang chiều cao canvas)
        // Nhân thêm 0.8 để sóng không bị kịch trần quá nhiều
        let barHeight = (dataArray[i] / 255) * HEIGHT * 0.9;

        // Đảm bảo có chiều cao tối thiểu để nhìn thấy vạch khi im lặng
        if (barHeight < 2) barHeight = 2;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';

        // Căn giữa theo chiều dọc
        const y = (HEIGHT - barHeight) / 2;

        ctx.beginPath();
        // Vẽ bo góc tròn hơn (radius = barWidth / 2)
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, 50);
        } else {
          ctx.fillRect(x, y, barWidth, barHeight); // Fallback cho browser cũ
        }
        ctx.fill();

        x += barTotalWidth;
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    const onPlay = async () => {
      setIsPlaying(true);
      initAudioContext();
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }
      draw();
    };

    const onPause = () => {
      setIsPlaying(false);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onPause);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onPause);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [src]);

  return (
    <div className="inline-audio-player" style={{ display: 'inline-block' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16, // Tăng khoảng cách giữa nút Play và sóng
        // THAY ĐỔI 2: Tăng Padding
        padding: '12px 20px',
        background: 'var(--bubble-blue)',
        borderRadius: 24, // Bo tròn nhiều hơn cho hợp với padding lớn
        color: '#fff',
        // Tăng chiều rộng tổng thể để chứa sóng dài hơn
        minWidth: 320,
        height: 56
      }}>

        <div
          onClick={(e) => {
            e.stopPropagation();
            const audio = audioRef.current;
            if (audio.paused) audio.play();
            else audio.pause();
          }}
          style={{
            cursor: 'pointer',
            width: 36, // To hơn chút
            height: 36,
            background: 'rgba(255,255,255,0.25)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
        >
          {isPlaying ? (
            <span style={{ fontSize: 14, fontWeight: 'bold' }}>⏸</span>
          ) : (
            <span style={{ fontSize: 14, marginLeft: 3, fontWeight: 'bold' }}>▶</span>
          )}
        </div>

        {/* THAY ĐỔI 3: Tăng kích thước Canvas */}
        <canvas
          ref={canvasRef}
          width={240} // Rộng hơn để chứa nhiều vạch
          height={40}
          style={{ width: 240, height: 40, display: 'block' }}
        />

        <audio
          ref={audioRef}
          src={src}
          crossOrigin="anonymous"
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}