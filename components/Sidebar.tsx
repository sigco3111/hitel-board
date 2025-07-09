

import React, { useCallback, useEffect } from 'react';
import type { Category } from '../src/types';
import { HashtagIcon, BookmarkIcon } from './icons';
import { useAuth } from '../src/hooks/useAuth';

interface SidebarProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  onNewPost: () => void;
  allTags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
  showBookmarks?: boolean; // 북마크 필터링 활성화 상태
}

const Sidebar: React.FC<SidebarProps> = ({ 
  categories = [], // 기본값으로 빈 배열 설정 
  selectedCategory, 
  onSelectCategory, 
  onNewPost, 
  allTags = [], // 기본값으로 빈 배열 설정
  selectedTag, 
  onSelectTag,
  showBookmarks = false
}) => {
  // 인증 정보 가져오기
  const { user } = useAuth();
  
  // Selection API 관련 에러 처리를 위한 함수
  const clearSelection = useCallback(() => {
    try {
      // 현재 활성화된 요소에서 포커스 제거
      if (document.activeElement && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      // 텍스트 선택 초기화
      if (window.getSelection) {
        if (window.getSelection()?.empty) {
          window.getSelection()?.empty();
        } else if (window.getSelection()?.removeAllRanges) {
          window.getSelection()?.removeAllRanges();
        }
      }
    } catch (error) {
      console.error("Selection API 에러 처리 중 오류:", error);
    }
  }, []);
  
  // 컴포넌트 마운트/언마운트 시 Selection API 관리
  useEffect(() => {
    return () => {
      clearSelection();
    };
  }, [clearSelection]);
  
  // 북마크 토글 핸들러는 더 이상 필요하지 않으므로 제거
  
  // 카테고리 선택 핸들러 (에러 방지를 위한 처리 추가)
  const handleSelectCategory = useCallback((e: React.MouseEvent, categoryId: string) => {
    e.preventDefault();
    // 선택 초기화
    clearSelection();
    
    // Selection 에러 방지를 위한 비동기 처리
    setTimeout(() => {
      onSelectCategory(categoryId);
    }, 10);
  }, [onSelectCategory, clearSelection]);
  
  // 태그 선택 핸들러 (에러 방지를 위한 처리 추가)
  const handleSelectTag = useCallback((e: React.MouseEvent, tag: string) => {
    e.preventDefault();
    // 선택 초기화
    clearSelection();
    
    // Selection 에러 방지를 위한 비동기 처리
    setTimeout(() => {
      onSelectTag(tag);
    }, 10);
  }, [onSelectTag, clearSelection]);

  // 새 게시물 작성 핸들러
  const handleNewPost = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    // 선택 초기화
    clearSelection();
    
    // Selection 에러 방지를 위한 비동기 처리
    setTimeout(() => {
      onNewPost();
    }, 10);
  }, [onNewPost, clearSelection]);

  // categories와 allTags의 안전한 처리를 위한 확인
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeAllTags = Array.isArray(allTags) ? allTags : [];

  return (
    <div className="w-60 flex-shrink-0 bg-slate-100/80 p-3 flex flex-col h-full backdrop-blur-md border-r border-slate-200">
      {/* 북마크 토글 버튼 제거 */}

      <div className="text-xs font-semibold text-slate-500 px-3 pt-4 pb-2">카테고리</div>
      <nav>
        <ul>
          {safeCategories.map((category) => (
            <li key={category.id}>
              <button
                onClick={(e) => handleSelectCategory(e, category.id)}
                className={`w-full flex items-center space-x-3 text-sm font-medium p-2 rounded-md transition-colors duration-150 ${
                  selectedCategory === category.id && !selectedTag
                    ? 'bg-blue-500 text-white shadow'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span className={selectedCategory === category.id && !selectedTag ? 'text-white' : 'text-slate-500'}>
                  {category.icon}
                </span>
                <span>{category.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="text-xs font-semibold text-slate-500 px-3 pt-6 pb-2">태그</div>
      <nav className="flex-grow overflow-y-auto">
         <ul className="space-y-1">
          {safeAllTags.map((tag) => (
            <li key={tag}>
              <button
                onClick={(e) => handleSelectTag(e, tag)}
                className={`w-full flex items-center space-x-3 text-sm p-2 rounded-md transition-colors duration-150 ${
                  selectedTag === tag
                    ? 'bg-blue-500 text-white shadow'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                <HashtagIcon className={`w-4 h-4 flex-shrink-0 ${selectedTag === tag ? 'text-white/80' : 'text-slate-500'}`} />
                <span className="font-medium truncate">{tag}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto pt-4">
         <button onClick={handleNewPost} className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium text-sm py-2 px-4 rounded-lg transition-colors duration-150">
            새 게시물 작성
          </button>
      </div>
    </div>
  );
};

export default Sidebar;