import React, { useEffect } from 'react';
import type { UIPost } from '../src/types';
import { useAuth } from '../src/hooks/useAuth';
import { useBookmarks } from '../src/hooks/useBookmarks';
import { SPECIAL } from '../src/styles/asciiChars';
import { pcColors } from '../src/styles/colors';

interface PostItemProps {
  post: UIPost;
  isSelected: boolean;
  onClick: () => void;
  index: number; // 게시물 번호 (페이징 처리를 위해 추가)
}

const PostItem: React.FC<PostItemProps> = ({ post, isSelected, onClick, index }) => {
  // 인증 정보 가져오기
  const { user } = useAuth();
  // 북마크 기능 사용
  const { isBookmarked, toggleBookmark, checkBookmarkStatus } = useBookmarks(user?.uid);
  
  // 컴포넌트 마운트 시 북마크 상태 확인
  useEffect(() => {
    if (user && post.id) {
      checkBookmarkStatus(post.id);
    }
  }, [post.id, user, checkBookmarkStatus]);
  
  // 북마크 토글 처리
  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // 부모 onClick 이벤트 전파 방지
    if (user) {
      // 게스트 사용자 북마크 제한
      if (user.isAnonymous) {
        alert('게스트는 북마크 기능을 사용할 수 없습니다. 로그인 후 이용해주세요.');
        return;
      }
      toggleBookmark(post.id, user.isAnonymous);
    }
  };
  
  // 북마크 상태 확인 (타입 안전하게 처리)
  const isPostBookmarked = Boolean(isBookmarked(post.id));
  
  // 날짜 간소화 표시 (MM-DD 형식)
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${month}-${day}`;
  };

  // 제목 최대 길이 제한 (PC통신 스타일에 맞게)
  const truncateTitle = (title: string, maxLength: number = 30) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  return (
    <div
      onClick={onClick}
      className={`px-2 py-0.5 font-pc border-b cursor-pointer ${
        isSelected ? 'bg-pc-selection-bg' : ''
      }`}
      style={{ 
        backgroundColor: isSelected ? pcColors.selection.background : 'transparent',
        borderColor: pcColors.border.primary,
        borderBottomWidth: '1px'
      }}
    >
      <div className="grid grid-cols-12 gap-1 items-center">
        {/* 게시물 번호 */}
        <div className="hidden sm:block col-span-1 text-center" 
             style={{ color: isSelected ? pcColors.selection.text : pcColors.text.primary }}>
          {index}
        </div>
        
        {/* 제목 */}
        <div className="col-span-12 sm:col-span-6 truncate flex items-center" 
             style={{ color: isSelected ? pcColors.selection.text : pcColors.text.primary }}>
          {/* 북마크 표시 */}
          {isPostBookmarked && (
            <span className="mr-1" style={{ color: isSelected ? pcColors.selection.text : pcColors.text.accent }}>
              {SPECIAL.star}
            </span>
          )}
          
          {/* 새 게시물 표시 */}
          {post.isNew && (
            <span className="mr-1" style={{ color: isSelected ? pcColors.selection.text : pcColors.text.accent }}>
              N
            </span>
          )}
          
          {/* 댓글 수 표시 */}
          {post.comments > 0 && (
            <span className="mr-1" style={{ color: isSelected ? pcColors.selection.text : pcColors.text.secondary }}>
              [{post.comments}]
            </span>
          )}
          
          {/* 제목 */}
          <span className={isSelected ? '' : 'hover:text-pc-text-yellow'}>
            {truncateTitle(post.title)}
          </span>
          
          {/* 모바일에서만 표시되는 작성자와 날짜 정보 */}
          <span className="sm:hidden ml-auto flex items-center text-xs" 
                style={{ color: isSelected ? pcColors.selection.text : pcColors.text.secondary }}>
            <span className="mr-2">{post.author.name}</span>
            <span>{formatDate(post.date)}</span>
          </span>
        </div>
        
        {/* 작성자 */}
        <div className="hidden sm:block col-span-2 truncate" 
             style={{ color: isSelected ? pcColors.selection.text : pcColors.text.secondary }}>
          {post.author.name}
        </div>
        
        {/* 날짜 */}
        <div className="hidden sm:block col-span-2 text-center" 
             style={{ color: isSelected ? pcColors.selection.text : pcColors.text.secondary }}>
          {formatDate(post.date)}
        </div>
        
        {/* 조회수 */}
        <div className="hidden sm:block col-span-1 text-center" 
             style={{ color: isSelected ? pcColors.selection.text : pcColors.text.secondary }}>
          {/* UIPost 타입에는 viewCount가 없으므로 기본값 0 사용 */}
          0
        </div>
        
        {/* 북마크 버튼 */}
        {user && !user.isAnonymous && (
          <div className="hidden sm:flex items-center justify-center ml-1">
            <button
              onClick={handleBookmarkToggle}
              className="px-1 py-0.5"
              style={{ 
                color: isPostBookmarked 
                  ? (isSelected ? pcColors.selection.text : pcColors.text.accent) 
                  : (isSelected ? pcColors.selection.text : pcColors.text.secondary)
              }}
              title={isPostBookmarked ? "북마크 해제" : "북마크 추가"}
            >
              {isPostBookmarked ? SPECIAL.star : SPECIAL.bullet}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostItem;
