/**
 * 관리자 게시물 관리 페이지
 * 게시물 목록 조회, 필터링, 정렬, 상세 조회, 수정, 삭제 기능을 제공합니다.
 */
import React, { useState, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import PostList from './PostList';
import PostDetail from './PostDetail';

/**
 * 관리자 게시물 관리 페이지 컴포넌트
 */
const AdminPosts: React.FC = () => {
  const navigate = useNavigate();
  
  // 게시물 상세 보기 핸들러
  const handleViewPostDetail = useCallback((postId: string) => {
    navigate(`/admin/posts/${postId}`);
  }, [navigate]);
  
  // 새 게시물 작성 핸들러
  const handleCreatePost = useCallback(() => {
    navigate('/admin/posts/new');
  }, [navigate]);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">게시물 관리</h1>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={handleCreatePost}
            className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            새 게시물
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/posts/stats')}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            통계
          </button>
        </div>
      </div>
      
      <Routes>
        <Route path="/" element={<PostList onViewDetail={handleViewPostDetail} />} />
        <Route path="/new" element={<PostDetail isCreateMode={true} />} />
        <Route path="/:postId" element={<PostDetail />} />
      </Routes>
    </div>
  );
};

export default AdminPosts; 