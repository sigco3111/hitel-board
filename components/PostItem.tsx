import React, { useEffect } from 'react';
import type { UIPost } from '../src/types';
import { useAuth } from '../src/hooks/useAuth';
import { useBookmarks } from '../src/hooks/useBookmarks';
import { MessagesSquareIcon, BookmarkIcon } from './icons';

interface PostItemProps {
  post: UIPost;
  isSelected: boolean;
  onClick: () => void;
}

const PostItem: React.FC<PostItemProps> = ({ post, isSelected, onClick }) => {
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
  
  // 기본 프로필 이미지
  const defaultAvatar = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNjY2MiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjAgMjF2LTJhNCA0IDAgMCAwLTQtNEg4YTQgNCAwIDAgMC00IDR2MiI+PC9wYXRoPjxjaXJjbGUgY3g9IjEyIiBjeT0iNyIgcj0iNCI+PC9jaXJjbGU+PC9zdmc+`;

  // 현재 사용자가 글 작성자와 일치하고 구글 로그인 사용자라면 해당 프로필 이미지 사용
  const avatarUrl = (user && user.uid === post.authorId && !user.isAnonymous && user.photoURL) 
    ? user.photoURL 
    : defaultAvatar;

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

  // 북마크 상태에 따른 아이콘 설정
  const bookmarkFill = isBookmarked(post.id) ? 'currentColor' : 'none';
  
  // 날짜 간소화 표시 (MM.DD 형식)
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}.${date.getDate()}`;
  };

  return (
    <li
      onClick={onClick}
      className={`py-2 px-3 border-b border-slate-200 cursor-pointer transition-colors duration-150 ${
        isSelected ? 'bg-blue-100/70' : 'hover:bg-slate-50'
      }`}
    >
      <div className="grid grid-cols-10 gap-2 w-full items-center">
        {/* 프로필 이미지 (1/10) */}
        <div className="col-span-1">
          <img 
            src={avatarUrl} 
            alt={post.author.name} 
            className="w-7 h-7 rounded-full"
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultAvatar;
            }}
          />
        </div>
        
        {/* 제목 및 작성자 (6/10) */}
        <div className="col-span-6 min-w-0 overflow-hidden pr-1">
          <div className="flex items-center">
            <p className={`font-medium text-xs ${isSelected ? 'text-blue-800' : 'text-slate-600'} truncate mr-2`}>{post.author.name}</p>
            {post.isNew && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>}
          </div>
          <h3 className={`font-bold text-sm truncate ${isSelected ? 'text-slate-900' : 'text-slate-900'}`}>{post.title}</h3>
        </div>
        
        {/* 댓글수, 날짜, 북마크 (3/10) */}
        <div className="col-span-3 flex flex-col items-end justify-center h-full">
          <div className="flex items-center text-xs text-slate-500 w-full justify-end">
            {post.comments > 0 && (
              <div className="flex items-center text-slate-600 mr-2">
                <MessagesSquareIcon className="w-3.5 h-3.5 mr-0.5 flex-shrink-0" />
                <span>{post.comments}</span>
              </div>
            )}
            <span className="whitespace-nowrap text-blue-600 font-medium">{formatDate(post.date)}</span>
          </div>
          <div className="flex items-center mt-1 justify-end">
            {user && !user.isAnonymous && (
              <button 
                onClick={handleBookmarkToggle}
                className={`transition-colors ${isBookmarked(post.id) ? 'text-blue-500' : 'text-slate-400 hover:text-blue-500'}`}
                title={isBookmarked(post.id) ? "북마크 해제" : "북마크 추가"}
              >
                <BookmarkIcon className="w-4 h-4" fill={bookmarkFill} />
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
};

export default PostItem;
