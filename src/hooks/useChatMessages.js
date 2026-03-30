import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';
import { getClient, subscribeConversation } from '../services/chatSocket';

// Accept wsBase (e.g. API base URL) as prop
export function useChatMessages({ activeConv, me, wsBase, onMessage, onReaction, onReadReceipt, onAvatarUpdate, onPresence }) {
  const [msgLoading, setMsgLoading] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [connected, setConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const subRef = useRef(null);
  const typingTimers = useRef({});
  const onMessageRef = useRef(onMessage);
  const onReactionRef = useRef(onReaction);
  const onReadReceiptRef = useRef(onReadReceipt);
  const onAvatarUpdateRef = useRef(onAvatarUpdate);
  const onPresenceRef = useRef(onPresence);

  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onReactionRef.current = onReaction; }, [onReaction]);
  useEffect(() => { onReadReceiptRef.current = onReadReceipt; }, [onReadReceipt]);
  useEffect(() => { onAvatarUpdateRef.current = onAvatarUpdate; }, [onAvatarUpdate]);
  useEffect(() => { onPresenceRef.current = onPresence; }, [onPresence]);

  const wsUrl = useMemo(() => {
    const normalize = (base) => {
      if (!base) return null;
      const trimmed = base.trim().replace(/\/+$/, '');
      if (!trimmed) return null;
      const isSecure = trimmed.startsWith('https://') || trimmed.startsWith('wss://');
      const scheme = isSecure ? 'wss://' : 'ws://';
      const rest = trimmed.replace(/^(https?:\/\/|ws:\/\/|wss:\/\/)/, '');
      return `${scheme}${rest}/ws`;
    };

    const configuredUrl = normalize(wsBase);
    if (configuredUrl) return configuredUrl;
    if (typeof window === 'undefined') return null;
    return normalize(window.location.origin);
  }, [wsBase]);



  useEffect(() => {
    // Do NOT create a new client here. Use the client created by App (via connectSocket).
    // Poll for the existing client to become available/connected and update state.
    let mounted = true;
    let interval = null;

    const checkClient = () => {
      const client = getClient();
      if (!mounted) return;
      if (client && (client.connected || client.active)) {
        setConnected(true);
        console.info('[useChatMessages] Detected existing WebSocket client connected');
        if (interval) { clearInterval(interval); interval = null; }
      } else {
        setConnected(false);
      }
    };

    // Only start polling if we have a wsUrl (config available)
    if (wsUrl) {
      checkClient();
      interval = setInterval(checkClient, 300);
    }

    return () => { mounted = false; setConnected(false); if (interval) clearInterval(interval); };
  }, [wsUrl]);

  useEffect(() => {
    if (!connected || !activeConv) return;
    if (subRef.current) {
      try { subRef.current.unsubscribe(); } catch (e) { /* noop */ }
      subRef.current = null;
    }

    let retryCount = 0;
    const maxRetries = 5;
    const trySubscribe = () => {
      try {
        const result = subscribeConversation(activeConv.conversationId, (evt) => {
          console.info('[useChatMessages] Received socket event', evt?.type || evt?.payload?.type || 'unknown');
          const type = evt?.type;
          if (type === 'AVATAR_UPDATE') {
            try {
              const handler = onAvatarUpdateRef.current;
              if (typeof handler === 'function') handler(evt.payload || evt);
            } catch (e) { console.error('[useChatMessages] onAvatarUpdate handler failed', e); }
            return;
          }
          if (type === 'READ_RECEIPT') {
            try {
              const handler = onReadReceiptRef.current;
              if (typeof handler === 'function') handler(evt.payload || evt);
            } catch (e) { console.error('[useChatMessages] onReadReceipt failed', e); }
            return;
          }
          if (type === 'PRESENCE_UPDATE') {
            try {
              const handler = onPresenceRef.current;
              if (typeof handler === 'function') handler(evt.payload || evt);
            } catch (e) { console.error('[useChatMessages] onPresence failed', e); }
            return;
          }
          if (type === 'TYPING') {
            const isTyping = Boolean(evt?.payload?.isTyping);
            const username = evt?.payload?.username;
            const evtUserId = evt?.payload?.userId;
            const isFromMe = me && ((evtUserId && evtUserId === me.id) || (username && username === me.username));
            if (isFromMe) return;
            const userKey = evtUserId || username;
            if (isTyping && username && userKey) {
              setTypingUsers(prev => {
                const exists = prev.some(u => (u.userId || u.username) === userKey);
                if (exists) return prev;
                return [...prev, { username, userId: evtUserId }];
              });
              if (typingTimers.current[userKey]) clearTimeout(typingTimers.current[userKey]);
              typingTimers.current[userKey] = setTimeout(() => {
                setTypingUsers(prev => prev.filter(u => (u.userId || u.username) !== userKey));
                delete typingTimers.current[userKey];
              }, 5000);
            } else if (userKey) {
              setTypingUsers(prev => prev.filter(u => (u.userId || u.username) !== userKey));
              if (typingTimers.current[userKey]) { clearTimeout(typingTimers.current[userKey]); delete typingTimers.current[userKey]; }
            }
            return;
          }

          if (type === 'NICKNAME_UPDATE') {
            return;
          }

          // Reaction updates are not message objects; notify parent via onReaction
          if (type === 'REACTION_UPDATE') {
            try {
              const handler = onReactionRef.current;
              if (typeof handler === 'function') handler(evt.payload || evt);
            } catch (e) { console.error('[useChatMessages] onReaction handler failed', e); }
            return;
          }

          if (type === 'NAME_UPDATE' || type === 'CONVERSATION_UPDATE') {
            return;
          }

          try {
            const msgId = evt?.payload?.messageId || evt?.messageId;
            const senderId = evt?.payload?.sender?.userId || evt?.sender?.userId;
            const messageType = evt?.payload?.messageType || evt?.messageType;
            const isNotificationMsg = messageType === 'NOTIFICATION';
            // Do NOT skip messages from ourselves — server will echo NEW_MESSAGE events
            // Removing the early return ensures sent messages appear in UI without reload.

            let newMessage;
            if (evt?.payload) {
              newMessage = {
                ...evt,
                payload: {
                  ...evt.payload,
                  isRead: evt.payload?.isRead ?? false,
                  isDelivered: evt.payload?.isDelivered ?? false,
                  status: undefined
                }
              };
            } else {
              newMessage = { payload: { ...evt, isRead: evt.isRead ?? false, isDelivered: evt.isDelivered ?? false, status: undefined }, type: 'MESSAGE' };
            }

            const handler = onMessageRef.current;
            if (typeof handler === 'function') {
              try { handler(newMessage); } catch (e) { console.error('[useChatMessages] onMessage callback failed', e); }
            }
          } catch (e) { console.error('[useChatMessages] Error processing evt', e); }
        });

        if (result) {
          subRef.current = result;
          console.info(`[useChatMessages] Subscribed to /topic/chat.${activeConv.conversationId}`);
        }
        else if (retryCount < maxRetries) { retryCount++; setTimeout(trySubscribe, 200); }
      } catch (e) {
        console.error('[useChatMessages] Subscribe failed', e);
        if (retryCount < maxRetries) { retryCount++; setTimeout(trySubscribe, 200); }
      }
    };

    setTimeout(trySubscribe, 100);

    return () => {
      if (subRef.current) { try { subRef.current.unsubscribe(); } catch (e) { } subRef.current = null; }
    };
  }, [connected, activeConv?.conversationId, me?.id, me?.username]);

  return {
    msgLoading,
    hasMoreMessages,
    typingUsers,
    connected
  };

}