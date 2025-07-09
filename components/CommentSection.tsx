import React, { useState } from 'react';
import { UIComment } from '../src/types';
import { useComments } from '../src/hooks/useComments';
import { useAuth } from '../src/hooks/useAuth';
import { PencilIcon, TrashIcon } from './icons';

interface CommentSectionProps {
  postId: string | null;
}

/**
 * 댓글 목록 및 작성 기능을 제공하는 컴포넌트
 * @param postId 게시물 ID
 */
const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const { comments, loading, error, addComment, editComment, removeComment } = useComments({ postId });
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<{ id: string, content: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // 기본 프로필 이미지
  const defaultAvatar = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNjY2MiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjAgMjF2LTJhNCA0IDAgMCAwLTQtNEg4YTQgNCAwIDAgMC00IDR2MiI+PC9wYXRoPjxjaXJjbGUgY3g9IjEyIiBjeT0iNyIgcj0iNCI+PC9jaXJjbGU+PC9zdmc+`;

  // 댓글 작성 처리
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !user) return;
    
    // 게스트 사용자 확인 및 접근 제한
    if (user.isAnonymous) {
      alert('게스트는 댓글을 작성할 수 없습니다. 로그인 후 이용해주세요.');
      return;
    }
    
    try {
      setSubmitting(true);
      await addComment(newComment);
      setNewComment(''); // 입력 필드 초기화
    } catch (err) {
      console.error('댓글 작성 오류:', err);
      alert(err instanceof Error ? err.message : '댓글을 작성하지 못했습니다.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // 댓글 수정 처리
  const handleUpdateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingComment || !editingComment.content.trim() || !user) return;
    
    // 게스트 사용자 확인 및 접근 제한
    if (user.isAnonymous) {
      alert('게스트는 댓글을 수정할 수 없습니다. 로그인 후 이용해주세요.');
      return;
    }
    
    try {
      setSubmitting(true);
      await editComment(editingComment.id, editingComment.content);
      setEditingComment(null); // 수정 모드 종료
    } catch (err) {
      console.error('댓글 수정 오류:', err);
      alert(err instanceof Error ? err.message : '댓글을 수정하지 못했습니다.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // 댓글 삭제 처리
  const handleDeleteComment = async (commentId: string) => {
    // 게스트 사용자 확인 및 접근 제한
    if (user?.isAnonymous) {
      alert('게스트는 댓글을 삭제할 수 없습니다. 로그인 후 이용해주세요.');
      return;
    }
    
    if (!window.confirm('정말 이 댓글을 삭제하시겠습니까?')) return;
    
    try {
      await removeComment(commentId);
    } catch (err) {
      console.error('댓글 삭제 오류:', err);
      alert(err instanceof Error ? err.message : '댓글을 삭제하지 못했습니다.');
    }
  };
  
  // 댓글 수정 모드 시작
  const startEditing = (comment: UIComment) => {
    if (user?.isAnonymous) {
      alert('게스트는 댓글을 수정할 수 없습니다. 로그인 후 이용해주세요.');
      return;
    }
    
    setEditingComment({
      id: comment.id,
      content: comment.content
    });
  };
  
  // 댓글 수정 취소
  const cancelEditing = () => {
    setEditingComment(null);
  };
  
  // 현재 사용자의 프로필 이미지
  const userAvatar = user && !user.isAnonymous && user.photoURL 
    ? user.photoURL 
    : defaultAvatar;
  
  if (loading && comments.length === 0) {
    return (
      <div className="p-4 border-t border-slate-200">
        <div className="flex justify-center p-4">
          <div className="animate-pulse text-slate-500">댓글을 불러오는 중...</div>
        </div>
      </div>
    );
  }
  
  if (error && comments.length === 0) {
    return (
      <div className="p-4 border-t border-slate-200">
        <div className="bg-red-50 text-red-700 p-3 rounded-md">
          <p>댓글을 불러오는 중 오류가 발생했습니다.</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="border-t border-slate-200">
      {/* 댓글 목록 */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-800 mb-4">댓글 {comments.length}개</h3>
        
        {comments.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            첫 번째 댓글을 작성해보세요.
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map(comment => (
              <div key={comment.id} className="bg-white rounded-lg shadow-sm p-4">
                {/* 댓글 수정 모드 */}
                {editingComment && editingComment.id === comment.id ? (
                  <form onSubmit={handleUpdateComment} className="space-y-3">
                    <textarea
                      value={editingComment.content}
                      onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      disabled={submitting}
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200"
                        disabled={submitting}
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        disabled={submitting}
                      >
                        {submitting ? '저장 중...' : '저장'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex items-start space-x-3">
                      <img 
                        src={comment.author.photoURL || defaultAvatar} 
                        alt={comment.author.name} 
                        className="w-8 h-8 rounded-full"
                        onError={(e) => {
                          // 이미지 로드 실패 시 기본 이미지로 대체
                          (e.target as HTMLImageElement).src = defaultAvatar;
                        }}
                      />
                      <div className="flex-grow">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-semibold text-slate-800">{comment.author.name}</span>
                            <span className="text-xs text-slate-500 ml-2">
                              {new Date(comment.date).toLocaleString()}
                            </span>
                          </div>
                          
                          {/* 작성자에게만 보이는 수정/삭제 버튼 */}
                          {user && user.uid === comment.authorId && (
                            <div className="flex space-x-1">
                              <button 
                                onClick={() => startEditing(comment)}
                                className="p-1 text-slate-500 hover:text-slate-700"
                                title="댓글 수정"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteComment(comment.id)}
                                className="p-1 text-slate-500 hover:text-red-600"
                                title="댓글 삭제"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="mt-1 text-slate-700 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* 댓글 작성 폼 - 게스트는 댓글 작성 폼 대신 안내 메시지 표시 */}
      {user && !user.isAnonymous ? (
        <form onSubmit={handleSubmitComment} className="p-4 bg-slate-50">
          <div className="flex items-start space-x-3">
            <img 
              src={userAvatar} 
              alt={user.displayName || '사용자'} 
              className="w-8 h-8 rounded-full"
              onError={(e) => {
                // 이미지 로드 실패 시 기본 이미지로 대체
                (e.target as HTMLImageElement).src = defaultAvatar;
              }}
            />
            <div className="flex-grow">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 작성하세요..."
                className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                disabled={submitting}
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={!newComment.trim() || submitting}
                >
                  {submitting ? '작성 중...' : '댓글 작성'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : user && user.isAnonymous ? (
        <div className="p-4 bg-slate-50 text-center text-slate-600">
          게스트는 댓글을 작성할 수 없습니다. <a href="#" className="text-blue-600 hover:underline">로그인</a> 후 이용해주세요.
        </div>
      ) : (
        <div className="p-4 bg-slate-50 text-center text-slate-600">
          댓글을 작성하려면 <a href="#" className="text-blue-600 hover:underline">로그인</a>이 필요합니다.
        </div>
      )}
    </div>
  );
};

export default CommentSection; 