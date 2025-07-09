import React from 'react';
import type { UIPost } from '../src/types';
import { MessagesSquareIcon, HashtagIcon, PencilIcon, TrashIcon } from './icons';
import { useAuth } from '../src/hooks/useAuth';
import { useBookmarks } from '../src/hooks/useBookmarks';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import CommentSection from './CommentSection';
import { pcColors } from '../src/styles/colors';
import { BORDER_SINGLE, SPECIAL } from '../src/styles/asciiChars';
import TextBox from '../src/components/pc-components/TextBox';

interface PostDetailProps {
  post: UIPost | null;
  onSelectTag: (tag: string | null) => void;
  onEditPost?: (post: UIPost) => void; // 게시물 객체를 매개변수로 전달
  onDeletePost?: () => void;
  // 추가 props
  isPostOwner?: boolean;
  onRefresh?: () => void;
  userId?: string;
  categories?: any[];
}

/**
 * 게시물 상세 보기 컴포넌트
 * PC통신 스타일로 게시물 내용과 댓글을 표시합니다.
 */
const PostDetail: React.FC<PostDetailProps> = ({ 
  post, 
  onSelectTag, 
  onEditPost, 
  onDeletePost, 
  isPostOwner = false, 
  onRefresh,
  userId,
  categories = []
}) => {
  // 인증 정보 가져오기
  const { user } = useAuth();
  // 북마크 기능 사용
  const { isBookmarked, toggleBookmark, checkBookmarkStatus } = useBookmarks(user?.uid);
  
  // 기본 프로필 이미지
  const defaultAvatar = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNjY2MiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjAgMjF2LTJhNCA0IDAgMCAwLTQtNEg4YTQgNCAwIDAgMC00IDR2MiI+PC9wYXRoPjxjaXJjbGUgY3g9IjEyIiBjeT0iNyIgcj0iNCI+PC9jaXJjbGU+PC9zdmc+`;

  // 사용자 권한 확인: 외부에서 전달받은 값(isPostOwner)과 컴포넌트 내부에서 계산한 값 모두 사용
  const isCurrentUserAuthor = user && post && user.uid === post.authorId;
  const canEditDelete = isPostOwner || isCurrentUserAuthor;
  
  // 북마크 상태 확인
  React.useEffect(() => {
    if (user && post?.id) {
      checkBookmarkStatus(post.id);
    }
  }, [user, post?.id, checkBookmarkStatus]);
  
  // 북마크 토글 처리
  const handleBookmarkToggle = () => {
    if (user && post?.id) {
      if (user.isAnonymous) {
        alert('게스트는 북마크 기능을 사용할 수 없습니다. 로그인 후 이용해주세요.');
        return;
      }
      toggleBookmark(post.id, user.isAnonymous);
    }
  };
  
  // 북마크 상태 확인
  const isPostBookmarked = post ? isBookmarked(post.id) : false;

  if (!post) {
    return (
      <div className="flex-grow flex items-center justify-center font-pc" 
           style={{ backgroundColor: pcColors.background.secondary, color: pcColors.text.secondary }}>
        <div className="text-center">
            <div className="mx-auto w-16 h-16 mb-2" style={{ color: pcColors.text.secondary }}>
              {SPECIAL.bullet}{SPECIAL.bullet}{SPECIAL.bullet}
            </div>
            <p className="text-lg">게시물을 선택하여 여기에서 보세요.</p>
        </div>
      </div>
    );
  }

  // 현재 사용자가 글 작성자와 일치하고 구글 로그인 사용자라면 해당 프로필 이미지 사용
  const avatarUrl = (user && user.uid === post.authorId && !user.isAnonymous && user.photoURL) 
    ? user.photoURL 
    : defaultAvatar;

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden font-pc" 
         style={{ backgroundColor: pcColors.background.primary, color: pcColors.text.primary }}>
      {/* 게시물 헤더 */}
      <div className="px-4 py-2 border-b" style={{ borderColor: pcColors.border.primary }}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
          <div className="mb-2 sm:mb-0">
            <h1 className="text-xl font-bold" style={{ color: pcColors.text.accent }}>{post.title}</h1>
          </div>
          
          <div className="flex items-center">
            {/* 북마크 버튼 */}
            {user && !user.isAnonymous && (
              <button
                onClick={handleBookmarkToggle}
                className="px-2 py-1 border mr-2"
                style={{ 
                  borderColor: pcColors.border.primary,
                  color: isPostBookmarked ? pcColors.text.accent : pcColors.text.secondary,
                  backgroundColor: pcColors.background.secondary
                }}
                title={isPostBookmarked ? "북마크 해제" : "북마크 추가"}
              >
                {isPostBookmarked ? `${SPECIAL.star} 북마크됨` : `${SPECIAL.bullet} 북마크`}
              </button>
            )}
            
            {post.comments > 0 && (
              <div className="flex items-center mr-4" style={{ color: pcColors.text.secondary }}>
                <span className="mr-1">{SPECIAL.bullet}</span>
                <span className="text-sm">{post.comments}개의 댓글</span>
              </div>
            )}
            
            {/* 작성자에게만 보이는 수정/삭제 버튼 */}
            {canEditDelete && onEditPost && onDeletePost && (
              <div className="flex space-x-2">
                <button 
                  onClick={() => post && onEditPost(post)}
                  className="px-2 py-1 border"
                  style={{ 
                    borderColor: pcColors.border.primary,
                    color: pcColors.text.secondary
                  }}
                  title="게시물 수정"
                >
                  수정
                </button>
                <button 
                  onClick={onDeletePost}
                  className="px-2 py-1 border"
                  style={{ 
                    borderColor: pcColors.border.primary,
                    color: pcColors.text.error
                  }}
                  title="게시물 삭제"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap items-center mt-2 text-sm" style={{ color: pcColors.text.secondary }}>
          <span className="mr-2 mb-1 sm:mb-0">작성자: {post.author.name}</span>
          <span>작성일: {new Date(post.date).toLocaleString()}</span>
        </div>
      </div>

      {/* 게시물 내용 */}
      <div className="overflow-y-auto flex-grow">
        <TextBox 
          borderStyle="none" 
          padding="1rem"
          className="h-full"
        >
          <div className="markdown-body font-pc" style={{ color: pcColors.text.primary }}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
              components={{
                // 링크를 새 탭에서 열도록 설정
                a: ({ node, ...props }) => (
                  <a 
                    {...props} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ color: pcColors.text.accent, textDecoration: 'underline' }}
                  />
                ),
                // 이미지 스타일 적용
                img: ({ node, ...props }) => (
                  <img {...props} className="max-w-full border" style={{ borderColor: pcColors.border.primary }} />
                ),
                // 헤딩 스타일 적용
                h1: ({ node, ...props }) => (
                  <h1 {...props} style={{ color: pcColors.text.accent, borderBottom: `1px solid ${pcColors.border.primary}`, paddingBottom: '0.5rem', marginBottom: '1rem' }} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 {...props} style={{ color: pcColors.text.accent, borderBottom: `1px solid ${pcColors.border.primary}`, paddingBottom: '0.3rem', marginBottom: '0.8rem' }} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 {...props} style={{ color: pcColors.text.accent, marginBottom: '0.5rem' }} />
                ),
                // 코드 블록 스타일 적용
                code: ({ node, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match && !className;
                  return isInline ? (
                    <code 
                      className="text-sm px-1 py-0.5" 
                      style={{ 
                        backgroundColor: pcColors.background.secondary,
                        color: pcColors.text.accent 
                      }} 
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <code 
                      className={`${className} text-sm block p-2 my-2 border`} 
                      style={{ 
                        backgroundColor: pcColors.background.secondary,
                        color: pcColors.text.primary,
                        borderColor: pcColors.border.primary
                      }}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                // 인용구 스타일 적용
                blockquote: ({ node, ...props }) => (
                  <blockquote 
                    {...props} 
                    className="border-l-4 pl-4 my-4" 
                    style={{ borderColor: pcColors.border.primary, color: pcColors.text.secondary }}
                  />
                ),
                // 목록 스타일 적용
                ul: ({ node, ...props }) => (
                  <ul {...props} className="list-disc pl-5 my-4" style={{ color: pcColors.text.primary }} />
                ),
                ol: ({ node, ...props }) => (
                  <ol {...props} className="list-decimal pl-5 my-4" style={{ color: pcColors.text.primary }} />
                ),
                // 테이블 스타일 적용
                table: ({ node, ...props }) => (
                  <table {...props} className="border-collapse my-4 w-full" style={{ borderColor: pcColors.border.primary }} />
                ),
                thead: ({ node, ...props }) => (
                  <thead {...props} style={{ backgroundColor: pcColors.background.secondary, color: pcColors.text.accent }} />
                ),
                th: ({ node, ...props }) => (
                  <th {...props} className="border p-2" style={{ borderColor: pcColors.border.primary }} />
                ),
                td: ({ node, ...props }) => (
                  <td {...props} className="border p-2" style={{ borderColor: pcColors.border.primary }} />
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>
          
          {/* 태그 목록 */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-6 pt-4 border-t" style={{ borderColor: pcColors.border.primary }}>
              <div className="flex items-center mb-2">
                <span style={{ color: pcColors.text.accent }}>{SPECIAL.bullet}</span>
                <span className="ml-2 font-bold" style={{ color: pcColors.text.accent }}>태그</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => onSelectTag(tag)}
                    className="flex items-center px-2 py-1 border mb-2"
                    style={{ 
                      borderColor: pcColors.border.primary,
                      color: pcColors.text.secondary,
                      backgroundColor: pcColors.background.secondary
                    }}
                  >
                    <span className="mr-1">[{SPECIAL.bullet}]</span>
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </TextBox>
        
        {/* 댓글 섹션 */}
        <TextBox 
          title="댓글" 
          borderStyle="single" 
          className="mt-2"
        >
          <CommentSection postId={post.id} />
        </TextBox>
      </div>
    </div>
  );
};

export default PostDetail;