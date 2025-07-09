/**
 * 관리자 게시물 목록 컴포넌트
 * 게시물 목록 조회, 필터링, 정렬, 선택, 삭제 기능을 제공합니다.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminPosts } from '../../../hooks/useAdminPosts';
import { UIPost } from '../../../types';
import PostFilterBar from './PostFilterBar';
import { formatDate } from '../../../utils/formatDate';

interface PostListProps {
  onViewDetail?: (postId: string) => void;
}

/**
 * 관리자 게시물 목록 컴포넌트
 */
const PostList: React.FC<PostListProps> = ({ onViewDetail }) => {
  // 라우터 네비게이션
  const navigate = useNavigate();

  // 필터 상태
  const [filters, setFilters] = useState({
    category: '',
    tag: '',
    searchTerm: '',
    startDate: '',
    endDate: '',
    sortField: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc'
  });

  // 관리자 게시물 훅 사용
  const {
    posts,
    loading,
    error,
    pagination,
    selectedPostIds,
    hasSelection,
    isSelected,
    loadPosts,
    loadMorePosts,
    togglePostSelection,
    toggleSelectAll,
    clearSelection,
    bulkDeletePosts,
    refreshWithFilters
  } = useAdminPosts({
    ...filters,
    pageSize: 20,
    autoLoad: true
  });

  // 필터 변경 핸들러
  const handleFilterChange = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    refreshWithFilters(newFilters);
  }, [refreshWithFilters]);

  // 정렬 변경 핸들러
  const handleSortChange = useCallback((field: string) => {
    const newSortOrder = filters.sortField === field && filters.sortOrder === 'desc' ? 'asc' : 'desc';
    const newFilters = {
      sortField: field,
      sortOrder: newSortOrder as 'asc' | 'desc'
    };
    
    setFilters(prev => ({ ...prev, ...newFilters }));
    refreshWithFilters(newFilters);
  }, [filters.sortField, filters.sortOrder, refreshWithFilters]);

  // 게시물 선택 핸들러
  const handleSelectPost = useCallback((postId: string) => {
    togglePostSelection(postId);
  }, [togglePostSelection]);

  // 전체 선택 핸들러
  const handleSelectAll = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    toggleSelectAll(e.target.checked);
  }, [toggleSelectAll]);

  // 선택 게시물 삭제 핸들러
  const handleDeleteSelected = useCallback(async () => {
    if (!hasSelection) return;
    
    if (window.confirm(`선택한 ${selectedPostIds.length}개의 게시물을 삭제하시겠습니까?`)) {
      try {
        await bulkDeletePosts();
        alert(`${selectedPostIds.length}개의 게시물이 삭제되었습니다.`);
      } catch (error) {
        console.error('게시물 일괄 삭제 오류:', error);
        alert(`게시물 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }
    }
  }, [hasSelection, selectedPostIds.length, bulkDeletePosts]);

  // 게시물 상세 보기 핸들러
  const handleViewDetail = useCallback((postId: string) => {
    if (onViewDetail) {
      onViewDetail(postId);
    } else {
      navigate(`/admin/posts/${postId}`);
    }
  }, [onViewDetail, navigate]);

  // 더보기 버튼 클릭 핸들러
  const handleLoadMore = useCallback(() => {
    loadMorePosts();
  }, [loadMorePosts]);

  // 새로고침 핸들러
  const handleRefresh = useCallback(() => {
    loadPosts(true);
  }, [loadPosts]);

  // 카테고리 배지 렌더링 함수
  const renderCategoryBadge = useCallback((category: string) => {
    // 모든 카테고리를 동일하게 처리
    const bgColor = 'bg-blue-100';
    const textColor = 'text-blue-800';
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${bgColor} ${textColor}`}>
        {category}
      </span>
    );
  }, []);

  // 태그 렌더링 함수
  const renderTags = useCallback((tags: string[]) => {
    if (!tags || !tags.length) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {tags.slice(0, 3).map((tag, index) => (
          <span 
            key={index}
            className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
          >
            #{tag}
          </span>
        ))}
        {tags.length > 3 && (
          <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
            +{tags.length - 3}
          </span>
        )}
      </div>
    );
  }, []);

  return (
    <div className="bg-white rounded-lg shadow">
      {/* 필터 바 */}
      <PostFilterBar 
        filters={filters}
        onFilterChange={handleFilterChange}
        onRefresh={handleRefresh}
      />
      
      {/* 게시물 목록 */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="w-12 px-3 py-3">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  checked={hasSelection && selectedPostIds.length === posts.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th 
                scope="col" 
                className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer"
                onClick={() => handleSortChange('title')}
              >
                제목
                {filters.sortField === 'title' && (
                  <span className="ml-1">
                    {filters.sortOrder === 'desc' ? '▼' : '▲'}
                  </span>
                )}
              </th>
              <th 
                scope="col" 
                className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer"
                onClick={() => handleSortChange('category')}
              >
                카테고리
                {filters.sortField === 'category' && (
                  <span className="ml-1">
                    {filters.sortOrder === 'desc' ? '▼' : '▲'}
                  </span>
                )}
              </th>
              <th 
                scope="col" 
                className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer"
                onClick={() => handleSortChange('author.name')}
              >
                작성자
                {filters.sortField === 'author.name' && (
                  <span className="ml-1">
                    {filters.sortOrder === 'desc' ? '▼' : '▲'}
                  </span>
                )}
              </th>
              <th 
                scope="col" 
                className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer"
                onClick={() => handleSortChange('createdAt')}
              >
                작성일
                {filters.sortField === 'createdAt' && (
                  <span className="ml-1">
                    {filters.sortOrder === 'desc' ? '▼' : '▲'}
                  </span>
                )}
              </th>
              <th 
                scope="col" 
                className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer"
                onClick={() => handleSortChange('commentCount')}
              >
                댓글
                {filters.sortField === 'commentCount' && (
                  <span className="ml-1">
                    {filters.sortOrder === 'desc' ? '▼' : '▲'}
                  </span>
                )}
              </th>
              <th scope="col" className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                태그
              </th>
              <th scope="col" className="px-3 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                액션
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && posts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-center text-gray-500">
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-3 -ml-1 text-blue-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    게시물을 불러오는 중...
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-center text-red-500">
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {error.message || '게시물을 불러오는 중 오류가 발생했습니다.'}
                  </div>
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-center text-gray-500">
                  게시물이 없습니다.
                </td>
              </tr>
            ) : (
              posts.map((post: UIPost) => (
                <tr 
                  key={post.id} 
                  className={`hover:bg-gray-50 ${isSelected(post.id) ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-3 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      checked={isSelected(post.id)}
                      onChange={() => handleSelectPost(post.id)}
                    />
                  </td>
                  <td className="px-3 py-4">
                    <div className="max-w-xs truncate">
                      <span 
                        className="font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                        onClick={() => handleViewDetail(post.id)}
                      >
                        {post.title}
                      </span>
                      {post.isNew && (
                        <span className="ml-2 text-xs font-medium text-red-600">NEW</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    {renderCategoryBadge(post.category)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{post.author.name}</div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDate(post.date)}
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{post.comments}</div>
                  </td>
                  <td className="px-3 py-4">
                    {renderTags(post.tags)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                        onClick={() => handleViewDetail(post.id)}
                      >
                        상세
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* 하단 액션 바 */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 sm:px-6">
        <div className="flex items-center space-x-2">
          {hasSelection && (
            <button
              type="button"
              className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              onClick={handleDeleteSelected}
            >
              선택 삭제 ({selectedPostIds.length})
            </button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {loading && posts.length > 0 && (
            <span className="text-sm text-gray-500">로딩 중...</span>
          )}
          {pagination.hasMore && !loading && (
            <button
              type="button"
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={handleLoadMore}
            >
              더 보기
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostList; 