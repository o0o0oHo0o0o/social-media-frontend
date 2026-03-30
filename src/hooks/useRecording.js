import { useEffect, useRef, useState, useCallback } from 'react';

export function useRecording() {
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);

      return true;
    } catch (error) {
      console.error('[useRecording] Error accessing microphone:', error);
      throw error;
    }
  }, []);

  const stopRecording = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current) return resolve(null);
      try {
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
          const audioFile = new File([audioBlob], `audio_${Date.now()}.mp3`, { type: 'audio/mp3' });
          // stop tracks
          try { mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop()); } catch (e) { }
          mediaRecorderRef.current = null;
          audioChunksRef.current = [];
          if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
          setIsRecording(false);
          setRecordingTime(0);
          resolve(audioFile);
        };
        mediaRecorderRef.current.stop();
      } catch (e) {
        reject(e);
      }
    });
  }, []);

  const cancelRecording = useCallback(() => {
    if (!mediaRecorderRef.current) return;
    try {
      mediaRecorderRef.current.stop();
      try { mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop()); } catch (e) { }
    } catch (e) { /* noop */ }
    audioChunksRef.current = [];
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setRecordingTime(0);
  }, []);

  return {
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    cancelRecording
  };
}

export default useRecording;
