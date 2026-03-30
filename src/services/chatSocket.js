import { Client } from "@stomp/stompjs";

let clientInstance = null;
let isConnected = false;
let currentHeaders = {};

// Hàng đợi callback để xử lý khi nhiều nơi cùng gọi connect() một lúc
let pendingOnConnect = [];
let pendingOnError = [];

export async function connectSocket(
  wsUrl,
  { onConnect, onError, connectHeaders } = {},
) {
  // 1. CƠ CHẾ SINGLETON: Nếu đã có client, dùng lại ngay!
  if (clientInstance) {
    if (isConnected) {
      // Nếu đang kết nối rồi -> gọi callback ngay
      if (onConnect) {
        try {
          onConnect();
        } catch (e) {
          console.error(e);
        }
      }
    } else {
      // Nếu có instance nhưng chưa connected (đang connecting/reconnecting) -> xếp hàng đợi
      if (onConnect) pendingOnConnect.push(onConnect);
      if (onError) pendingOnError.push(onError);
    }
    // Trả về instance đang tồn tại -> KHÔNG TẠO MỚI
    return clientInstance;
  }

  // 2. KHỞI TẠO MỚI (Chỉ chạy 1 lần duy nhất trong suốt vòng đời App)
  currentHeaders = connectHeaders || {};
  if (onConnect) pendingOnConnect.push(onConnect);
  if (onError) pendingOnError.push(onError);

  console.log("[SocketService] Creating NEW Stomp Client instance...");

  const client = new Client({
    brokerURL: wsUrl,
    reconnectDelay: 5000, // Tự động kết nối lại sau 5s nếu mất mạng
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    connectHeaders: currentHeaders,

    // Khi kết nối thành công
    onConnect: () => {
      console.log("✅ [SocketService] Connected");
      isConnected = true;
      while (pendingOnConnect.length > 0) {
        const cb = pendingOnConnect.shift();
        try {
          cb();
        } catch (e) {
          console.error(e);
        }
      }
    },

    // Khi lỗi STOMP (Lỗi giao thức) - log chi tiết frame để debug
    onStompError: (frame) => {
      try {
        console.error(
          "❌ [SocketService] Broker reported error:",
          frame.headers || {},
          frame.body || "",
        );
      } catch (e) {
        console.error("❌ [SocketService] onStompError parsing failed", e);
      }
      isConnected = false;
      while (pendingOnError.length > 0) {
        const cb = pendingOnError.shift();
        try {
          cb(frame);
        } catch (e) {}
      }
    },

    // Khi mất kết nối WebSocket (Rớt mạng, Server tắt)
    onWebSocketClose: () => {
      console.warn("⚠️ [SocketService] WebSocket Closed");
      isConnected = false;
    },

    // Khi WebSocket error
    onWebSocketError: (evt) => {
      try {
        console.error("❌ [SocketService] WebSocket error event:", evt);
      } catch (e) {}
    },

    // Debug log (bật để xem frames STOMP/WS)
    // debug: (msg) => { try { console.debug('[STOMP]', msg); } catch (e) { } },
  });

  // Lưu vào biến toàn cục
  clientInstance = client;
  client.activate();

  return client;
}

export function disconnectSocket() {
  if (clientInstance) {
    console.log("[SocketService] Deactivating client...");
    try {
      clientInstance.deactivate();
    } catch (e) {
      console.error(e);
    }
  }
  clientInstance = null;
  isConnected = false;
  pendingOnConnect = [];
  pendingOnError = [];
}

export function getClient() {
  return clientInstance;
}

export function subscribeConversation(conversationId, cb) {
  const client = clientInstance;
  // Kiểm tra chặt chẽ hơn: Phải có client và client phải đang active
  if (!client || !isConnected || !client.connected) {
    console.warn("[SocketService] Cannot subscribe - socket not ready");
    return null;
  }

  const dest = `/topic/chat.${conversationId}`;
  console.log(`[SocketService] Subscribing to ${dest}`);

  return client.subscribe(dest, (msg) => {
    try {
      const body = JSON.parse(msg.body);
      cb(body);
    } catch (e) {
      console.error("Parse error", e);
      cb({ raw: msg.body });
    }
  });
}

export function sendTyping(conversationId, isTyping, userId, username) {
  const client = clientInstance;
  if (!client || !isConnected) return; // Silent fail để đỡ spam log

  const body = JSON.stringify({
    conversationId: Number(conversationId),
    isTyping: !!isTyping,
    userId: userId,
    username: username,
    timestamp: new Date().toISOString(),
  });

  try {
    client.publish({ destination: "/app/chat.typing", body });
  } catch (e) {
    console.error("[SocketService] Send typing failed", e);
  }
}

