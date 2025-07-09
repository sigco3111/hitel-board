/**
 * 관리자 게시물 관리 React 훅
 * 게시물 목록 조회, 필터링, 정렬, 상세 조회, 수정, 삭제 기능을 제공합니다.
 */
import { useState, useEffect, useCallback } from 'react';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { 
  fetchAllPostsAdmin, 
  fetchPostDetailAdmin, 
  updatePostAdmin, 
  deletePostAdmin,
  bulkDeletePostsAdmin,
  fetchPostStatsAdmin,
  createPostAdmin
} from '../services/admin/posts';
import { useAdminAuth } from './useAdminAuth';
import type { UIPost, Post } from '../types';

interface PostsState {
  posts: UIPost[];
  loading: boolean;
  error: Error | null;
  pagination: {
    lastVisible: QueryDocumentSnapshot<DocumentData> | undefined;
    hasMore: boolean;
  };
}

interface PostDetailState {
  post: (UIPost & { editHistory?: any[] }) | null;
  loading: boolean;
  error: Error | null;
}

interface PostStatsState {
  stats: {
    totalPosts: number;
    categoryCounts: Record<string, number>;
    tagCounts: Record<string, number>;
    authorCounts: Record<string, number>;
    monthlyCounts: Record<string, number>;
  } | null;
  loading: boolean;
  error: Error | null;
}

interface UseAdminPostsOptions {
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  category?: string;
  tag?: string;
  authorId?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
  autoLoad?: boolean;
}

/**
 * 관리자 게시물 관리 커스텀 훅
 * @param options 게시물 조회 옵션 (페이지 크기, 정렬 기준, 필터링 조건 등)
 * @returns 게시물 목록, 상세 정보, 통계 및 관련 함수들
 */
