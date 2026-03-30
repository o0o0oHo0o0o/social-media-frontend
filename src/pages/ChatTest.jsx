import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/button.css';
import Button from '../components/Common/Button';
import api from '../services/api';

// Max 5MB per file
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export default function ChatTest({ onBack }) {
  // Form fields consistent with DTOs
  const [conversationId, setConversationId] = useState(1);
  const [content, setContent] = useState('Hello from FE test');
  const [replyToMessageId, setReplyToMessageId] = useState('');
  const [lastMessageId, setLastMessageId] = useState('');

  const [files, setFiles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [messages, setMessages] = useState([]); // display incoming messages
  const [sending, setSending] = useState(false);
  const [marking, setMarking] = useState(false);
  const [sendingResp, setSendingResp] = useState(null);

  // WebSocket/STOMP
  const [wsBase, setWsBase] = useState('http://localhost:8080');
  const [connected, setConnected] = useState(false);
  const stompRef = useRef(null);
  const subscriptionRef = useRef(null);
  const typingTimer = useRef(null);

  function log(line) {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${line}`]);
  }

  const onPickFiles = (e) => {
    const list = Array.from(e.target.files || []);
    const tooBig = list.find(f => f.size > MAX_FILE_SIZE);
    if (tooBig) {
      alert(`File quá lớn (> 5MB): ${tooBig.name}`);
      return;
    }
    setFiles(list);
  };

  const handleSend = async () => {
    setSending(true);
    try {
      // Build SendMessageRequest
      const payload = {
        conversationId: Number(conversationId),
        content: content || '',
        replyToMessageId: replyToMessageId ? Number(replyToMessageId) : null
      };
      const res = await api.sendChatMessage({ jsonData: JSON.stringify(payload), files });
      setSendingResp(res);
      log(`Send OK: ${JSON.stringify(res)}`);
      // push to messages list if server returns message
      try { if (res) setMessages(prev => [res, ...prev]); } catch (err) { void err; }
    } catch (e) {
      console.error(e);
      log(`Send ERROR: ${e.message}`);
      alert(`Lỗi gửi: ${e.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleMarkRead = async () => {
    setMarking(true);
    try {
      const payload = {
        conversationId: Number(conversationId),
        lastMessageId: lastMessageId ? Number(lastMessageId) : null
      };
      await api.markChatRead(payload);
      log('MarkRead OK');
      alert('Đánh dấu đã đọc thành công');
    } catch (e) {
      console.error(e);
      log(`MarkRead ERROR: ${e.message}`);
      alert(`Lỗi mark read: ${e.message}`);
    } finally {
      setMarking(false);
    }
  };

  const wsUrl = useMemo(() => {
    // http://localhost:8080 -> ws://localhost:8080/ws
    const isHttps = wsBase.startsWith('https://');
    const scheme = isHttps ? 'wss://' : 'ws://';
    const path = '/ws';
    const rest = wsBase.replace(/^https?:\/\//, '');
    return `${scheme}${rest}${path}`;
  }, [wsBase]);

  const subscribeTopic = (client, convId) => {
    // cleanup old
    if (subscriptionRef.current) {
      try { subscriptionRef.current.unsubscribe(); } catch (err) { void err; }
      subscriptionRef.current = null;
    }
    const dest = `/topic/chat.${convId}`;
    const sub = client.subscribe(dest, (msg) => {
      try {
        const body = JSON.parse(msg.body);
        setMessages(prev => [body, ...prev]);
        log(`SUB ${dest} -> ${msg.body}`);
      } catch (err) { void err; log(`SUB ${dest} (raw) -> ${msg.body}`); }
    });
    subscriptionRef.current = sub;
  };

  const doConnect = async () => {
    try {
      // Fetch WS token then connect with header
      let token = null;
      try {
        const wsTok = await api.getWebSocketToken();
        token = wsTok?.token || null;
      } catch (e) { void e; }
      const { Client } = await import('@stomp/stompjs');
      const client = new Client({
        brokerURL: wsUrl,
        reconnectDelay: 3000,
        connectHeaders: token ? { 'X-WS-TOKEN': token } : undefined,
        onConnect: () => {
          setConnected(true);
          log(`STOMP connected to ${wsUrl}`);
          subscribeTopic(client, conversationId);
        },
        onStompError: (frame) => {
          log(`STOMP error: ${frame.headers['message']} ${frame.body}`);
        },
        onWebSocketError: () => { log('WebSocket error'); }
      });
      client.activate();
      stompRef.current = client;
    } catch (e) { log(`Failed to init STOMP: ${e.message}`); }
  };

  const doDisconnect = () => {
    const c = stompRef.current;
    if (c) {
      c.deactivate();
      stompRef.current = null;
      setConnected(false);
      log('STOMP disconnected');
    }
  };

  // Re-subscribe when conversationId changes and already connected
  useEffect(() => {
    const c = stompRef.current;
    if (connected && c) {
      try { subscribeTopic(c, conversationId); } catch (err) { void err; }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Send typing event to /app/chat.typing (debounced)
  const sendTyping = (isTyping) => {
    const c = stompRef.current;
    if (!c || !connected) return;
    const body = JSON.stringify({
      conversationId: Number(conversationId),
      isTyping: !!isTyping
    });
    try { c.publish({ destination: '/app/chat.typing', body }); } catch (err) { void err; }
  };

  const onContentChange = (e) => {
    setContent(e.target.value);
    // debounce typing events
    sendTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => sendTyping(false), 1200);
  };

  return (
    <div className="dashboard" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="dashboard-header">
        <h2>Chat Test</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button onClick={onBack}>← Back</Button>
        </div>
      </div>

      <section style={{ marginTop: 16 }}>
        <h3>1) Gửi tin nhắn (REST /api/chat/send)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'block' }}>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Conversation ID</div>
            <input className="input" style={{ width: '100%', padding: 8 }} value={conversationId}
              onChange={e => setConversationId(e.target.value)} />
          </label>
          <label style={{ display: 'block' }}>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Reply To Message ID (optional)</div>
            <input className="input" style={{ width: '100%', padding: 8 }} value={replyToMessageId}
              onChange={e => setReplyToMessageId(e.target.value)} />
          </label>
        </div>
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Nội dung</div>
          <textarea value={content} onChange={onContentChange}
            style={{ width: '100%', height: 100, fontFamily: 'inherit', padding: 8 }} />
        </div>
        <div style={{ margin: '8px 0' }}>
          <input type="file" multiple onChange={onPickFiles} />
          {files?.length ? (
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {files.length} file(s): {files.map(f => `${f.name} (${(f.size / 1024).toFixed(1)}KB)`).join(', ')}
            </div>
          ) : null}
        </div>
        <Button onClick={handleSend} loading={sending}>Send Message</Button>
        {sendingResp && (
          <pre style={{ background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 8, marginTop: 8 }}>
            {JSON.stringify(sendingResp, null, 2)}
          </pre>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>2) Đánh dấu đã đọc (REST /api/chat/read)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'block' }}>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Conversation ID</div>
            <input className="input" style={{ width: '100%', padding: 8 }} value={conversationId}
              onChange={e => setConversationId(e.target.value)} />
          </label>
          <label style={{ display: 'block' }}>
            <div style={{ fontSize: 12, opacity: 0.8 }}>Last Message ID</div>
            <input className="input" style={{ width: '100%', padding: 8 }} value={lastMessageId}
              onChange={e => setLastMessageId(e.target.value)} />
          </label>
        </div>
        <Button onClick={handleMarkRead} loading={marking} style={{ marginTop: 8 }}>Mark as Read</Button>
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>3) STOMP WebSocket</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxWidth: 900 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, opacity: 0.8 }}>WS Base (backend)</label>
            <input className="input" style={{ width: '100%', padding: 8 }} value={wsBase} onChange={e => setWsBase(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, opacity: 0.8 }}>Conversation ID (subscribe /topic/chat.{`{id}`})</label>
            <input className="input" style={{ width: '100%', padding: 8 }} value={conversationId} onChange={e => setConversationId(e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          {!connected ? (
            <Button onClick={doConnect}>Connect</Button>
          ) : (
            <Button onClick={doDisconnect}>Disconnect</Button>
          )}
          <div style={{ fontSize: 12, opacity: 0.8, alignSelf: 'center' }}>
            Status: {connected ? 'Connected' : 'Disconnected'} ({wsUrl})
          </div>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>4) Dòng chat (subscribe)</h3>
        <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: 8, maxHeight: 280, overflow: 'auto' }}>
          {messages.length === 0 ? (
            <div style={{ opacity: 0.7, fontSize: 14 }}>Chưa có message. Kết nối STOMP và gửi message để xem live.</div>
          ) : messages.map((m, idx) => (
            <div key={idx} style={{ padding: '6px 8px', marginBottom: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 6 }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{typeof m === 'string' ? m : JSON.stringify(m, null, 2)}</pre>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>Logs</h3>
        <pre style={{ background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 8, maxHeight: 240, overflow: 'auto' }}>
          {logs.join('\n')}
        </pre>
      </section>
    </div>
  );
}
