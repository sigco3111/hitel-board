/**
 * 관리자 게시물 필터링 컴포넌트
 * 카테고리, 태그, 검색어, 날짜 범위 등으로 게시물을 필터링하는 기능을 제공합니다.
 */
import React, { useState, useCallback, useEffect } from 'react';

interface PostFilterBarProps {
  filters: {
    category: string;
    tag: string;
    searchTerm: string;
    startDate: string;
    endDate: string;
    sortField: string;
    sortOrder: 'asc' | 'desc';
  };
  onFilterChange: (filters: Partial<PostFilterBarProps['filters']>) => void;
  onRefresh: () => void;
}

// 카테고리 목록 (실제로는 API에서 가져올 수 있음)
const CATEGORIES = [
  { id: '', name: '전체' },
  { id: 'general', name: '일반' },
  { id: 'tech', name: '기술' },
  { id: 'news', name: '뉴스' },
  { id: 'question', name: '질문' },
];

/**
 * 관리자 게시물 필터링 컴포넌트
 */
const PostFilterBar: React.FC<PostFilterBarProps> = ({ 
  filters, 
  onFilterChange, 
  onRefresh 
}) => {
  // 로컬 필터 상태 (폼 제출 전까지 변경 사항 저장)
  const [localFilters, setLocalFilters] = useState(filters);
  
  // 필터 변경 시 로컬 상태 업데이트
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // 입력 필드 변경 핸들러
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLocalFilters(prev => ({ ...prev, [name]: value }));
  }, []);

  // 필터 적용 핸들러
  const handleApplyFilters = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange(localFilters);
  }, [localFilters, onFilterChange]);

  // 필터 초기화 핸들러
  const handleResetFilters = useCallback(() => {
    const resetFilters = {
      category: '',
      tag: '',
      searchTerm: '',
      startDate: '',
      endDate: '',
      sortField: 'createdAt',
      sortOrder: 'desc' as const
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  }, [onFilterChange]);

  return (
    <div className="p-4 bg-white border-b border-gray-200">
      <form onSubmit={handleApplyFilters} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* 카테고리 필터 */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              카테고리
            </label>
            <select
              id="category"
              name="category"
              value={localFilters.category}
              onChange={handleInputChange}
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {CATEGORIES.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* 태그 필터 */}
          <div>
            <label htmlFor="tag" className="block text-sm font-medium text-gray-700">
              태그
            </label>
            <input
              type="text"
              id="tag"
              name="tag"
              value={localFilters.tag}
              onChange={handleInputChange}
              placeholder="태그 입력"
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* 검색어 필터 */}
          <div>
            <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700">
              검색어
            </label>
            <input
              type="text"
              id="searchTerm"
              name="searchTerm"
              value={localFilters.searchTerm}
              onChange={handleInputChange}
              placeholder="제목, 내용, 작성자"
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* 날짜 범위 필터 (시작) */}
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              시작 날짜
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={localFilters.startDate}
              onChange={handleInputChange}
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* 날짜 범위 필터 (종료) */}
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              종료 날짜
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={localFilters.endDate}
              onChange={handleInputChange}
              className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            초기화
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            새로고침
          </button>
          <button
            type="submit"
            className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            필터 적용
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostFilterBar; 