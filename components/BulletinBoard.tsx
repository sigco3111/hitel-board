import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { Post, UIPost, Category, Menu, MenuItem, User } from '../src/types';
import Sidebar from './Sidebar';
import PostList from './PostList';
import PostDetail from './PostDetail';
import TrafficLights from './TrafficLights';
import NewPostModal from './NewPostModal';
import WindowMenuBar from './WindowMenuBar';
import ConfirmationModal from './ConfirmationModal';
import Toast from './Toast';
import { FolderIcon, MessagesSquareIcon, TagIcon, BookmarkIcon } from './icons';
import { usePosts } from '../src/hooks/usePosts.tsx';
import { useBookmarks } from '../src/hooks/useBookmarks';
import { deletePost, updatePost, createPost, movePost } from '../src/services/firebase/firestore';
import { Timestamp } from 'firebase/firestore';

// 기본 카테고리 데이터 (Firestore 로드 전에 임시로 사용)
const defaultCategories: Category[] = [
  { id: 'all', name: '모든 게시물', icon: <MessagesSquareIcon /> }
];

interface BulletinBoardProps {
    onClose: () => void;
    user: User;
    initialShowBookmarks?: boolean;
}

const BulletinBoard: React.FC<BulletinBoardProps> = ({ onClose, user, initialShowBookmarks = false }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showBookmarks, setShowBookmarks] = useState<boolean>(initialShowBookmarks);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<UIPost | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  
  // 모바일 상세 뷰 상태 추가
  const [isMobileDetailView, setIsMobileDetailView] = useState(false);
  
  // 토스트 메시지 상태 추가
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    visible: boolean;
  }>({
    message: '',
    type: 'success',
    visible: false
  });

  // 데이터 로딩을 usePosts 훅에 위임
  const {
    posts: fetchedPosts,
    loading: postsLoading,
    error: postsError,
    categories,
    categoriesLoading,
    allTags, // This is the correct 'allTags' from the hook
    refresh: refreshPosts,
  } = usePosts({
    category: selectedCategory, // 'all'을 그대로 전달
    tag: selectedTag || undefined,
  });

  // 토스트 메시지 표시 함수
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({
      message,
      type,
      visible: true
    });
  }, []);

  // 토스트 메시지 닫기 함수
  const closeToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  // Selection API 관련 에러 처리를 위한 함수
  const clearSelection = useCallback(() => {
    try {
      // 현재 활성화된 요소에서 포커스 제거
      if (document.activeElement && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      // 텍스트 선택 초기화 - 다양한 브라우저 지원
      const selection = window.getSelection();
      if (selection) {
        if (typeof selection.empty === 'function') {
          // Chrome, Safari
          selection.empty();
        } else if (typeof selection.removeAllRanges === 'function') {
          // Firefox
          selection.removeAllRanges();
        }
        // IE 지원 코드 제거 (더 이상 필요하지 않음)
      }
      
      // 현재 활성 요소가 있다면 블러 처리
      document.activeElement instanceof HTMLElement && document.activeElement.blur();
      
    } catch (error) {
      // 에러가 발생해도 앱 실행에 영향을 주지 않도록 함
      console.error("Selection API 에러 처리 중 오류:", error);
    }
  }, []);
  
  // 컴포넌트 마운트/언마운트 시 Selection API 관리 강화
  useEffect(() => {
    // 컴포넌트 마운트 시 Selection API 초기화 강화
    const disableSelection = () => {
      try {
        // document selection 비활성화
        document.onselectstart = () => false;
        
        // 표준 CSS 속성 사용
        document.body.style.userSelect = 'none';
        
        clearSelection();
      } catch (error) {
        console.error("Selection 비활성화 중 오류:", error);
      }
    };
    
    const enableSelection = () => {
      try {
        // document selection 활성화 복원
        document.onselectstart = null;
        
        // 표준 CSS 속성 사용
        document.body.style.userSelect = '';
      } catch (error) {
        console.error("Selection 활성화 중 오류:", error);
      }
    };
    
    // 마운트 시 실행
    disableSelection();
    
    // 언마운트 시 원상복구
    return enableSelection;
  }, [clearSelection]);

  // 북마크 관련 기능 가져오기
  const { 
    bookmarkedPosts, 
    loading: bookmarkLoading, 
    error: bookmarkError,
    refresh: refreshBookmarks
  } = useBookmarks(user?.uid);
  
  // 게시물 선택 및 상세 표시 관련 상태 및 함수
  const [selectedPost, setSelectedPost] = useState<UIPost | null>(null);
  const handleSelectPost = useCallback((post: UIPost) => {
    console.log('게시물 선택됨:', post.id, post.title);
    setSelectedPost(post);
    // 모바일에서는 상세 페이지로 전환
    if (window.innerWidth < 768) {
      setIsMobileDetailView(true);
    }
  }, []);

  // 선택된 게시물 초기화
  const handleDeselectPost = useCallback(() => {
    setSelectedPost(null);
    setIsMobileDetailView(false);
  }, []);
  
  // 로딩 및 에러 상태 통합
  const loading = showBookmarks ? bookmarkLoading : postsLoading;
  const error = showBookmarks ? bookmarkError : postsError;
  
  // 에러 메시지 상태 추가
  const errorMessage = useMemo(() => {
    if (!error) return null;
    return typeof error.message === 'string' ? error.message : '오류가 발생했습니다';
  }, [error]);

  // 표시할 게시물 결정
  const posts = useMemo(() => {
    let result;
    
    if (showBookmarks) {
      result = bookmarkedPosts;
      
      // 북마크 모드에서 카테고리 필터링
      if (selectedCategory !== 'all') {
        result = result.filter(post => post.category === selectedCategory);
      }
      
      // 북마크 모드에서 태그 필터링
      if (selectedTag) {
        result = result.filter(post => post.tags && post.tags.includes(selectedTag));
      }
    } else {
      result = fetchedPosts;
    }
    
    return result;
  }, [showBookmarks, bookmarkedPosts, fetchedPosts, selectedCategory, selectedTag]);

  // 검색 필터링 처리
  const filteredPosts = useMemo(() => {
    if (!searchTerm.trim()) {
      return posts;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return posts.filter(post => 
      post.title.toLowerCase().includes(lowerSearchTerm) || 
      post.content.toLowerCase().includes(lowerSearchTerm) ||
      (post.tags && post.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)))
    );
  }, [posts, searchTerm]);

  // 게시물 데이터가 로드되면 첫 번째 게시물을 자동으로 선택
  useEffect(() => {
    if (!loading && filteredPosts.length > 0 && !selectedPost) {
      setSelectedPost(filteredPosts[0]);
    } else if (!loading && filteredPosts.length === 0) {
      setSelectedPost(null);
    } else if (selectedPost && !filteredPosts.some(p => p.id === selectedPost.id) && filteredPosts.length > 0) {
      // 선택된 게시물이 필터링된 목록에 없으면 첫 번째 게시물 선택
      setSelectedPost(filteredPosts[0]);
    }
  }, [loading, filteredPosts, selectedPost]);

  // 초기 북마크 설정
  useEffect(() => {
    if (initialShowBookmarks) {
      // 선택 초기화
      clearSelection();
      
      // 안전한 상태 전환을 위해 단계적으로 처리
      setTimeout(() => {
        // 먼저 카테고리와 태그 초기화
        setSelectedCategory('all');
        setSelectedTag(null);
        
        // 약간의 지연 후 북마크 모드 활성화
        setTimeout(() => {
          setShowBookmarks(true);
          // 북마크 데이터 새로고침 (최신 상태 유지)
          refreshBookmarks();
        }, 50);
      }, 10);
    }
  }, [initialShowBookmarks, refreshBookmarks, clearSelection]);
  
  // 컴포넌트 재랜더링 시에도 북마크 설정이 유지되도록 추가
  useEffect(() => {
    // 컴포넌트 마운트 시 북마크 모드 상태 동기화
    setShowBookmarks(initialShowBookmarks);
    
    if (initialShowBookmarks) {
      // 북마크 데이터 로드
      refreshBookmarks();
    }
  }, [initialShowBookmarks, refreshBookmarks]);

  // Selection API 에러 방지를 위한 전역 이벤트 리스너 설정
  useEffect(() => {
    // mousedown 이벤트 발생 시 Selection 초기화
    const handleMouseDown = () => {
      clearSelection();
    };

    // 전체 문서에 이벤트 리스너 등록
    document.addEventListener('mousedown', handleMouseDown);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [clearSelection]);

  // 북마크된 게시물에서 사용된 카테고리 추출
  const bookmarkedCategories = useMemo(() => {
    // 기본 카테고리가 있는지 확인
    const defaultAllCategory: Category = { 
      id: 'all', 
      name: '모든 게시물', 
      icon: '📄' // 아이콘을 string으로 변경
    };
    
    // 카테고리가 없거나 로드 중일 때는 기본 카테고리만 반환
    if (!Array.isArray(categories) || categories.length === 0) {
      console.log('카테고리가 로드되지 않았습니다. 기본 카테고리를 사용합니다.');
      return [defaultAllCategory];
    }

    // 북마크 모드가 아니면 전체 카테고리 반환
    if (!showBookmarks) {
      return categories;
    }
    
    // 안전성 검사 추가
    if (!Array.isArray(bookmarkedPosts)) {
      console.error('bookmarkedPosts가 배열이 아닙니다:', bookmarkedPosts);
      return categories;
    }
    
    // 북마크된 게시물에서 사용된 카테고리 ID 추출
    const categoryIds = new Set<string>();
    bookmarkedPosts.forEach(post => {
      if (post && post.category) {
        categoryIds.add(post.category);
      }
    });
    
    // 필터링된 카테고리 목록 생성
    const firstCategory = categories[0] || defaultAllCategory;
    const filteredCategories = [
      firstCategory, // '모든 게시물' 카테고리
      ...categories.slice(1).filter(category => 
        category && 
        category.id && 
        categoryIds.has(category.id)
      )
    ];
    
    return filteredCategories;
  }, [showBookmarks, bookmarkedPosts, categories]);

  // 현재 선택된 카테고리에서 사용 가능한 태그 목록 추출
  const availableTags = useMemo(() => {
    if (selectedCategory === 'all') {
      return allTags;
    }
    
    const tagsInCategory = new Set<string>();
    const postsInCategory = posts.filter(post => post.category === selectedCategory);
    
    postsInCategory.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          if (tag) {
            tagsInCategory.add(tag);
          }
        });
      }
    });
    
    // 한글 로케일 기준으로 가나다순 정렬
    return Array.from(tagsInCategory).sort((a, b) => a.localeCompare(b, 'ko'));
  }, [posts, selectedCategory, allTags]);
  
  // 사이드바에 표시할 카테고리 (북마크 모드에 따라 다름)
  const sidebarCategories = useMemo(() => {
    return showBookmarks ? bookmarkedCategories : categories;
  }, [showBookmarks, bookmarkedCategories, categories]);

  // Window management state
  const windowRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const minSize = { width: 720, height: 500 };
  const [size, setSize] = useState({ width: 1178, height: 845 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0, mouseX: 0, mouseY: 0 });
  const [startResize, setStartResize] = useState({ width: 0, height: 0, mouseX: 0, mouseY: 0 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [preMaximizeState, setPreMaximizeState] = useState<{ size: { width: number; height: number }; position: { x: number; y: number } } | null>(null);

  // 창 위치 초기화
  useEffect(() => {
    const MENU_BAR_HEIGHT = 28; // Corresponds to h-7 in TailwindCSS
    const availableHeight = window.innerHeight - MENU_BAR_HEIGHT;
    
    const initialX = Math.max(0, (window.innerWidth - size.width) / 2);
    // Center vertically in the space below the menu bar
    const initialY = MENU_BAR_HEIGHT + Math.max(0, (availableHeight - size.height) / 2);
    
    setPosition({ x: initialX, y: initialY });
  }, []);

  // 창 최대화 처리
  const handleToggleMaximize = useCallback(() => {
    const MENU_BAR_HEIGHT = 28; // Corresponds to h-7 in TailwindCSS
    if (isMaximized) {
      if (preMaximizeState) {
        setSize(preMaximizeState.size);
        setPosition(preMaximizeState.position);
        setPreMaximizeState(null);
      }
      setIsMaximized(false);
    } else {
      setPreMaximizeState({ size, position });
      setSize({ width: window.innerWidth, height: window.innerHeight - MENU_BAR_HEIGHT });
      setPosition({ x: 0, y: MENU_BAR_HEIGHT });
      setIsMaximized(true);
    }
  }, [isMaximized, preMaximizeState, size, position]);

  // 창 최소화 처리
  const handleMinimize = useCallback(() => {
    if (isMaximized) {
      if (preMaximizeState) {
        setSize(preMaximizeState.size);
        setPosition(preMaximizeState.position);
        setPreMaximizeState(null);
      }
      setIsMaximized(false);
    }
  }, [isMaximized, preMaximizeState]);
  
  // 창 드래그 시작 처리
  const handleDragStart = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (isMaximized || (e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[data-menu-bar]')) {
      return;
    }
    e.preventDefault();
    setIsDragging(true);
    setStartPosition({ x: position.x, y: position.y, mouseX: e.clientX, mouseY: e.clientY });
  }, [isMaximized, position]);

  // 창 크기 조절 시작 처리
  const handleResizeStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isMaximized) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setStartResize({ width: size.width, height: size.height, mouseX: e.clientX, mouseY: e.clientY });
  }, [isMaximized, size]);

  // 마우스 이동 및 마우스 업 이벤트 처리
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - startPosition.mouseX;
        const dy = e.clientY - startPosition.mouseY;
        setPosition({ x: startPosition.x + dx, y: startPosition.y + dy });
      }
      if (isResizing) {
        const newWidth = startResize.width + (e.clientX - startResize.mouseX);
        const newHeight = startResize.height + (e.clientY - startResize.mouseY);
        setSize({ width: Math.max(minSize.width, newWidth), height: Math.max(minSize.height, newHeight) });
      }
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp, { once: true });
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, startPosition, startResize, minSize]);
  
  // 카테고리 선택 처리
  const handleSelectCategory = useCallback((categoryId: string) => {
    console.log('카테고리 선택:', categoryId);
    
    // 선택 초기화
    clearSelection();
    
    // 현재 북마크 모드 유지하면서 카테고리 변경
    setTimeout(() => {
      setSelectedCategory(categoryId);
      setSelectedTag(null); // 태그 선택 초기화
      setSelectedPost(null); // 선택된 게시물 초기화
      
      // 북마크 모드일 때 북마크 데이터 새로고침
      if (showBookmarks) {
        refreshBookmarks();
      } else {
        // 일반 모드일 때 해당 카테고리 게시물 로드
        refreshPosts();
      }
    }, 20);
  }, [showBookmarks, clearSelection, refreshBookmarks, refreshPosts]);

  // 태그 선택 처리
  const handleSelectTag = useCallback((tag: string | null) => {
    console.log('태그 선택:', tag);
    
    // 선택 초기화
    clearSelection();
    
    // 북마크 모드 유지하면서 태그 변경
    setTimeout(() => {
      setSelectedTag(tag); // 태그 선택 또는 해제
      setSelectedPost(null); // 선택된 게시물 초기화
      
      // 태그만 필터링할 때는 전체 카테고리로 설정
      if (tag) {
        setSelectedCategory('all');
      }
      
      // 북마크 모드일 때 북마크 데이터 새로고침
      if (showBookmarks) {
        refreshBookmarks();
      } else {
        // 일반 모드일 때 해당 태그 게시물 로드
        refreshPosts();
      }
    }, 20);
  }, [showBookmarks, clearSelection, refreshBookmarks, refreshPosts]);

  // 게시물 작성 및 수정 관련 함수
  const handleOpenNewPost = useCallback(() => {
    // 게스트 사용자 확인 및 접근 제한
    if (user?.isAnonymous) {
      showToast('게스트는 게시물을 작성할 수 없습니다. 로그인 후 이용해주세요.', 'error');
      return;
    }
    
    setPostToEdit(null);
    setIsModalOpen(true);
  }, [user?.isAnonymous, showToast]);

  const handleOpenEditModal = useCallback((postParam?: UIPost) => {
    // 게스트 사용자 확인 및 접근 제한
    if (user?.isAnonymous) {
      showToast('게스트는 게시물을 수정할 수 없습니다. 로그인 후 이용해주세요.', 'error');
      return;
    }
    
    // 파라미터로 전달된 게시물이 있으면 그것을 사용하고,
    // 없으면 현재 선택된 게시물(selectedPost)을 사용함
    const post = postParam || selectedPost;
    
    if (!post) {
      showToast('수정할 게시물을 먼저 선택해주세요.', 'error');
      return;
    }
    
    try {
      // 디버그 로그 추가
      console.log("수정할 게시물:", post.id, post.title);
      
      // 수정할 게시물 데이터 설정 - 모든 필드에 대해 null/undefined 체크 추가
      const safePostData = {
        ...post,
        id: post.id || '', // ID는 필수
        title: post.title || '',
        content: post.content || '',
        category: post.category || '',
        tags: post.tags || [],
        author: post.author || { name: '알 수 없음' },
        authorId: post.authorId || '',
      };
      
      // 유효성 검증 (필수 필드 확인)
      if (!safePostData.id) {
        throw new Error('게시물 ID가 유효하지 않습니다.');
      }
      
      setPostToEdit(safePostData);
      setIsModalOpen(true);
    } catch (error) {
      console.error("게시물 수정 준비 중 오류:", error);
      showToast('게시물 수정을 위한 데이터 준비 중 오류가 발생했습니다.', 'error');
    }
  }, [selectedPost, showToast, user?.isAnonymous]);

  const handleSavePost = useCallback(async (postData: { title: string; category: string; content: string; tags: string[] }) => {
    try {
      if (postToEdit) {
        // postToEdit이 유효한지 확인
        if (!postToEdit.id) {
          throw new Error("유효하지 않은 게시물 ID입니다.");
        }
        
        // 게스트 사용자가 게시물을 수정하려는 경우 차단
        if (user?.isAnonymous) {
          showToast('게스트는 게시물을 수정할 수 없습니다. 로그인 후 이용해주세요.', 'error');
          return;
        }
        
        // 디버그 로그 추가
        console.log("게시물 수정 시도:", {
          id: postToEdit.id,
          title: postData.title,
          category: postData.category,
          tagsCount: postData.tags?.length || 0,
        });
        
        // updatePost 호출 시 필요한 최소 데이터만 전달
        await updatePost(postToEdit.id, {
          title: postData.title,
          category: postData.category,
          content: postData.content || '',  // null/undefined 체크
          tags: Array.isArray(postData.tags) ? postData.tags : [],  // 배열 타입 확인
          updatedAt: Timestamp.now(),
        }, user?.uid);
        
        showToast('게시물이 수정되었습니다.', 'success');
        
        // 모달 닫기
        setIsModalOpen(false);
        setPostToEdit(null); // 수정 데이터 초기화
        
        // 데이터 새로고침 및 상태 업데이트 순서 조정
        try {
          console.log("게시물 수정 후 데이터 새로고침 시작");
          // 먼저 게시물 목록 새로고침
          const refreshedPosts = await refreshPosts();
          // 북마크 목록도 새로고침
          await refreshBookmarks();
          
          // 새로 고침된 posts에서 현재 선택된 게시물 찾기
          if (refreshedPosts) {
            const updatedSelectedPost = refreshedPosts.find(post => post.id === postToEdit.id);
            if (updatedSelectedPost) {
              console.log("수정된 게시물을 찾아 상세 화면 업데이트:", updatedSelectedPost.title);
              setSelectedPost(updatedSelectedPost);
            } else {
              // 게시물을 직접 조회하여 최신 데이터 가져오기
              const { fetchPostById } = await import('../src/services/firebase/firestore');
              const updatedPost = await fetchPostById(postToEdit.id.toString());
              
              if (updatedPost) {
                console.log("직접 조회로 게시물 정보 갱신:", updatedPost.title);
                setSelectedPost(updatedPost);
              }
            }
          }
        } catch (refreshError) {
          console.error("데이터 새로고침 및 게시물 정보 갱신 중 오류:", refreshError);
        }
      } else {
        // 새 게시물 작성
        if (!user) {
          showToast('로그인이 필요합니다.', 'error');
          return;
        }
        
        // 게스트 사용자가 새 게시물을 작성하려는 경우 차단
        if (user.isAnonymous) {
          showToast('게스트는 게시물을 작성할 수 없습니다. 로그인 후 이용해주세요.', 'error');
          return;
        }
        
        const newPost: Partial<Post> = {
          ...postData,
          author: {
            name: user.displayName || 'Anonymous',
          },
          authorId: user.uid,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          commentCount: 0,
          viewCount: 0,
        };
        
        await createPost(newPost);
        showToast('게시물이 작성되었습니다.', 'success');
      }
      
      // 모달 닫기 및 데이터 새로고침
      setIsModalOpen(false);
      setPostToEdit(null); // 수정 데이터 초기화
      
      // 데이터 새로고침은 selectedPost 업데이트 이후에 수행
      setTimeout(() => {
        refreshPosts();
        refreshBookmarks();
      }, 100);
    } catch (error) {
      showToast('게시물 저장 중 오류가 발생했습니다.', 'error');
      console.error("게시물 저장 중 오류:", error);
    }
  }, [postToEdit, refreshPosts, refreshBookmarks, showToast, user]);

  // 게시물 삭제 관련 함수
  const requestDeletePost = useCallback(() => {
    // 게스트 사용자 확인 및 접근 제한
    if (user?.isAnonymous) {
      showToast('게스트는 게시물을 삭제할 수 없습니다. 로그인 후 이용해주세요.', 'error');
      return;
    }
    
    setIsDeleteModalOpen(true);
  }, [user?.isAnonymous, showToast]);

  const confirmDeletePost = useCallback(async () => {
    if (!selectedPost) return;
    try {
      await deletePost(selectedPost.id);
      showToast('게시물이 삭제되었습니다.', 'success');
      setIsDeleteModalOpen(false);
      refreshPosts();
      refreshBookmarks();
    } catch (error) {
      showToast('게시물 삭제 중 오류가 발생했습니다.', 'error');
      console.error("게시물 삭제 중 오류:", error);
    }
  }, [selectedPost, refreshPosts, refreshBookmarks, showToast]);

  // 게시물 이동 관련 함수
  const handleMovePost = useCallback(async (newCategoryId: string) => {
    if (!selectedPost) return;
    try {
      await movePost(selectedPost.id, newCategoryId);
      showToast('게시물이 이동되었습니다.', 'success');
      setIsDeleteModalOpen(false); // 이동 후 삭제 모달 닫기
      refreshPosts();
      refreshBookmarks();
    } catch (error) {
      showToast('게시물 이동 중 오류가 발생했습니다.', 'error');
      console.error("게시물 이동 중 오류:", error);
    }
  }, [selectedPost, refreshPosts, refreshBookmarks, showToast]);

  // 게시물 데이터 새로고침 함수
  const refreshPostData = useCallback(() => {
    refreshPosts();
    refreshBookmarks();
  }, [refreshPosts, refreshBookmarks]);

  // 게시물 소유자 확인 함수
  const isPostOwner = useCallback((post: UIPost | null) => {
    return post?.authorId === user?.uid;
  }, [user?.uid]);

  // 북마크 모드 전환 함수
  const handleToggleBookmarks = useCallback(() => {
    // 게스트 사용자 확인 및 접근 제한
    if (user?.isAnonymous) {
      showToast('게스트는 북마크 기능을 사용할 수 없습니다. 로그인 후 이용해주세요.', 'error');
      return;
    }

    // 선택 초기화
    clearSelection();
    
    setTimeout(() => {
      // 카테고리와 태그 초기화
      setSelectedCategory('all');
      setSelectedTag(null);
      
      // 북마크 모드 전환
      setShowBookmarks(prev => !prev);
      
      // 북마크 데이터 새로고침
      if (!showBookmarks) {
        refreshBookmarks();
      } else {
        refreshPosts();
      }
    }, 10);
  }, [user?.isAnonymous, showBookmarks, clearSelection, refreshBookmarks, refreshPosts, showToast]);
  
  // 메뉴 생성 및 업데이트
  useEffect(() => {
    const isPostSelected = selectedPost !== null;
    // 권한 확인: 현재 사용자가 게시물 작성자인지 확인
    const canEditOrDelete = isPostSelected && isPostOwner(selectedPost);
    
    // 선택된 게시물이 속한 카테고리 이름 (UI에 표시용)
    let selectedCategoryName = '';
    if (selectedPost?.category) {
      const categoryObj = categories.find(c => c.id === selectedPost.category);
      selectedCategoryName = categoryObj ? categoryObj.name : selectedPost.category;
    }
    
    const moveSubMenu: MenuItem[] = categories
      .filter(c => c.id !== 'all' && c.id !== selectedPost?.category)
      .map(c => ({
        label: c.name,
        action: () => handleMovePost(c.id),
        isSeparator: false,
      }));

    setMenus([
      {
        name: '파일',
        items: [
          { label: '새 게시물...', action: handleOpenNewPost },
          { isSeparator: true },
          { label: '창 닫기', action: onClose }
        ],
      },
      {
        name: '편집',
        items: [
          { 
            label: '게시물 수정...', 
            action: () => handleOpenEditModal(), // 인자 없이 호출하면 내부에서 selectedPost를 사용함
            disabled: !isPostSelected || !canEditOrDelete 
          },
          { 
            label: '게시물 삭제', 
            action: requestDeletePost, 
            disabled: !isPostSelected || !canEditOrDelete 
          },
          { isSeparator: true },
          { 
            label: selectedPost?.category ? 
              `카테고리 이동 (현재: ${selectedCategoryName})` : 
              '카테고리 이동', 
            disabled: !isPostSelected || !canEditOrDelete || moveSubMenu.length === 0,
            items: moveSubMenu 
          },
        ]
      },
      {
        name: '보기',
        items: [
          { 
            label: showBookmarks ? '모든 게시물 보기' : '북마크만 보기', 
            action: handleToggleBookmarks,
            disabled: user?.isAnonymous // 게스트 사용자는 북마크 기능 비활성화
          },
        ]
      }
    ]);
  }, [selectedPost, categories, onClose, handleOpenEditModal, requestDeletePost, handleMovePost, handleOpenNewPost, isPostOwner, showBookmarks, handleToggleBookmarks, user?.isAnonymous]);
  
  return (
    <div
      ref={windowRef}
      style={{
        position: 'absolute',
        top: `${position.y}px`,
        left: `${position.x}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        minWidth: `${minSize.width}px`,
        minHeight: `${minSize.height}px`,
        transition: isDragging || isResizing ? 'none' : 'width 0.2s ease, height 0.2s ease, top 0.2s ease, left 0.2s ease'
      }}
      className={`bg-white/80 backdrop-blur-xl flex flex-col overflow-hidden ${isMaximized ? 'rounded-none shadow-none border-none' : 'rounded-xl shadow-2xl border border-slate-300/80'}`}
    >
      <header
        onMouseDown={handleDragStart}
        onDoubleClick={handleToggleMaximize}
        className={`flex-shrink-0 h-14 flex items-center px-4 border-b border-slate-200/80 ${!isMaximized ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        <TrafficLights onClose={onClose} onMinimize={handleMinimize} onMaximize={handleToggleMaximize} />
        <div className="flex-grow text-center">
           <h1 className="font-semibold text-slate-700 select-none">
              {showBookmarks ? "북마크" : "게시판"}
           </h1>
        </div>
        <div className="w-16 flex justify-end">
          {!user?.isAnonymous && (
            <button 
              onClick={handleToggleBookmarks}
              className={`p-2 rounded-full transition-colors ${showBookmarks ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
              title={showBookmarks ? "모든 게시물 보기" : "북마크만 보기"}
            >
              <BookmarkIcon className="w-5 h-5" fill={showBookmarks ? "currentColor" : "none"} />
            </button>
          )}
        </div>
      </header>
      <WindowMenuBar menus={menus} />
      <main className="flex flex-grow overflow-hidden" style={{ height: 'calc(100% - 56px - 32px)'}}>
        <Sidebar 
          categories={sidebarCategories}
          selectedCategory={selectedCategory} 
          onSelectCategory={handleSelectCategory}
          onNewPost={handleOpenNewPost}
          allTags={availableTags} 
          selectedTag={selectedTag}
          onSelectTag={handleSelectTag}
          showBookmarks={showBookmarks} 
        />
        <div className="flex-1 flex flex-row overflow-hidden">
          <div className="w-1/3 flex flex-col overflow-hidden">
            <PostList 
              posts={filteredPosts} 
              selectedPost={selectedPost} 
              onSelectPost={handleSelectPost} 
              loading={loading}
              error={errorMessage}
              searchTerm={searchTerm}
              onSearch={(term) => setSearchTerm(term)}
            />
          </div>
          <div className="flex-1 overflow-auto bg-slate-50">
            {selectedPost ? (
              <PostDetail 
                post={selectedPost} 
                onEditPost={handleOpenEditModal} 
                onDeletePost={requestDeletePost}
                onSelectTag={handleSelectTag}
                categories={categories.filter(cat => cat.id !== 'all')} // 'all' 카테고리는 제외
                isPostOwner={isPostOwner(selectedPost)}
                onRefresh={refreshPostData}
                userId={user?.uid}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                게시물을 선택하세요.
              </div>
            )}
          </div>
        </div>
      </main>
      {isModalOpen && (
        <NewPostModal 
          categories={categories.filter(c => c.id !== 'all')} 
          onClose={() => setIsModalOpen(false)}
          onSave={handleSavePost}
          postToEdit={postToEdit}
          allTags={allTags}
          selectedCategory={selectedCategory === 'all' ? null : selectedCategory}
        />
      )}
      {isDeleteModalOpen && selectedPost && (
        <ConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={confirmDeletePost}
            title="게시물 삭제"
            message={
                <>
                    <strong className="font-bold text-slate-900">"{selectedPost.title}"</strong> 게시물을 정말로 삭제하시겠습니까? 
                    <br />
                    이 작업은 되돌릴 수 없습니다.
                </>
            }
            confirmButtonText="삭제"
            cancelButtonText="취소"
        />
      )}
       <div
          onMouseDown={handleResizeStart}
          className={`absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-20 ${isMaximized ? 'hidden' : ''}`}
          aria-label="Resize window"
        >
          <svg className="w-full h-full text-slate-400 opacity-60" fill="none" viewBox="0 0 16 16" stroke="currentColor">
              <path d="M 12 4 L 4 12" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 12 7 L 7 12" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M 12 10 L 10 12" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
      </div>
      
      {/* 토스트 메시지 추가 */}
      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={closeToast}
        />
      )}
    </div>
  );
};

export default BulletinBoard;