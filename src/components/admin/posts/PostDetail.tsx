/**
 * 관리자 게시물 상세 컴포넌트
 * 게시물 상세 정보 조회, 수정, 삭제 기능을 제공합니다.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminPosts } from '../../../hooks/useAdminPosts';
import { formatDate, formatDateTime } from '../../../utils/formatDate';

interface PostDetailProps {
  isCreateMode?: boolean;
}

/**
 * 관리자 게시물 상세 컴포넌트
 */
const PostDetail: React.FC<PostDetailProps> = ({ isCreateMode = false }) => {
  // URL 파라미터에서 게시물 ID 추출
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  
  // 수정 모드 상태
  const [isEditMode, setIsEditMode] = useState(isCreateMode);
  
  // 관리자 게시물 훅 사용
  const {
    postDetail,
    postDetailLoading,
    postDetailError,
    updatePost,
    deletePost,
    loadPostDetail,
    createPost,
  } = useAdminPosts();
  
  // 수정 폼 상태
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
    isPublished: true
  });
  
  // 게시물 로드
  useEffect(() => {
    if (postId && !isCreateMode) {
      loadPostDetail(postId);
    }
  }, [postId, loadPostDetail, isCreateMode]);
  
  // 게시물 데이터가 변경되면 폼 데이터 업데이트
  useEffect(() => {
    if (postDetail && !isCreateMode) {
      setFormData({
        title: postDetail.title || '',
        content: postDetail.content || '',
        category: postDetail.category || '',
        tags: postDetail.tags ? postDetail.tags.join(', ') : '',
        isPublished: true // 기본값으로 true 사용
      });
    }
  }, [postDetail, isCreateMode]);
  
  // 입력 필드 변경 핸들러
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);
  
  // 체크박스 변경 핸들러
  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  }, []);
  
  // 수정 모드 전환 핸들러
  const handleEditClick = useCallback(() => {
    setIsEditMode(true);
  }, []);
  
  // 수정 취소 핸들러
  const handleCancelEdit = useCallback(() => {
    if (isCreateMode) {
      navigate('/admin/posts');
      return;
    }
    
    if (postDetail) {
      setFormData({
        title: postDetail.title || '',
        content: postDetail.content || '',
        category: postDetail.category || '',
        tags: postDetail.tags ? postDetail.tags.join(', ') : '',
        isPublished: true // 기본값으로 true 사용
      });
    }
    setIsEditMode(false);
  }, [postDetail, isCreateMode, navigate]);
  
  // 게시물 수정 제출 핸들러
  const handleSubmitEdit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 태그를 배열로 변환
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '');
      
      const postData = {
        ...formData,
        tags: tagsArray
      };
      
      if (isCreateMode) {
        // 새 게시물 생성
        const newPost = await createPost(postData);
        alert('게시물이 성공적으로 생성되었습니다.');
        navigate(`/admin/posts/${newPost.id}`);
      } else if (postId) {
        // 기존 게시물 수정
        await updatePost(postId, postData);
        setIsEditMode(false);
        alert('게시물이 성공적으로 업데이트되었습니다.');
      }
    } catch (error) {
      console.error('게시물 저장 오류:', error);
      alert(`게시물 저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }, [postId, formData, updatePost, createPost, isCreateMode, navigate]);
  
  // 게시물 삭제 핸들러
  const handleDeletePost = useCallback(async () => {
    if (!postId) return;
    
    if (window.confirm('정말로 이 게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        await deletePost(postId);
        alert('게시물이 성공적으로 삭제되었습니다.');
        navigate('/admin/posts');
      } catch (error) {
        console.error('게시물 삭제 오류:', error);
        alert(`게시물 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }
    }
  }, [postId, deletePost, navigate]);
  
  // 목록으로 돌아가기 핸들러
  const handleBackToList = useCallback(() => {
    navigate('/admin/posts');
  }, [navigate]);
  
  // 로딩 중 표시 (생성 모드에서는 표시하지 않음)
  if (postDetailLoading && !isCreateMode) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <svg className="w-6 h-6 text-blue-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-lg font-medium text-gray-500">게시물을 불러오는 중...</span>
        </div>
      </div>
    );
  }
  
  // 오류 표시 (생성 모드에서는 표시하지 않음)
  if (postDetailError && !isCreateMode) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2 text-red-500">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span className="text-lg font-medium">
            {postDetailError.message || '게시물을 불러오는 중 오류가 발생했습니다.'}
          </span>
        </div>
      </div>
    );
  }
  
  // 게시물이 없는 경우 (생성 모드에서는 표시하지 않음)
  if (!postDetail && !isCreateMode) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg font-medium text-gray-500">
          게시물을 찾을 수 없습니다.
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">
            {isCreateMode ? '새 게시물 작성' : '게시물 상세'}
          </h2>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleBackToList}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              목록으로
            </button>
            {!isEditMode && !isCreateMode && (
              <>
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={handleDeletePost}
                  className="px-3 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  삭제
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* 게시물 내용 */}
      <div className="p-6">
        {isEditMode || isCreateMode ? (
          // 수정/생성 폼
          <form onSubmit={handleSubmitEdit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                제목
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                카테고리
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">선택하세요</option>
                <option value="general">일반</option>
                <option value="tech">기술</option>
                <option value="news">뉴스</option>
                <option value="question">질문</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                태그 (쉼표로 구분)
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="예: javascript, react, tutorial"
                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                내용
              </label>
              <textarea
                id="content"
                name="content"
                rows={10}
                value={formData.content}
                onChange={handleInputChange}
                required
                className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublished"
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleCheckboxChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isPublished" className="block ml-2 text-sm font-medium text-gray-700">
                게시 상태
              </label>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isCreateMode ? '게시물 생성' : '저장'}
              </button>
            </div>
          </form>
        ) : (
          // 게시물 상세 보기
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{postDetail?.title}</h1>
              <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                <div>
                  <span className="font-medium">작성자:</span> {postDetail?.author.name}
                </div>
                <div>
                  <span className="font-medium">작성일:</span> {formatDateTime(postDetail?.date || '')}
                </div>
                <div>
                  <span className="font-medium">최종 수정일:</span> {formatDateTime(postDetail?.date || '')}
                </div>
                <div>
                  <span className="font-medium">조회수:</span> {0}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                {postDetail?.category || '카테고리 없음'}
              </div>
              {postDetail?.tags && postDetail.tags.map((tag, index) => (
                <div key={index} className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                  #{tag}
                </div>
              ))}
            </div>
            
            <div className="py-4 border-t border-b border-gray-200">
              <div className="prose max-w-none">
                {postDetail?.content}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="p-4 bg-gray-50 rounded-md">
                <h3 className="text-lg font-medium text-gray-900">게시물 정보</h3>
                <dl className="mt-2 space-y-2">
                  <div className="flex">
                    <dt className="w-32 font-medium text-gray-500">게시 상태:</dt>
                    <dd className="text-gray-900">
                      <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                        게시됨
                      </span>
                    </dd>
                  </div>
                  <div className="flex">
                    <dt className="w-32 font-medium text-gray-500">댓글 수:</dt>
                    <dd className="text-gray-900">{postDetail?.comments || 0}</dd>
                  </div>
                  <div className="flex">
                    <dt className="w-32 font-medium text-gray-500">좋아요 수:</dt>
                    <dd className="text-gray-900">{0}</dd>
                  </div>
                  <div className="flex">
                    <dt className="w-32 font-medium text-gray-500">게시물 ID:</dt>
                    <dd className="text-gray-900">{postDetail?.id}</dd>
                  </div>
                </dl>
              </div>
              
              {postDetail?.editHistory && postDetail.editHistory.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-md">
                  <h3 className="text-lg font-medium text-gray-900">수정 이력</h3>
                  <ul className="mt-2 space-y-2">
                    {postDetail.editHistory.map((edit, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        <span className="font-medium">
                          {edit.editedAt && edit.editedAt.toDate ? formatDate(edit.editedAt.toDate()) : '날짜 없음'}
                        </span> - {edit.editedBy || '관리자'} {edit.reason ? `(${edit.reason})` : '수정'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostDetail; 