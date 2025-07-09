import React, { useState } from 'react';
import { UIComment } from '../src/types';
import { useComments } from '../src/hooks/useComments';
import { useAuth } from '../src/hooks/useAuth';
import { PencilIcon, TrashIcon } from './icons';
import { pcColors } from '../src/styles/colors';
import { SPECIAL } from '../src/styles/asciiChars';

interface CommentSectionProps {
  postId: string | null;
}

/**
 * 댓글 목록 및 작성 기능을 제공하는 컴포넌트
 * PC통신 스타일로 댓글을 표시합니다.
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
      <div className="p-2 font-pc" style={{ color: pcColors.text.accent }}>
        <div className="flex justify-center p-2">
          <div className="animate-pulse">{SPECIAL.bullet} 댓글을 불러오는 중... {SPECIAL.bullet}</div>
        </div>
      </div>
    );
  }
  
  if (error && comments.length === 0) {
    return (
      <div className="p-2 font-pc" style={{ color: pcColors.text.error }}>
        <div className="p-2 border" style={{ borderColor: pcColors.border.primary }}>
          <p>댓글을 불러오는 중 오류가 발생했습니다.</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="font-pc">
      {/* 댓글 목록 */}
      <div className="p-2">
        <div className="mb-2" style={{ color: pcColors.text.secondary }}>
          {SPECIAL.bullet} 댓글 {comments.length}개
        </div>
        
        {comments.length === 0 ? (
          <div className="text-center py-2" style={{ color: pcColors.text.secondary }}>
            첫 번째 댓글을 작성해보세요.
          </div>
        ) : (
          <div className="space-y-2">
            {comments.map(comment => (
              <div key={comment.id} className="border p-2 mb-2" style={{ borderColor: pcColors.border.primary, backgroundColor: pcColors.background.secondary }}>
                {/* 댓글 수정 모드 */}
                {editingComment && editingComment.id === comment.id ? (
                  <form onSubmit={handleUpdateComment} className="space-y-2">
                    <textarea
                      value={editingComment.content}
                      onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
                      className="w-full p-2 border font-pc"
                      style={{ 
                        backgroundColor: pcColors.background.primary,
                        color: pcColors.text.primary,
                        borderColor: pcColors.border.primary
                      }}
                      rows={3}
                      disabled={submitting}
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="px-2 py-1 border"
                        style={{ 
                          borderColor: pcColors.border.primary,
                          color: pcColors.text.secondary
                        }}
                        disabled={submitting}
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        className="px-2 py-1 border"
                        style={{ 
                          borderColor: pcColors.border.primary,
                          color: pcColors.text.accent,
                          backgroundColor: pcColors.background.secondary
                        }}
                        disabled={submitting}
                      >
                        {submitting ? '저장 중...' : '저장'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex flex-col">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1">
                        <div style={{ color: pcColors.text.accent }}>
                          {comment.author.name}
                          <span className="ml-2 text-xs" style={{ color: pcColors.text.secondary }}>
                            {new Date(comment.date).toLocaleString()}
                          </span>
                        </div>
                        
                        {/* 작성자에게만 보이는 수정/삭제 버튼 */}
                        {user && user.uid === comment.authorId && (
                          <div className="flex space-x-1 mt-1 sm:mt-0">
                            <button 
                              onClick={() => startEditing(comment)}
                              className="px-1"
                              style={{ color: pcColors.text.secondary }}
                              title="댓글 수정"
                            >
                              [수정]
                            </button>
                            <button 
                              onClick={() => handleDeleteComment(comment.id)}
                              className="px-1"
                              style={{ color: pcColors.text.error }}
                              title="댓글 삭제"
                            >
                              [삭제]
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap" style={{ color: pcColors.text.primary }}>{comment.content}</p>
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
        <form onSubmit={handleSubmitComment} className="p-2 border-t" style={{ borderColor: pcColors.border.primary }}>
          <div className="flex flex-col">
            <div className="mb-1" style={{ color: pcColors.text.secondary }}>
              {user.displayName || '사용자'} 님의 댓글
            </div>
            <div className="flex-grow">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 작성하세요..."
                className="w-full p-2 border font-pc"
                style={{ 
                  backgroundColor: pcColors.background.secondary,
                  color: pcColors.text.primary,
                  borderColor: pcColors.border.primary
                }}
                rows={2}
                disabled={submitting}
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-3 py-1 border"
                  style={{ 
                    borderColor: pcColors.border.primary,
                    color: pcColors.text.accent,
                    backgroundColor: pcColors.background.secondary,
                    opacity: !newComment.trim() || submitting ? 0.5 : 1
                  }}
                  disabled={!newComment.trim() || submitting}
                >
                  {submitting ? '작성 중...' : '댓글 작성'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : user && user.isAnonymous ? (
        <div className="p-2 border-t text-center" 
             style={{ borderColor: pcColors.border.primary, color: pcColors.text.secondary }}>
          게스트는 댓글을 작성할 수 없습니다. <br className="sm:hidden" /><a href="#" style={{ color: pcColors.text.accent }}>로그인</a> 후 이용해주세요.
        </div>
      ) : (
        <div className="p-2 border-t text-center" 
             style={{ borderColor: pcColors.border.primary, color: pcColors.text.secondary }}>
          댓글을 작성하려면 <br className="sm:hidden" /><a href="#" style={{ color: pcColors.text.accent }}>로그인</a>이 필요합니다.
        </div>
      )}
    </div>
  );
};

export default CommentSection; 