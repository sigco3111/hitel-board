

import React, { useCallback, useEffect } from 'react';
import type { Category } from '../src/types';
import { HashtagIcon } from './icons';
import { useAuth } from '../src/hooks/useAuth';
// PC통신 스타일 컴포넌트 및 스타일 임포트
import PCMenu, { MenuItem } from '../src/components/pc-components/PCMenu';
import TextBox from '../src/components/pc-components/TextBox';
import { pcColors } from '../src/styles/colors';
import { SPECIAL } from '../src/styles/asciiChars';

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

/**
 * 사이드바 컴포넌트
 * PC통신 스타일의 카테고리 및 태그 메뉴를 제공합니다.
 */
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
  
  // 카테고리 선택 핸들러 (에러 방지를 위한 처리 추가)
  const handleSelectCategory = useCallback((categoryId: string) => {
    // 선택 초기화
    clearSelection();
    
    // Selection 에러 방지를 위한 비동기 처리
    setTimeout(() => {
      onSelectCategory(categoryId);
      // 태그 선택 해제
      if (selectedTag) {
        onSelectTag(null);
      }
    }, 10);
  }, [onSelectCategory, clearSelection, selectedTag, onSelectTag]);
  
  // 태그 선택 핸들러 (에러 방지를 위한 처리 추가)
  const handleSelectTag = useCallback((tag: string | null) => {
    // 선택 초기화
    clearSelection();
    
    // Selection 에러 방지를 위한 비동기 처리
    setTimeout(() => {
      onSelectTag(tag);
    }, 10);
  }, [onSelectTag, clearSelection]);

  // 새 게시물 작성 핸들러
  const handleNewPost = useCallback(() => {
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

  // 카테고리 메뉴 아이템 생성
  const categoryMenuItems: MenuItem[] = safeCategories.map(category => ({
    id: category.id,
    label: category.name,
    shortcut: category.id === selectedCategory ? SPECIAL.arrow : (category.icon || ''),
    onClick: () => handleSelectCategory(category.id)
  }));

  // 태그 메뉴 아이템 생성 (태그가 많을 경우 성능 고려)
  const tagMenuItems: MenuItem[] = safeAllTags.slice(0, 50).map(tag => ({
    id: tag,
    label: tag,
    shortcut: tag === selectedTag ? SPECIAL.arrow : '#',
    onClick: () => handleSelectTag(tag)
  }));

  // 태그 클리어 버튼 (태그가 선택된 경우에만 표시)
  const handleClearTag = () => {
    handleSelectTag(null);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 카테고리 섹션 */}
      <div className="mb-4 pb-2 border-b" style={{ borderColor: pcColors.border.primary }}>
        <div className="mb-2 font-bold text-pc-text-yellow" style={{ color: pcColors.text.accent }}>
          {SPECIAL.bullet} 카테고리
        </div>
        <div className="flex flex-wrap md:flex-col gap-1">
          {categories.map(category => (
            <div
              key={category.id}
              className={`
                py-1 px-2 cursor-pointer flex items-center
                ${selectedCategory === category.id ? 'bg-pc-selection-bg text-pc-selection-text' : ''}
              `}
              onClick={() => onSelectCategory(category.id)}
              style={{
                color: selectedCategory === category.id ? pcColors.selection.text : pcColors.text.primary,
                backgroundColor: selectedCategory === category.id ? pcColors.selection.background : 'transparent',
              }}
            >
              <span className="inline-block w-4 mr-1">
                {selectedCategory === category.id ? SPECIAL.arrow : ' '}
              </span>
              <span>{category.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 태그 섹션 */}
      <div className="mb-4 pb-2 border-b overflow-y-auto" style={{ borderColor: pcColors.border.primary }}>
        <div className="mb-2 font-bold text-pc-text-yellow" style={{ color: pcColors.text.accent }}>
          {SPECIAL.bullet} 태그
        </div>
        <div className="flex flex-wrap md:flex-col gap-1">
          {allTags.length > 0 ? (
            <>
              {/* 태그 초기화 버튼 */}
              {selectedTag && (
                <div 
                  className="py-1 px-2 cursor-pointer text-pc-text-cyan"
                  onClick={() => handleSelectTag(null)}
                  style={{ color: pcColors.text.secondary }}
                >
                  {SPECIAL.bullet} 태그 필터 초기화
                </div>
              )}
              
              {/* 태그 목록 */}
              {allTags.map(tag => (
                <div 
                  key={tag}
                  className={`
                    py-1 px-2 cursor-pointer flex items-center
                    ${selectedTag === tag ? 'bg-pc-selection-bg text-pc-selection-text' : ''}
                  `}
                  onClick={() => handleSelectTag(tag)}
                  style={{
                    color: selectedTag === tag ? pcColors.selection.text : pcColors.text.primary,
                    backgroundColor: selectedTag === tag ? pcColors.selection.background : 'transparent',
                  }}
                >
                  <span className="inline-block w-4 mr-1">
                    {selectedTag === tag ? SPECIAL.arrow : ' '}
                  </span>
                  <span>{tag}</span>
                </div>
              ))}
            </>
          ) : (
            <div className="text-pc-text-gray" style={{ color: pcColors.text.disabled }}>
              태그가 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* 새 게시물 작성 버튼 */}
      <div className="mt-2">
        <button 
          onClick={handleNewPost} 
          className="w-full py-1 px-2 border font-pc text-center"
          style={{ 
            borderColor: pcColors.border.primary,
            color: pcColors.text.accent,
            backgroundColor: pcColors.background.secondary
          }}
        >
          {SPECIAL.star} 새 게시물 작성 {SPECIAL.star}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;