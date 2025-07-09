/**
 * 북마크 관련 커스텀 훅
 * 북마크 추가, 삭제, 조회 기능을 제공합니다.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  addBookmark,
  removeBookmark,
  isBookmarked as checkIsBookmarked,
  fetchBookmarkedPosts
} from '../services/firebase/firestore';
import type { UIPost } from '../types';

interface BookmarkState {
  bookmarkedPosts: UIPost[];
  bookmarkStatuses: Record<string, boolean>; // postId를 키로, 북마크 여부를 값으로 하는 객체
  loading: boolean;
  error: Error | null;
}

export const useBookmarks = (userId?: string) => {
  // 상태 초기화
  const [state, setState] = useState<BookmarkState>({
    bookmarkedPosts: [],
    bookmarkStatuses: {},
    loading: false,
    error: null
  });

  /**
   * 북마크 상태 확인 함수
   * @param postId 게시물 ID
   */
  const checkBookmarkStatus = useCallback(async (postId: string) => {
    if (!userId || !postId) return;

    try {
      const isBookmarked = await checkIsBookmarked(userId, postId);
      setState(prev => ({
        ...prev,
        bookmarkStatuses: {
          ...prev.bookmarkStatuses,
          [postId]: isBookmarked
        }
      }));
    } catch (error) {
      console.error('북마크 상태 확인 오류:', error);
    }
  }, [userId]);

  /**
   * 북마크 목록 로드 함수
   */
  const loadBookmarkedPosts = useCallback(async () => {
    if (!userId) return;

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const posts = await fetchBookmarkedPosts(userId);
      
      // 북마크 상태 객체 업데이트
      const statuses: Record<string, boolean> = {};
      posts.forEach(post => {
        statuses[post.id] = true;
      });
      
      setState({
        bookmarkedPosts: posts,
        bookmarkStatuses: statuses,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('북마크 게시물 조회 오류:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('북마크 게시물을 불러오는 데 실패했습니다.')
      }));
    }
  }, [userId]);

  /**
   * 북마크 추가 함수
   * @param postId 게시물 ID
   */
  const toggleBookmark = useCallback(async (postId: string, isAnonymous?: boolean) => {
    if (!userId || !postId) {
      setState(prev => ({
        ...prev,
        error: new Error('로그인이 필요합니다.')
      }));
      return false;
    }

    // 게스트 사용자(익명 사용자) 북마크 제한
    if (isAnonymous) {
      setState(prev => ({
        ...prev,
        error: new Error('게스트는 북마크 기능을 사용할 수 없습니다. 로그인 후 이용해주세요.')
      }));
      return false;
    }

    try {
      const isCurrentlyBookmarked = state.bookmarkStatuses[postId] || false;
      
      if (isCurrentlyBookmarked) {
        // 북마크 제거
        await removeBookmark(userId, postId);
        setState(prev => ({
          ...prev,
          bookmarkStatuses: {
            ...prev.bookmarkStatuses,
            [postId]: false
          }
        }));
      } else {
        // 북마크 추가
        await addBookmark(userId, postId);
        setState(prev => ({
          ...prev,
          bookmarkStatuses: {
            ...prev.bookmarkStatuses,
            [postId]: true
          }
        }));
      }
      
      // 북마크 목록 새로고침
      await loadBookmarkedPosts();
      return true;
    } catch (error) {
      console.error('북마크 토글 오류:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error : new Error('북마크 처리 중 오류가 발생했습니다.')
      }));
      return false;
    }
  }, [userId, state.bookmarkStatuses, loadBookmarkedPosts]);

  /**
   * 특정 게시물의 북마크 상태 반환 함수
   * @param postId 게시물 ID
   */
  const isBookmarked = useCallback((postId: string): boolean => {
    return !!state.bookmarkStatuses[postId];
  }, [state.bookmarkStatuses]);

  /**
   * 에러 초기화 함수
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // 컴포넌트 마운트 시 또는 userId 변경 시 북마크 목록 조회
  useEffect(() => {
    if (userId) {
      loadBookmarkedPosts();
    } else {
      // 로그인하지 않은 경우 상태 초기화
      setState({
        bookmarkedPosts: [],
        bookmarkStatuses: {},
        loading: false,
        error: null
      });
    }
  }, [userId, loadBookmarkedPosts]);

  return {
    bookmarkedPosts: state.bookmarkedPosts,
    loading: state.loading,
    error: state.error,
    toggleBookmark,
    isBookmarked,
    checkBookmarkStatus,
    refresh: loadBookmarkedPosts,
    clearError
  };
}; 