import React, { useState, useEffect } from 'react';
import type { Category, Post, UIPost } from '../src/types';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

interface NewPostModalProps {
  categories: Category[];
  onClose: () => void;
  onSave: (newPost: { title: string; category: string; content: string; tags: string[] }) => void;
  postToEdit?: Post | UIPost | null;
  allTags: string[];
  selectedCategory: string | null;
}

const NewPostModal: React.FC<NewPostModalProps> = ({ categories, onClose, onSave, postToEdit, allTags, selectedCategory }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');
  
  const [tags, setTags] = useState(''); // 태그 상태를 문자열로 변경

  const isEditing = postToEdit != null;

  useEffect(() => {
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
    } catch (error) {
      // 최상위 예외 처리
      console.error("게시물 데이터 처리 중 오류가 발생했습니다:", error);
      // 기본값으로 폼 초기화
      setTitle('');
      setCategory(categories[0]?.id || '');
      setContent('');
      setTags('');
    }
  }, [postToEdit, isEditing, categories, selectedCategory]);

  // 시스템 다크 모드 감지
  useEffect(() => {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setColorMode(isDarkMode ? 'dark' : 'light');

    // 시스템 다크 모드 변경 감지 이벤트 리스너
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setColorMode(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl m-4 transform transition-all" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800">{isEditing ? '게시물 수정' : '새 게시물 작성'}</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">제목</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="게시물 제목"
                required
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">카테고리</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            {/* TAGS SECTION */}
            <div>
              <label htmlFor="tags-input" className="block text-sm font-medium text-slate-700 mb-1">태그</label>
              <input
                id="tags-input"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="쉼표(,)로 구분하여 태그를 입력하세요."
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-1">내용</label>
              <div data-color-mode={colorMode} className="w-full">
                <MDEditor
                  id="content"
                  value={content}
                  onChange={(value) => setContent(value || '')}
                  height={300}
                  preview="edit"
                  className="w-full"
                />
                <div className="mt-1 text-xs text-slate-500">
                  마크다운 문법을 사용하여 글을 작성할 수 있습니다.
                </div>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 px-6 py-4 flex justify-end space-x-3 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isEditing ? '저장' : '게시'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPostModal;