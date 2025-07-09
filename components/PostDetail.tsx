import React from 'react';
import type { UIPost } from '../src/types';
import { MessagesSquareIcon, HashtagIcon, PencilIcon, TrashIcon } from './icons';
import { useAuth } from '../src/hooks/useAuth';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import CommentSection from './CommentSection';

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
  
  // 기본 프로필 이미지
  const defaultAvatar = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNjY2MiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjAgMjF2LTJhNCA0IDAgMCAwLTQtNEg4YTQgNCAwIDAgMC00IDR2MiI+PC9wYXRoPjxjaXJjbGUgY3g9IjEyIiBjeT0iNyIgcj0iNCI+PC9jaXJjbGU+PC9zdmc+`;

  // 사용자 권한 확인: 외부에서 전달받은 값(isPostOwner)과 컴포넌트 내부에서 계산한 값 모두 사용
  const isCurrentUserAuthor = user && post && user.uid === post.authorId;
  const canEditDelete = isPostOwner || isCurrentUserAuthor;

  if (!post) {
    return (
      <div className="flex-grow flex items-center justify-center bg-slate-50 text-slate-500">
        <div className="text-center">
            <MessagesSquareIcon className="mx-auto w-16 h-16 text-slate-300" />
            <p className="mt-2 text-lg">게시물을 선택하여 여기에서 보세요.</p>
        </div>
      </div>
    );
  }

  // 현재 사용자가 글 작성자와 일치하고 구글 로그인 사용자라면 해당 프로필 이미지 사용
  const avatarUrl = (user && user.uid === post.authorId && !user.isAnonymous && user.photoURL) 
    ? user.photoURL 
    : defaultAvatar;

  return (
    <div className="flex-grow bg-slate-50 flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{post.title}</h1>
          </div>
          
          <div className="flex items-center">
            {post.comments > 0 && (
              <div className="flex items-center mr-4 text-slate-600">
                <MessagesSquareIcon className="w-4 h-4 mr-1" />
                <span className="text-sm">{post.comments}개의 댓글</span>
              </div>
            )}
            
            {/* 작성자에게만 보이는 수정/삭제 버튼 */}
            {canEditDelete && onEditPost && onDeletePost && (
              <div className="flex space-x-2">
                <button 
                  onClick={() => post && onEditPost(post)}
                  className="p-1.5 rounded-full text-slate-600 hover:bg-slate-200 transition-colors"
                  title="게시물 수정"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button 
                  onClick={onDeletePost}
                  className="p-1.5 rounded-full text-slate-600 hover:bg-slate-200 transition-colors"
                  title="게시물 삭제"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3 mt-3 text-sm">
          <img 
            src={avatarUrl} 
            alt={post.author.name} 
            className="w-10 h-10 rounded-full"
            onError={(e) => {
              // 이미지 로드 실패 시 기본 이미지로 대체
              (e.target as HTMLImageElement).src = defaultAvatar;
            }}
          />
          <div>
            <p className="font-semibold text-slate-800">{post.author.name}</p>
            <p className="text-slate-500">{new Date(post.date).toLocaleString()}</p>
          </div>
        </div>
      </div>
      <div className="overflow-y-auto flex-grow">
        <div className="p-6">
          <div className="prose prose-slate prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-code:bg-slate-100 prose-code:text-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-800 prose-pre:text-slate-100 max-w-none">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
              components={{
                // 링크를 새 탭에서 열도록 설정
                a: ({ node, ...props }) => (
                  <a {...props} target="_blank" rel="noopener noreferrer" />
                ),
                // 이미지 스타일 적용
                img: ({ node, ...props }) => (
                  <img {...props} className="rounded-md shadow-sm" />
                ),
                // 코드 블록 스타일 적용
                code: ({ node, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match && !className;
                  return isInline ? (
                    <code className="text-sm bg-slate-100 text-slate-800 px-1 py-0.5 rounded" {...props}>
                      {children}
                    </code>
                  ) : (
                    <code className={`${className} text-sm`} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>
           {post.tags && post.tags.length > 0 && (
            <div className="mt-8 pt-4 border-t border-slate-200 flex items-center flex-wrap gap-2">
              {post.tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => onSelectTag(tag)}
                  className="flex items-center space-x-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors"
                >
                  <HashtagIcon className="w-3 h-3" />
                  <span>{tag}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* 댓글 섹션 추가 */}
        <CommentSection postId={post.id} />
      </div>
    </div>
  );
};

export default PostDetail;