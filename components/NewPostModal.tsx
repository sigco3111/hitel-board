import React, { useState, useEffect, useRef } from 'react';
import type { Category, Post, UIPost } from '../src/types';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { pcColors } from '../src/styles/colors';
import { BORDER_SINGLE, SPECIAL } from '../src/styles/asciiChars';
import TextBox from '../src/components/pc-components/TextBox';

// PC통신 스타일 마크다운 에디터 스타일 오버라이드
import './pc-markdown-override.css';

interface NewPostModalProps {
  categories: Category[];
  onClose: () => void;
  onSave: (newPost: { title: string; category: string; content: string; tags: string[] }) => void;
  postToEdit?: Post | UIPost | null;
  allTags: string[];
  selectedCategory: string | null;
}

/**
 * 게시물 작성 및 수정을 위한 모달 컴포넌트
 * PC통신 스타일의 텍스트 기반 입력 폼을 제공합니다.
 */
const NewPostModal: React.FC<NewPostModalProps> = ({ categories, onClose, onSave, postToEdit, allTags, selectedCategory }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('dark'); // PC통신 스타일은 어두운 배경이므로 dark 모드 기본값
  
  const [tags, setTags] = useState(''); // 태그 상태를 문자열로 변경
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  const isEditing = postToEdit != null;
  
  // 초기화 여부를 추적하는 ref
  const isInitialized = useRef(false);

  // 컴포넌트가 마운트될 때만 초기화 실행
  useEffect(() => {
    // 이미 초기화되었다면 실행하지 않음
    if (isInitialized.current) {
      return;
    }

    try {
      if (isEditing && postToEdit) {
        // 데이터 유효성 확인
        if (!postToEdit.id) {
          console.warn("수정할 게시물의 ID가 없습니다:", postToEdit);
        }
        
        // 안전하게 값 설정 (undefined 체크 추가)
        setTitle(postToEdit.title || '');
        setCategory(postToEdit.category || categories[0]?.id || '');
        
        // content가 undefined인 경우 안전하게 처리
        const postContent = postToEdit.content || '';
        
        try {
          // HTML 태그 제거 (필요한 경우)
          const cleanContent = postContent.replace(/<[^>]+>/g, '');
          setContent(cleanContent);
        } catch (error) {
          console.error("콘텐츠 처리 중 오류:", error);
          setContent(''); // 오류 발생 시 빈 문자열로 설정
        }
        
        // 태그 설정: 배열을 쉼표로 구분된 문자열로 변환
        try {
          setTags(Array.isArray(postToEdit.tags) ? postToEdit.tags.join(', ') : '');
        } catch (error) {
          console.error("태그 처리 중 오류:", error);
          setTags(''); // 오류 발생 시 빈 문자열로 설정
        }
        
        // 디버깅용 로그 (문제 확인용)
        console.log("수정 모드 - 게시물 데이터:", {
          id: postToEdit.id || '[ID 없음]',
          title: postToEdit.title || '[제목 없음]',
          category: postToEdit.category || '[카테고리 없음]',
          contentExists: !!postToEdit.content,
          tagsExists: Array.isArray(postToEdit.tags),
          tagsCount: Array.isArray(postToEdit.tags) ? postToEdit.tags.length : 0
        });
      } else {
        // 새 게시물 작성 폼 초기화
        setTitle('');
        setCategory(selectedCategory || categories[0]?.id || '');
        setContent('');
        setTags(''); // 태그 초기화
      }
      
      // 초기화 완료 표시
      isInitialized.current = true;
    } catch (error) {
      // 최상위 예외 처리
      console.error("게시물 데이터 처리 중 오류가 발생했습니다:", error);
      // 기본값으로 폼 초기화
      setTitle('');
      setCategory(categories[0]?.id || '');
      setContent('');
      setTags('');
      
      // 오류가 발생해도 초기화 완료 표시
      isInitialized.current = true;
    }
  }, []); // 의존성 배열을 비워서 컴포넌트가 마운트될 때만 실행

  // 태그 입력 시 자동 완성 기능
  useEffect(() => {
    if (tags.trim() === '') {
      setTagSuggestions([]);
      setShowTagSuggestions(false);
      return;
    }

    const lastTag = tags.split(',').pop()?.trim() || '';
    if (lastTag.length > 0) {
      const filteredTags = allTags
        .filter(tag => tag.toLowerCase().includes(lastTag.toLowerCase()) && tag.toLowerCase() !== lastTag.toLowerCase())
        .slice(0, 5); // 최대 5개만 표시
      
      setTagSuggestions(filteredTags);
      setShowTagSuggestions(filteredTags.length > 0);
    } else {
      setTagSuggestions([]);
      setShowTagSuggestions(false);
    }
  }, [tags, allTags]);

  const handleTagSelect = (selectedTag: string) => {
    const tagParts = tags.split(',');
    const lastTagIndex = tagParts.length - 1;
    tagParts[lastTagIndex] = ` ${selectedTag}`;
    
    setTags(tagParts.join(','));
    setShowTagSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 필수 필드 유효성 검사
      if (!title.trim() || !category) {
        alert('제목과 카테고리는 필수 입력 항목입니다.');
        return;
      }
      
      // 내용 검증 (빈 문자열 방지)
      const trimmedContent = content.trim();
      if (!trimmedContent) {
        alert('내용을 입력해주세요.');
        return;
      }
      
      // 쉼표로 구분된 태그 문자열을 배열로 변환
      const finalTags = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
      
      // 수정/저장 처리
      onSave({ 
        title: title.trim(), 
        category, 
        content: trimmedContent, 
        tags: finalTags 
      });
      onClose();
    } catch (error) {
      console.error('게시물 저장 중 오류:', error);
      alert('게시물 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 transition-opacity font-pc"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(3px)' }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl m-4 transform transition-all"
        style={{ backgroundColor: pcColors.background.primary, color: pcColors.text.primary }}
        onClick={(e) => e.stopPropagation()}
      >
        <TextBox 
          title={isEditing ? '게시물 수정' : '새 게시물 작성'} 
          borderStyle="double"
          className="w-full"
        >
          <form onSubmit={handleSubmit} className="p-4">
            <div className="space-y-4">
              {/* 제목 입력 */}
              <div>
                <div className="flex mb-1">
                  <span style={{ color: pcColors.text.accent }}>{SPECIAL.arrow}</span>
                  <label htmlFor="title" className="ml-2 font-bold" style={{ color: pcColors.text.accent }}>제목</label>
                </div>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border font-pc"
                  style={{ 
                    backgroundColor: pcColors.background.secondary,
                    color: pcColors.text.primary,
                    borderColor: pcColors.border.primary
                  }}
                  placeholder="게시물 제목"
                  required
                />
              </div>

              {/* 카테고리 선택 */}
              <div>
                <div className="flex mb-1">
                  <span style={{ color: pcColors.text.accent }}>{SPECIAL.arrow}</span>
                  <label htmlFor="category" className="ml-2 font-bold" style={{ color: pcColors.text.accent }}>카테고리</label>
                </div>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 border font-pc"
                  style={{ 
                    backgroundColor: pcColors.background.secondary,
                    color: pcColors.text.primary,
                    borderColor: pcColors.border.primary
                  }}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              {/* 태그 입력 */}
              <div className="relative">
                <div className="flex mb-1">
                  <span style={{ color: pcColors.text.accent }}>{SPECIAL.arrow}</span>
                  <label htmlFor="tags-input" className="ml-2 font-bold" style={{ color: pcColors.text.accent }}>태그</label>
                </div>
                <input
                  id="tags-input"
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full p-2 border font-pc"
                  style={{ 
                    backgroundColor: pcColors.background.secondary,
                    color: pcColors.text.primary,
                    borderColor: pcColors.border.primary
                  }}
                  placeholder="쉼표(,)로 구분하여 태그를 입력하세요."
                />
                
                {/* 태그 자동완성 */}
                {showTagSuggestions && (
                  <div 
                    className="absolute z-10 w-full mt-1 border font-pc"
                    style={{ 
                      backgroundColor: pcColors.background.secondary,
                      borderColor: pcColors.border.primary
                    }}
                  >
                    {tagSuggestions.map((tag, index) => (
                      <div 
                        key={index} 
                        className="p-1 cursor-pointer"
                        style={{ 
                          color: pcColors.text.primary,
                          borderBottom: index < tagSuggestions.length - 1 ? `1px solid ${pcColors.border.primary}` : 'none'
                        }}
                        onClick={() => handleTagSelect(tag)}
                      >
                        {tag}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 내용 입력 */}
              <div>
                <div className="flex mb-1">
                  <span style={{ color: pcColors.text.accent }}>{SPECIAL.arrow}</span>
                  <label htmlFor="content" className="ml-2 font-bold" style={{ color: pcColors.text.accent }}>내용</label>
                </div>
                <div data-color-mode={colorMode} className="w-full pc-markdown-editor">
                  <MDEditor
                    id="content"
                    value={content}
                    onChange={(value) => setContent(value || '')}
                    height={300}
                    preview="edit"
                    className="w-full pc-md-editor"
                  />
                  <div className="mt-1 text-xs" style={{ color: pcColors.text.secondary }}>
                    마크다운 문법을 사용하여 글을 작성할 수 있습니다.
                  </div>
                </div>
              </div>
            </div>
            
            {/* 버튼 영역 */}
            <div className="mt-6 pt-4 border-t flex justify-end space-x-3" style={{ borderColor: pcColors.border.primary }}>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border font-pc"
                style={{ 
                  backgroundColor: pcColors.background.secondary,
                  color: pcColors.text.secondary,
                  borderColor: pcColors.border.primary
                }}
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 border font-pc"
                style={{ 
                  backgroundColor: pcColors.background.secondary,
                  color: pcColors.text.accent,
                  borderColor: pcColors.border.primary
                }}
              >
                {isEditing ? '저장' : '게시'}
              </button>
            </div>
          </form>
        </TextBox>
      </div>
    </div>
  );
};

export default NewPostModal;