import { useState, useCallback } from 'react';
import api from '../services/api';

/**
 * Hook lấy ảnh trong đoạn chat
 */
export const useConversationPhotos = (conversationId) => {
  const [photos, setPhotos] = useState([]);
  const [photoPage, setPhotoPage] = useState(0);
  const [hasMorePhotos, setHasMorePhotos] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  const resetPhotos = useCallback(() => {
    setPhotos([]);
    setPhotoPage(0);
    setHasMorePhotos(true);
  }, []);

  const fetchPhotos = useCallback(async (page = 0) => {
    if (!conversationId) return;
    setLoadingPhotos(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/chat/${conversationId}/photos?page=${page}&size=20`,
        { credentials: 'include' }
      );
      if (!response.ok) {
        console.error(`[Photos] API error: ${response.status}`, response.statusText);
        throw new Error(`Failed to fetch photos: ${response.status}`);
      }

      const data = await response.json();
      if (page === 0) {
        setPhotos(data.content || []);
      } else {
        setPhotos(prev => [...prev, ...(data.content || [])]);
      }
      setPhotoPage(page);
      setHasMorePhotos(data.hasNext !== false && (data.content?.length || 0) === 20);
    } catch (e) {
      console.error('[useConversationPhotos] Error:', e);
    } finally {
      setLoadingPhotos(false);
    }
  }, [conversationId]);

  return { photos, photoPage, hasMorePhotos, loadingPhotos, fetchPhotos, resetPhotos };
};

/**
 * Hook lấy file trong đoạn chat
 */
export const useConversationFiles = (conversationId) => {
  const [files, setFiles] = useState([]);
  const [filePage, setFilePage] = useState(0);
  const [hasMoreFiles, setHasMoreFiles] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);

  const resetFiles = useCallback(() => {
    setFiles([]);
    setFilePage(0);
    setHasMoreFiles(true);
  }, []);

  const fetchFiles = useCallback(async (page = 0) => {
    if (!conversationId) return;
    setLoadingFiles(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/chat/${conversationId}/files?page=${page}&size=10`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch files');

      const data = await response.json();
      if (page === 0) {
        setFiles(data.content || []);
      } else {
        setFiles(prev => [...prev, ...(data.content || [])]);
      }
      setFilePage(page);
      setHasMoreFiles(data.hasNext !== false && (data.content?.length || 0) === 10);
    } catch (e) {
      console.error('[useConversationFiles] Error:', e);
    } finally {
      setLoadingFiles(false);
    }
  }, [conversationId]);

  return { files, filePage, hasMoreFiles, loadingFiles, fetchFiles, resetFiles };
};

/**
 * Hook lấy danh sách thành viên trong đoạn chat
 */
export const useConversationMembers = (conversationId) => {
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const resetMembers = useCallback(() => {
    setMembers([]);
  }, []);

  const fetchMembers = useCallback(async () => {
    if (!conversationId) return;
    setLoadingMembers(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/chat/${conversationId}/members/details`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Failed to fetch members');

      const data = await response.json();
      setMembers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[useConversationMembers] Error:', e);
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, [conversationId]);

  return { members, loadingMembers, fetchMembers, resetMembers };
};
