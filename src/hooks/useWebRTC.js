import { useState, useRef, useCallback } from 'react';

// Cấu hình STUN Server (Google Free)
const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' }
  ]
};

export const CALL_STATUS = {
  IDLE: 'IDLE',
  CALLING: 'CALLING',
  INCOMING: 'INCOMING',
  CONNECTED: 'CONNECTED',
};

// SỬA: Tham số đầu tiên đổi tên thành clientSource để nhận Ref
export function useWebRTC(clientSource, me) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callStatus, setCallStatus] = useState(CALL_STATUS.IDLE);
  const [remoteUser, setRemoteUser] = useState(null);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  // Helper: Lấy instance socket thực sự từ Ref hoặc State
  const getSocket = useCallback(() => {
    // Nếu là Ref (có .current) -> trả về .current
    if (clientSource && Object.prototype.hasOwnProperty.call(clientSource, 'current')) {
      return clientSource.current;
    }
    // Nếu là object trực tiếp
    return clientSource;
  }, [clientSource]);

  // Gửi tín hiệu qua Socket (Phiên bản Super Debug)
  const sendSignal = useCallback((type, receiver, data = {}) => {
    const socket = getSocket();

    console.group(`🔍 [WebRTC Debug] Chuẩn bị gửi ${type}`);

    // 1. Kiểm tra Socket Instance
    if (!socket) {
      console.error('❌ Lỗi: Socket instance là null/undefined');
      console.groupEnd();
      return;
    }

    // 2. Kiểm tra trạng thái WebSocket (Cái này là sự thật trần trụi nhất)
    // 0: CONNECTING, 1: OPEN, 2: CLOSING, 3: CLOSED
    const wsState = socket.webSocket ? socket.webSocket.readyState : 'N/A';
    const stateMap = { 0: 'CONNECTING', 1: 'OPEN', 2: 'CLOSING', 3: 'CLOSED' };

    console.log('Socket Info:', {
      hasClient: true,
      stompActive: socket.active,
      stompConnected: socket.connected,
      webSocketState: stateMap[wsState] || wsState,
      wsUrl: socket.brokerURL || 'N/A'
    });

    // 3. Logic gửi
    const isAlive = socket.active || socket.connected;

    if (isAlive && wsState === 1) {
      const payload = { type, receiver, data };
      const body = JSON.stringify(payload);
      const destination = '/app/video-call';

      try {
        if (typeof socket.publish === 'function') {
          socket.publish({ destination, body });
          console.log(`✅ Đã gọi lệnh publish() thành công`);
        } else if (typeof socket.send === 'function') {
          socket.send(destination, {}, body);
          console.log(`✅ Đã gọi lệnh send() thành công`);
        } else {
          console.error('❌ Client không có hàm publish hoặc send');
        }
      } catch (e) {
        console.error('❌ Exception khi gửi:', e);
      }
    } else {
      console.error('❌ KHÔNG THỂ GỬI: Socket chưa sẵn sàng hoặc đã đóng.');
      console.error(`Chi tiết: Stomp Active=${isAlive}, WebSocket State=${stateMap[wsState]}`);
    }

    console.groupEnd();
  }, [getSocket]);

  // 1. Khởi tạo PeerConnection
  const createPeerConnection = useCallback((receiverUsername) => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const pc = new RTCPeerConnection(RTC_CONFIG);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal('ICE_CANDIDATE', receiverUsername, event.candidate);
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote stream');
      setRemoteStream(event.streams[0]);
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    peerConnectionRef.current = pc;
    return pc;
  }, [sendSignal]);

  // 2. Bắt đầu gọi
  const startCall = useCallback(async (receiverUsername) => {
    setCallStatus(CALL_STATUS.CALLING);
    setRemoteUser(receiverUsername);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      localStreamRef.current = stream;

      const pc = createPeerConnection(receiverUsername);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      sendSignal('OFFER', receiverUsername, { sdp: offer });
    } catch (err) {
      console.error('Start call error:', err);
      endCall();
    }
  }, [createPeerConnection, sendSignal]);

  // 3. Chấp nhận cuộc gọi
  const acceptCall = useCallback(async () => {
    if (!remoteUser) return;
    setCallStatus(CALL_STATUS.CONNECTED);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      localStreamRef.current = stream;

      const pc = peerConnectionRef.current;
      if (!pc) return;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      sendSignal('ANSWER', remoteUser, { sdp: answer });
    } catch (err) {
      console.error('Accept call error:', err);
      endCall();
    }
  }, [remoteUser, sendSignal]);

  // 4. Kết thúc/Từ chối
  const endCall = useCallback(() => {
    if (remoteUser && callStatus !== CALL_STATUS.IDLE) {
      sendSignal('HANGUP', remoteUser);
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      try { peerConnectionRef.current.close(); } catch (e) { }
    }
    peerConnectionRef.current = null;
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setRemoteUser(null);
    setCallStatus(CALL_STATUS.IDLE);
  }, [remoteUser, callStatus, sendSignal]);

  // 5. Xử lý tín hiệu đến
  const handleIncomingSignal = useCallback(async (msg) => {
    const { type, sender, data } = msg;

    if (type === 'OFFER' && callStatus === CALL_STATUS.IDLE) {
      setRemoteUser(sender);
      setCallStatus(CALL_STATUS.INCOMING);
      const pc = createPeerConnection(sender);
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      return;
    }

    if (sender !== remoteUser) return;
    const pc = peerConnectionRef.current;
    if (!pc) return;

    switch (type) {
      case 'ANSWER':
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        setCallStatus(CALL_STATUS.CONNECTED);
        break;
      case 'ICE_CANDIDATE':
        try { await pc.addIceCandidate(new RTCIceCandidate(data)); } catch (e) { }
        break;
      case 'HANGUP':
      case 'REJECT':
        endCall();
        break;
      default: break;
    }
  }, [callStatus, remoteUser, createPeerConnection, endCall]);

  return {
    localStream, remoteStream, callStatus, remoteUser,
    startCall, acceptCall, rejectCall: endCall, endCall, handleIncomingSignal
  };
}