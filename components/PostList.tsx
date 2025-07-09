import React, { useState, useEffect, useCallback } from 'react';
import type { UIPost } from '../src/types';
import PostItem from './PostItem';
import { SearchIcon } from './icons';
import { pcColors } from '../src/styles/colors';
import { BORDER_SINGLE, SPECIAL } from '../src/styles/asciiChars';

interface PostListProps {
  posts: UIPost[];
  selectedPost: UIPost | null;
  onSelectPost: (post: UIPost) => void;
  loading?: boolean;
  error?: React.ReactNode;
  searchTerm?: string;
  onSearch?: (term: string) => void;
}

const PostList: React.FC<PostListProps> = ({ 
  posts, 
  selectedPost, 
  onSelectPost, 
  loading, 
  error,
  searchTerm = '',
  onSearch 
}) => {
  const [inputValue, setInputValue] = useState(searchTerm);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 15; // 한 페이지에 표시할 게시물 수 증가 (스크롤 활용)

  // 검색어 입력 핸들러
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    if (onSearch) {
      onSearch(value);
    }
    // 검색 시 첫 페이지로 이동
    setCurrentPage(1);
  };

  // 페이지 변경 시 처리
  useEffect(() => {
    // 게시물 목록이 변경되면 첫 페이지로 이동
    setCurrentPage(1);
  }, [posts.length]);

  // 현재 페이지에 표시할 게시물 계산
  const currentPosts = posts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  // 총 페이지 수 계산
  const totalPages = Math.ceil(posts.length / postsPerPage);

  // 페이지 이동 핸들러
  const handlePageChange = useCallback((pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  }, [totalPages]);

  // 키보드 네비게이션 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        
        if (!selectedPost || currentPosts.length === 0) return;
        
        const currentIndex = currentPosts.findIndex(post => post.id === selectedPost.id);
        
        if (currentIndex === -1) {
          // 현재 선택된 게시물이 목록에 없으면 첫 번째 게시물 선택
          onSelectPost(currentPosts[0]);
          return;
        }
        
        if (e.key === 'ArrowUp' && currentIndex > 0) {
          // 위 화살표: 이전 게시물 선택
          onSelectPost(currentPosts[currentIndex - 1]);
        } else if (e.key === 'ArrowDown' && currentIndex < currentPosts.length - 1) {
          // 아래 화살표: 다음 게시물 선택
          onSelectPost(currentPosts[currentIndex + 1]);
        }
      } else if (e.key === 'PageUp') {
        // Page Up: 이전 페이지로 이동
        handlePageChange(currentPage - 1);
      } else if (e.key === 'PageDown') {
        // Page Down: 다음 페이지로 이동
        handlePageChange(currentPage + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedPost, currentPosts, onSelectPost, currentPage, handlePageChange]);

  // 테이블 헤더 렌더링
  const renderTableHeader = () => (
    <div className="border-b border-pc-border-white px-2 py-1 font-pc" style={{ borderColor: pcColors.border.primary }}>
      <div className="grid grid-cols-12 gap-1 text-pc-text-cyan" style={{ color: pcColors.text.secondary }}>
        <div className="col-span-1 text-center hidden sm:block">번호</div>
        <div className="col-span-12 sm:col-span-6">제목</div>
        <div className="hidden sm:block sm:col-span-2">작성자</div>
        <div className="hidden sm:block sm:col-span-2 text-center">날짜</div>
        <div className="hidden sm:block sm:col-span-1 text-center">조회</div>
      </div>
    </div>
  );

  // 페이지 네비게이션 렌더링
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="border-t border-pc-border-white px-2 py-1 font-pc flex justify-center items-center" 
           style={{ borderColor: pcColors.border.primary }}>
        <button 
          onClick={() => handlePageChange(1)} 
          disabled={currentPage === 1}
          className="px-1 mx-1"
          style={{ color: currentPage === 1 ? pcColors.text.disabled : pcColors.text.secondary }}
        >
          {SPECIAL.leftArrow}{SPECIAL.leftArrow}
        </button>
        <button 
          onClick={() => handlePageChange(currentPage - 1)} 
          disabled={currentPage === 1}
          className="px-1 mx-1"
          style={{ color: currentPage === 1 ? pcColors.text.disabled : pcColors.text.secondary }}
        >
          {SPECIAL.leftArrow}
        </button>
        
        <span className="mx-2 text-pc-text-white" style={{ color: pcColors.text.primary }}>
          {currentPage} / {totalPages}
        </span>
        
        <button 
          onClick={() => handlePageChange(currentPage + 1)} 
          disabled={currentPage === totalPages}
          className="px-1 mx-1"
          style={{ color: currentPage === totalPages ? pcColors.text.disabled : pcColors.text.secondary }}
        >
          {SPECIAL.arrow}
        </button>
        <button 
          onClick={() => handlePageChange(totalPages)} 
          disabled={currentPage === totalPages}
          className="px-1 mx-1"
          style={{ color: currentPage === totalPages ? pcColors.text.disabled : pcColors.text.secondary }}
        >
          {SPECIAL.arrow}{SPECIAL.arrow}
        </button>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col h-full">
      {/* 검색창 */}
      <div className="px-2 py-2 border-b" style={{ borderColor: pcColors.border.primary }}>
        <div className="flex flex-col sm:flex-row sm:items-center">
          <div className="flex items-center mb-2 sm:mb-0 sm:mr-2">
            <span style={{ color: pcColors.text.accent }}>{SPECIAL.arrow}</span>
            <span className="ml-2 font-bold" style={{ color: pcColors.text.accent }}>검색</span>
          </div>
          <div className="flex-grow flex items-center border" 
               style={{ borderColor: pcColors.border.primary, backgroundColor: pcColors.background.secondary }}>
            <input
              type="text"
              value={inputValue}
              onChange={handleSearchInputChange}
              placeholder="검색어 입력..."
              className="w-full py-1 px-2 font-pc border-none outline-none"
              style={{ 
                backgroundColor: pcColors.background.secondary,
                color: pcColors.text.primary,
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && onSearch) {
                  onSearch(inputValue);
                }
              }}
            />
            <button 
              className="px-2 py-1 border-l flex items-center justify-center whitespace-nowrap"
              style={{ 
                borderColor: pcColors.border.primary,
                backgroundColor: pcColors.background.secondary,
                color: pcColors.text.secondary
              }}
              onClick={() => onSearch && onSearch(inputValue)}
              title="검색"
            >
              {SPECIAL.bullet} 검색
            </button>
          </div>
        </div>
        
        {/* 검색 결과 정보 */}
        {inputValue && (
          <div className="mt-1 text-sm" style={{ color: pcColors.text.secondary }}>
            <span className="mr-1">{SPECIAL.bullet}</span>
            <span>
              {posts.length > 0 
                ? `'${inputValue}'에 대한 검색 결과: ${posts.length}개의 게시물` 
                : `'${inputValue}'에 대한 검색 결과가 없습니다.`}
            </span>
          </div>
        )}
      </div>
      
      {/* 게시물 목록 테이블 */}
      {renderTableHeader()}
      
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-pc-text-yellow font-pc animate-pulse" style={{ color: pcColors.text.accent }}>
            로딩 중...
          </div>
        </div>
      ) : error ? (
        <div className="text-center text-pc-text-red p-4 font-pc" style={{ color: pcColors.text.error }}>
          {error}
        </div>
      ) : (
        <div 
          className="flex-grow overflow-y-auto" 
          style={{ 
            scrollbarWidth: 'thin', 
            scrollbarColor: `${pcColors.border.primary} ${pcColors.background.secondary}`,
            msOverflowStyle: 'auto',
            WebkitOverflowScrolling: 'touch',
            maxHeight: 'calc(100% - 80px)' // 검색창, 테이블 헤더, 페이지네이션 영역을 제외한 높이
          }}
        >
          {currentPosts.length > 0 ? (
            <div>
              {currentPosts.map((post) => (
                <PostItem
                  key={post.id}
                  post={post}
                  isSelected={selectedPost && post.id === selectedPost.id}
                  onClick={() => onSelectPost(post)}
                  index={(currentPage - 1) * postsPerPage + currentPosts.indexOf(post) + 1}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-pc-text-cyan p-4 font-pc" style={{ color: pcColors.text.secondary }}>
              {inputValue ? `'${inputValue}'에 대한 검색 결과가 없습니다.` : '게시물이 없습니다.'}
            </div>
          )}
        </div>
      )}
      
      {/* 페이지 네비게이션 */}
      {renderPagination()}
    </div>
  );
};

export default PostList;
