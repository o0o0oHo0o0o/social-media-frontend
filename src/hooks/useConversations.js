import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

// Hook to encapsulate conversation list fetching and basic operations
export function useConversations() {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);

  const normalizeInboxType = useCallback((value) => {
    const v = String(value || '').toUpperCase();
    // Backward compatibility with old backend values: PRIMARY/GENERAL/REQUEST
    if (v === 'PRIMARY' || v === 'FRIENDS') return 'FRIENDS';
    if (v === 'GENERAL' || v === 'REQUEST' || v === 'STRANGERS') return 'STRANGERS';
    return 'STRANGERS';
  }, []);

  const refreshConversations = useCallback(async () => {
    try {
      // Fetch all and split on UI by inboxType to keep openConversation behavior stable
      const list = await api.getConversations(1, 50, 'ALL');

      const convList = Array.isArray(list) ? list : (list?.items || []);
      const normalized = convList.map(c => ({
        ...c,
        inboxType: normalizeInboxType(c?.inboxType)
      }));
      setConversations(normalized);
      return normalized;
    } catch (e) {
      console.error('[useConversations] refresh failed', e);
      return [];
    }
  }, [normalizeInboxType]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const convList = await refreshConversations();
        if (mounted && convList && convList.length) {
          setActiveConv((prev) => prev || convList[0]);
        }
      } catch (e) { /* ignore */ }
    })();
    return () => { mounted = false; };
  }, [refreshConversations]);

  const addConversation = useCallback((conv) => {
    if (!conv) return;
    setConversations(prev => {
      const exists = prev.some(c => c.conversationId === conv.conversationId);
      if (exists) return prev;
      return [conv, ...prev];
    });
  }, []);

  return {
    conversations,
    setConversations,
    activeConv,
    setActiveConv,
    addConversation,
    refreshConversations
  };
}

export default useConversations;
