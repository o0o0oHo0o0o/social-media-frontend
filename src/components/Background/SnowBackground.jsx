import React, { useEffect, useRef } from 'react';
import '../../styles/chat.css';

export default function SnowBackground({ enabled = true }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const flakesRef = useRef([]);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let particleCount = 120; // moderate density

    const DPR = Math.max(1, window.devicePixelRatio || 1);

    function resize() {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.floor(width * DPR);
      canvas.height = Math.floor(height * DPR);
      ctx.scale(DPR, DPR);
      // adapt particle count to size
      particleCount = Math.max(60, Math.floor((width * height) / 15000));
      initFlakes();
    }

    function initFlakes() {
      flakesRef.current = [];
      for (let i = 0; i < particleCount; i++) {
        flakesRef.current.push(createFlake(true));
      }
    }

    function createFlake(randomY = false) {
      const x = Math.random() * width;
      const y = randomY ? Math.random() * height : -10 - Math.random() * 50;
      const size = 1 + Math.random() * 3.5;
      const speed = 0.3 + Math.random() * 1.2;
      const drift = (Math.random() - 0.5) * 0.6;
      const opacity = 0.4 + Math.random() * 0.6;
      return { x, y, size, speed, drift, opacity };
    }

    function step() {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      const flakes = flakesRef.current;
      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        f.y += f.speed;
        f.x += f.drift;
        // slight random sway
        f.drift += (Math.random() - 0.5) * 0.02;
        if (f.y > height + 10 || f.x < -20 || f.x > width + 20) {
          flakes[i] = createFlake(false);
          continue;
        }

        ctx.globalAlpha = f.opacity * 0.9;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(step);
    }

    const handleResize = () => {
      resize();
    };

    // Respect reduced motion
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq && mq.matches) {
      // Do not animate
      canvas.style.display = 'none';
      return () => { };
    }

    resize();
    rafRef.current = requestAnimationFrame(step);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled]);

  return (
    <canvas
      ref={canvasRef}
      className="snow-canvas"
      aria-hidden
    />
  );
}
