import { useState, useEffect, useCallback } from 'react';
import { UIComment } from '../types';
import { fetchCommentsByPostId, createComment, updateComment, deleteComment } from '../services/firebase/firestore';
import { useAuth } from './useAuth';

interface UseCommentsProps {
  postId: string | null;
}

interface UseCommentsReturn {
  comments: UIComment[];
  loading: boolean;
  error: Error | null;
  addComment: (content: string) => Promise<void>;
  editComment: (commentId: string, content: string) => Promise<void>;
  removeComment: (commentId: string) => Promise<void>;
  refreshComments: () => Promise<void>;
}

/**
 * 댓글 관련 기능을 제공하는 훅
 * @param postId 게시물 ID
 * @returns 댓글 목록 및 관련 기능
 */
export const useComments = ({ postId }: UseCommentsProps): UseCommentsReturn => {
  const [comments, setComments] = useState<UIComment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();
  
  // 댓글 목록 조회
  const fetchComments = useCallback(async () => {
    if (!postId) {
      setComments([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const fetchedComments = await fetchCommentsByPostId(postId);
      setComments(fetchedComments);
    } catch (err) {
      console.error('댓글 조회 오류:', err);
      setError(err instanceof Error ? err : new Error('댓글을 불러오는 중 오류가 발생했습니다.'));
    } finally {
      setLoading(false);
    }
  }, [postId]);
  
  // 컴포넌트 마운트 시 댓글 목록 조회
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);
  
  // 새 댓글 추가
  const addComment = useCallback(async (content: string) => {
    if (!user || !postId) {
      throw new Error('로그인이 필요하거나 게시물이 선택되지 않았습니다.');
    }
    
    try {
      await createComment({
        postId,
        content,
        author: {
          name: user.displayName || '익명 사용자',
          photoURL: user.photoURL
        },
        authorId: user.uid
      });
      
      // 댓글 목록 새로고침
      await fetchComments();
    } catch (err) {
      console.error('댓글 추가 오류:', err);
      throw err;
    }
  }, [user, postId, fetchComments]);
  
  // 댓글 수정
  const editComment = useCallback(async (commentId: string, content: string) => {
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }
    
    try {
      await updateComment(commentId, content, user.uid);
      
      // 댓글 목록 새로고침
      await fetchComments();
    } catch (err) {
      console.error('댓글 수정 오류:', err);
      throw err;
    }
  }, [user, fetchComments]);
  
  // 댓글 삭제
  const removeComment = useCallback(async (commentId: string) => {
    if (!user || !postId) {
      throw new Error('로그인이 필요하거나 게시물이 선택되지 않았습니다.');
    }
    
    try {
      await deleteComment(commentId, postId, user.uid);
      
      // 댓글 목록 새로고침
      await fetchComments();
    } catch (err) {
      console.error('댓글 삭제 오류:', err);
      throw err;
    }
  }, [user, postId, fetchComments]);
  
  return {
    comments,
    loading,
    error,
    addComment,
    editComment,
    removeComment,
    refreshComments: fetchComments
  };
}; 