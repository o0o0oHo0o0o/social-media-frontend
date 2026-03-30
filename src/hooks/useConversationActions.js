import { useCallback } from 'react';
import api from '../services/api';

export function useConversationActions({ activeConv, setActiveConv, setConversations, setDrawerRefreshKey }) {
  const handleRenameGroup = useCallback((newName) => {
    if (!newName) return;
    setActiveConv(prev => prev ? ({ ...prev, conversationName: newName }) : prev);
    setConversations(prev => prev.map(c => c.conversationId === activeConv?.conversationId ? ({ ...c, conversationName: newName }) : c));
    setDrawerRefreshKey(k => k + 1);

    (async () => {
      try {
        const list = await api.getConversations();
        setConversations(Array.isArray(list) ? list : (list?.items || []));
      } catch (e) {
        console.error('[useConversationActions] Failed to refresh conversations:', e);
      }
    })();
  }, [activeConv?.conversationId, setActiveConv, setConversations, setDrawerRefreshKey]);

  const handleNicknameUpdated = useCallback((memberId, newNickname) => {
    setDrawerRefreshKey(k => k + 1);
    (async () => {
      try {
        const list = await api.getConversations();
        const convList = Array.isArray(list) ? list : (list?.items || []);
        setConversations(convList);
        if (activeConv?.conversationId) {
          const updatedConv = convList.find(c => c.conversationId === activeConv.conversationId);
          if (updatedConv) setActiveConv(updatedConv);
        }
      } catch (e) {
        console.error('[useConversationActions] Failed to refresh conversations:', e);
      }
    })();
  }, [activeConv?.conversationId, setActiveConv, setConversations, setDrawerRefreshKey]);

  return { handleRenameGroup, handleNicknameUpdated };
}

export default useConversationActions;
