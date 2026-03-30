import React, { useEffect, useRef } from 'react';

export default function VideoPlayer({ stream, isLocal = false, ...props }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      try { videoRef.current.srcObject = stream; } catch (e) { console.error(e); }
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isLocal}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: isLocal ? 'scaleX(-1)' : 'none',
        ...props.style
      }}
    />
  );
}