export const useAdminPosts = (options: UseAdminPostsOptions = {}) => {
  const { 
    pageSize = 20, 
    sortField = 'createdAt', 
    sortOrder = 'desc',
    category,
    tag,
    authorId,
    startDate,
    endDate,
    searchTerm,
    autoLoad = true
  } = options;

  // 관리자 인증 정보
  const { admin, isAdmin } = useAdminAuth();

  // 게시물 목록 상태
  const [postsState, setPostsState] = useState<PostsState>({
    posts: [],
    loading: autoLoad,
    error: null,
    pagination: {
      lastVisible: undefined,
      hasMore: false
    }
  });

  // 게시물 상세 정보 상태
  const [postDetailState, setPostDetailState] = useState<PostDetailState>({
    post: null,
    loading: false,
    error: null
  });

  // 게시물 통계 상태
  const [statsState, setStatsState] = useState<PostStatsState>({
    stats: null,
    loading: false,
    error: null
  });

  // 선택된 게시물 ID 목록 (일괄 작업용)
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);

  /**
   * 게시물 목록 조회 함수
   * @param resetPagination 페이지네이션 초기화 여부
   */
  const loadPosts = useCallback(async (resetPagination = false) => {
    if (!isAdmin) {
      setPostsState(prev => ({
        ...prev,
        error: new Error('관리자 권한이 필요합니다.')
      }));
      return;
    }

    try {
      setPostsState(prev => ({ ...prev, loading: true, error: null }));

      const lastVisible = resetPagination ? undefined : postsState.pagination.lastVisible;

      const result = await fetchAllPostsAdmin({
        pageSize,
        lastVisible,
        sortField,
        sortOrder,
        category,
        tag,
        authorId,
        startDate,
        endDate,
        searchTerm
      });

      setPostsState(prev => ({
        posts: resetPagination ? result.posts : [...prev.posts, ...result.posts],
        loading: false,
        error: null,
        pagination: result.pagination
      }));
    } catch (error) {
      console.error('게시물 목록 조회 오류:', error);
      setPostsState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('게시물 목록을 가져오는 중 오류가 발생했습니다.')
      }));
    }
  }, [
    isAdmin, 
    postsState.pagination.lastVisible, 
    pageSize, 
    sortField, 
    sortOrder,
    category,
    tag,
    authorId,
    startDate,
    endDate,
    searchTerm
  ]);

  /**
   * 게시물 상세 정보 조회 함수
   * @param postId 게시물 ID
   */
  const loadPostDetail = useCallback(async (postId: string) => {
    if (!isAdmin) {
      setPostDetailState({
        post: null,
        loading: false,
        error: new Error('관리자 권한이 필요합니다.')
      });
      return;
    }

    try {
      setPostDetailState({
        post: null,
        loading: true,
        error: null
      });

      const postDetail = await fetchPostDetailAdmin(postId);

      setPostDetailState({
        post: postDetail,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error(`게시물 상세 조회 오류 (ID: ${postId}):`, error);
      setPostDetailState({
        post: null,
        loading: false,
        error: error instanceof Error ? error : new Error('게시물 상세 정보를 가져오는 중 오류가 발생했습니다.')
      });
    }
  }, [isAdmin]);

  /**
   * 게시물 수정 함수
   * @param postId 게시물 ID
   * @param postData 수정할 게시물 데이터
   * @param reason 수정 사유
   */
  const updatePost = useCallback(async (
    postId: string, 
    postData: Partial<Post> | Partial<UIPost>,
    reason?: string
  ) => {
    if (!isAdmin || !admin) {
      throw new Error('관리자 권한이 필요합니다.');
    }

    try {
      const updatedPost = await updatePostAdmin(postId, postData, admin.id, reason);
      
      // 게시물 목록 갱신
      setPostsState(prev => ({
        ...prev,
        posts: prev.posts.map(post => 
          post.id === postId ? updatedPost : post
        )
      }));

      // 상세 정보가 로드된 상태라면 갱신
      if (postDetailState.post && postDetailState.post.id === postId) {
        loadPostDetail(postId);
      }

      return updatedPost;
    } catch (error) {
      console.error(`게시물 수정 오류 (ID: ${postId}):`, error);
      throw error instanceof Error ? error : new Error('게시물 수정 중 오류가 발생했습니다.');
    }
  }, [isAdmin, admin, loadPostDetail, postDetailState.post]);

  /**
   * 게시물 삭제 함수
   * @param postId 게시물 ID
   */
  const deletePost = useCallback(async (postId: string) => {
    if (!isAdmin) {
      throw new Error('관리자 권한이 필요합니다.');
    }

    try {
      await deletePostAdmin(postId);
      
      // 게시물 목록에서 제거
      setPostsState(prev => ({
        ...prev,
        posts: prev.posts.filter(post => post.id !== postId)
      }));

      // 선택된 게시물 목록에서 제거
      setSelectedPostIds(prev => prev.filter(id => id !== postId));

      // 상세 정보가 로드된 상태라면 초기화
      if (postDetailState.post && postDetailState.post.id === postId) {
        setPostDetailState({
          post: null,
          loading: false,
          error: null
        });
      }

      return true;
    } catch (error) {
      console.error(`게시물 삭제 오류 (ID: ${postId}):`, error);
      throw error instanceof Error ? error : new Error('게시물 삭제 중 오류가 발생했습니다.');
    }
  }, [isAdmin, postDetailState.post]);

  /**
   * 게시물 일괄 삭제 함수
   * @param postIds 삭제할 게시물 ID 배열
   */
  const bulkDeletePosts = useCallback(async (postIds: string[] = selectedPostIds) => {
    if (!isAdmin) {
      throw new Error('관리자 권한이 필요합니다.');
    }

    if (!postIds.length) {
      return { deletedCount: 0 };
    }

    try {
      const result = await bulkDeletePostsAdmin(postIds);
      
      // 게시물 목록에서 제거
      setPostsState(prev => ({
        ...prev,
        posts: prev.posts.filter(post => !postIds.includes(post.id))
      }));

      // 선택된 게시물 목록 초기화
      setSelectedPostIds([]);

      // 상세 정보가 로드된 상태이고 삭제된 게시물이라면 초기화
      if (postDetailState.post && postIds.includes(postDetailState.post.id)) {
        setPostDetailState({
          post: null,
          loading: false,
          error: null
        });
      }

      return result;
    } catch (error) {
      console.error('게시물 일괄 삭제 오류:', error);
      throw error instanceof Error ? error : new Error('게시물 일괄 삭제 중 오류가 발생했습니다.');
    }
  }, [isAdmin, selectedPostIds, postDetailState.post]);

  /**
   * 게시물 통계 정보 조회 함수
   */
  const loadPostStats = useCallback(async () => {
    if (!isAdmin) {
      setStatsState({
        stats: null,
        loading: false,
        error: new Error('관리자 권한이 필요합니다.')
      });
      return;
    }

    try {
      setStatsState({
        stats: null,
        loading: true,
        error: null
      });

      const stats = await fetchPostStatsAdmin();

      setStatsState({
        stats,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('게시물 통계 조회 오류:', error);
      setStatsState({
        stats: null,
        loading: false,
        error: error instanceof Error ? error : new Error('게시물 통계 정보를 가져오는 중 오류가 발생했습니다.')
      });
    }
  }, [isAdmin]);

  /**
   * 게시물 생성 함수
   * @param postData 생성할 게시물 데이터
   */
  const createPost = useCallback(async (postData: Partial<Post> | Partial<UIPost>) => {
    if (!isAdmin || !admin) {
      throw new Error('관리자 권한이 필요합니다.');
    }

    try {
      const newPost = await createPostAdmin(postData, admin.id);
      
      // 게시물 목록 갱신
      setPostsState(prev => ({
        ...prev,
        posts: [newPost, ...prev.posts]
      }));

      return newPost;
    } catch (error) {
      console.error('게시물 생성 오류:', error);
      throw error instanceof Error ? error : new Error('게시물 생성 중 오류가 발생했습니다.');
    }
  }, [isAdmin, admin]);

  /**
   * 게시물 선택 토글 함수
   * @param postId 게시물 ID
   */
  const togglePostSelection = useCallback((postId: string) => {
    setSelectedPostIds(prev => 
      prev.includes(postId)
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  }, []);

  /**
   * 모든 게시물 선택/해제 함수
   * @param selectAll 전체 선택 여부
   */
  const toggleSelectAll = useCallback((selectAll: boolean) => {
    setSelectedPostIds(selectAll 
      ? postsState.posts.map(post => post.id)
      : []
    );
  }, [postsState.posts]);

  /**
   * 선택된 게시물 ID 목록 초기화 함수
   */
  const clearSelection = useCallback(() => {
    setSelectedPostIds([]);
  }, []);

  // 컴포넌트 마운트 시 또는 의존성 변경 시 게시물 목록 조회
  useEffect(() => {
    if (autoLoad) {
      loadPosts(true);
    }
  }, [
    autoLoad,
    loadPosts,
    sortField,
    sortOrder,
    category,
    tag,
    authorId,
    startDate,
    endDate,
    searchTerm
  ]);

  // 다음 페이지 로드 함수
  const loadMorePosts = useCallback(() => {
    if (postsState.pagination.hasMore && !postsState.loading) {
      loadPosts(false);
    }
  }, [postsState.pagination.hasMore, postsState.loading, loadPosts]);

  // 필터 변경 시 게시물 목록 새로고침 함수
  const refreshWithFilters = useCallback((newFilters: Partial<UseAdminPostsOptions>) => {
    // 필터 변경 시 선택된 게시물 목록 초기화
    clearSelection();
    
    // 새로운 필터로 게시물 목록 조회
    loadPosts(true);
  }, [loadPosts, clearSelection]);

  return {
    // 게시물 목록 상태
    posts: postsState.posts,
    loading: postsState.loading,
    error: postsState.error,
    pagination: postsState.pagination,
    
    // 게시물 상세 정보 상태
    postDetail: postDetailState.post,
    postDetailLoading: postDetailState.loading,
    postDetailError: postDetailState.error,
    
    // 게시물 통계 상태
    stats: statsState.stats,
    statsLoading: statsState.loading,
    statsError: statsState.error,
    
    // 선택된 게시물 관련
    selectedPostIds,
    isSelected: (postId: string) => selectedPostIds.includes(postId),
    hasSelection: selectedPostIds.length > 0,
    
    // 함수들
    loadPosts,
    loadMorePosts,
    loadPostDetail,
    updatePost,
    deletePost,
    createPost,
    bulkDeletePosts,
    loadPostStats,
    togglePostSelection,
    toggleSelectAll,
    clearSelection,
    refreshWithFilters
  };
}; 