

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
    }, 10);
  }, [onSelectCategory, clearSelection]);
  
  // 태그 선택 핸들러 (에러 방지를 위한 처리 추가)
  const handleSelectTag = useCallback((tag: string) => {
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
    shortcut: category.icon || '',
    onClick: () => handleSelectCategory(category.id)
  }));

  // 태그 메뉴 아이템 생성
  const tagMenuItems: MenuItem[] = safeAllTags.map(tag => ({
    id: tag,
    label: tag,
    shortcut: '#',
    onClick: () => handleSelectTag(tag)
  }));

  return (
    <div className="flex flex-col h-full p-1 overflow-hidden">
      {/* 카테고리 메뉴 */}
      <div className="mb-2">
        <PCMenu 
          title="카테고리" 
          items={categoryMenuItems}
          selectedId={selectedTag ? '' : selectedCategory}
          borderStyle="single"
          width="100%"
        />
      </div>
      
      {/* 태그 메뉴 */}
      <div className="flex-grow overflow-hidden">
        <TextBox title="태그" borderStyle="single" className="h-full overflow-auto">
          <div className="flex flex-col">
            {safeAllTags.map((tag) => (
              <div 
                key={tag}
                className={`
                  py-1 px-2 cursor-pointer font-pc flex items-center
                  ${selectedTag === tag ? 'bg-pc-selection-bg text-pc-selection-text' : ''}
                  hover:text-pc-text-yellow
                `}
                onClick={() => handleSelectTag(tag)}
                style={{
                  color: selectedTag === tag ? pcColors.selection.text : pcColors.text.primary,
                  backgroundColor: selectedTag === tag ? pcColors.selection.background : 'transparent',
                }}
              >
                <span className="inline-block w-4 text-center mr-2">
                  {selectedTag === tag ? SPECIAL.arrow : '#'}
                </span>
                <span className="truncate">{tag}</span>
              </div>
            ))}
          </div>
        </TextBox>
      </div>

      {/* 새 게시물 작성 버튼 */}
      <div className="mt-2">
        <button 
          onClick={handleNewPost} 
          className="w-full py-1 px-2 border border-pc-border-white text-pc-text-yellow font-pc text-center"
          style={{ 
            borderColor: pcColors.border.primary,
            color: pcColors.text.accent
          }}
        >
          {SPECIAL.star} 새 게시물 작성 {SPECIAL.star}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;