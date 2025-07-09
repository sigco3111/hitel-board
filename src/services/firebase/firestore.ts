/**
 * Firebase Firestore 관련 함수
 * 게시물 CRUD 및 데이터 관리 기능을 제공합니다.
 */
import { 
  collection, 
  doc,
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc,
  deleteDoc,
  query, 
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  runTransaction,
  increment,
  setDoc
} from 'firebase/firestore';
import { db } from './config';
import type { Post, UIPost, Comment, UIComment } from '../../types/index';

// 컬렉션 및 문서 ID 상수
const POSTS_COLLECTION = 'posts';
const COMMENTS_COLLECTION = 'comments';
const BOOKMARKS_COLLECTION = 'bookmarks';
const SETTINGS_COLLECTION = 'settings';
const GLOBAL_SETTINGS_ID = 'global-settings';

// 에러 발생 시 최대 재시도 횟수
const MAX_RETRY_COUNT = 3;

/**
 * 지수 백오프 지연 함수
 * 재시도 사이에 점점 늘어나는 지연 시간을 적용합니다.
 */
const delay = (attempts: number) => {
  return new Promise(resolve => {
    // 1초, 2초, 4초 등으로 지연 시간 증가
    const waitTime = Math.pow(2, attempts - 1) * 1000;
    setTimeout(resolve, waitTime);
  });
};

/**
 * Firestore 문서를 앱 객체로 변환하는 함수
 * @param doc Firestore 문서 스냅샷
 * @returns Post 객체 
 */
const mapDocToPost = (doc: QueryDocumentSnapshot<DocumentData>): Post => {
  const data = doc.data();
  
  return {
    id: doc.id,
    title: data.title || '제목 없음',
    content: data.content || '',
    category: data.category || 'general',
    author: data.author || { name: '알 수 없음' },
    authorId: data.authorId || '',
    tags: data.tags || [],
    createdAt: data.createdAt || Timestamp.now(),
    updatedAt: data.updatedAt || Timestamp.now(),
    commentCount: data.commentCount || 0,
    viewCount: data.viewCount || 0,
    isNew: data.createdAt ? 
      (Timestamp.now().toMillis() - data.createdAt.toMillis()) < 24 * 60 * 60 * 1000 
      : false,
  };
};

/**
 * Firestore Post를 UI용 Post로 변환하는 함수
 * @param post Firestore Post 객체
 * @returns UIPost 객체
 */
export const convertToUIPost = (post: Post): UIPost => {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    category: post.category,
    author: post.author || { name: '알 수 없음' },
    authorId: post.authorId,
    date: post.createdAt.toDate().toISOString(),
    comments: post.commentCount,
    isNew: post.isNew || false,
    tags: post.tags || [],
  };
};

/**
 * Firestore 문서를 댓글 객체로 변환하는 함수
 * @param doc Firestore 문서 스냅샷
 * @returns Comment 객체
 */
const mapDocToComment = (doc: QueryDocumentSnapshot<DocumentData>): Comment => {
  const data = doc.data();
  
  return {
    id: doc.id,
    postId: data.postId || '',
    content: data.content || '',
    author: data.author || { name: '알 수 없음' },
    authorId: data.authorId || '',
    createdAt: data.createdAt || Timestamp.now(),
    updatedAt: data.updatedAt || Timestamp.now(),
  };
};

/**
 * Firestore Comment를 UI용 Comment로 변환하는 함수
 * @param comment Firestore Comment 객체
 * @returns UIComment 객체
 */
export const convertToUIComment = (comment: Comment): UIComment => {
  return {
    id: comment.id,
    postId: comment.postId,
    content: comment.content,
    author: comment.author || { name: '알 수 없음' },
    authorId: comment.authorId,
    date: comment.createdAt.toDate().toISOString(),
  };
};

/**
 * 모든 게시물을 가져오는 함수
 * 실패 시 최대 MAX_RETRY_COUNT 회까지 재시도합니다.
 */
export const fetchPosts = async (): Promise<UIPost[]> => {
  let attempts = 0;
  
  while (attempts < MAX_RETRY_COUNT) {
    try {
      attempts++;
      
      const q = query(
        collection(db, POSTS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map(mapDocToPost);
      
      return posts.map(convertToUIPost);
    } catch (error) {
      console.error(`게시물 조회 오류 (시도 ${attempts}/${MAX_RETRY_COUNT}):`, error);
      
      if (attempts >= MAX_RETRY_COUNT) {
        throw new Error(`게시물 데이터를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.`);
      }
      
      // 지수 백오프 적용
      await delay(attempts);
    }
  }
  
  throw new Error(`게시물 데이터를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.`);
};

/**
 * 특정 카테고리의 게시물을 가져오는 함수
 */
export const fetchPostsByCategory = async (category: string): Promise<UIPost[]> => {
  let attempts = 0;
  
  // 카테고리가 유효하지 않은 경우 모든 게시물 반환
  if (!category || category === 'all') {
    return fetchPosts();
  }
  
  while (attempts < MAX_RETRY_COUNT) {
    try {
      attempts++;
      
      const q = query(
        collection(db, POSTS_COLLECTION),
        where('category', '==', category),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map(mapDocToPost);
      
      return posts.map(convertToUIPost);
    } catch (error: any) {
      console.error(`${category} 카테고리 게시물 조회 오류 (시도 ${attempts}/${MAX_RETRY_COUNT}):`, error);
      
      // Firebase 인덱스 오류 처리
      if (error.code === 'failed-precondition' || error.message?.includes('requires an index')) {
        const indexUrl = error.message?.match(/https:\/\/console\.firebase\.google\.com[^\s"]*/)?.[0];
        const indexMessage = indexUrl 
          ? `Firebase 복합 인덱스가 필요합니다. 다음 링크에서 인덱스를 생성해주세요: ${indexUrl}`
          : 'Firebase 복합 인덱스가 필요합니다. Firebase 콘솔에서 인덱스를 생성해주세요.';
        
        console.error(indexMessage);
        throw new Error(`${category} 카테고리 조회를 위한 ${indexMessage}`);
      }
      
      if (attempts >= MAX_RETRY_COUNT) {
        throw new Error(`${category} 카테고리 게시물을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.`);
      }
      
      await delay(attempts);
    }
  }
  
  throw new Error(`${category} 카테고리 게시물을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.`);
};

/**
 * 특정 태그의 게시물을 가져오는 함수
 */
export const fetchPostsByTag = async (tag: string): Promise<UIPost[]> => {
  let attempts = 0;
  
  while (attempts < MAX_RETRY_COUNT) {
    try {
      attempts++;
      
      const q = query(
        collection(db, POSTS_COLLECTION),
        where('tags', 'array-contains', tag),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map(mapDocToPost);
      
      return posts.map(convertToUIPost);
    } catch (error: any) {
      console.error(`${tag} 태그 게시물 조회 오류 (시도 ${attempts}/${MAX_RETRY_COUNT}):`, error);
      
      // Firebase 인덱스 오류 처리
      if (error.code === 'failed-precondition' || error.message?.includes('requires an index')) {
        const indexUrl = error.message?.match(/https:\/\/console\.firebase\.google\.com[^\s"]*/)?.[0];
        const indexMessage = indexUrl 
          ? `Firebase 복합 인덱스가 필요합니다. 다음 링크에서 인덱스를 생성해주세요: ${indexUrl}`
          : 'Firebase 복합 인덱스가 필요합니다. Firebase 콘솔에서 인덱스를 생성해주세요.';
        
        console.error(indexMessage);
        throw new Error(`${tag} 태그 조회를 위한 ${indexMessage}`);
      }
      
      if (attempts >= MAX_RETRY_COUNT) {
        throw new Error(`${tag} 태그 게시물을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.`);
      }
      
      await delay(attempts);
    }
  }
  
  throw new Error(`${tag} 태그 게시물을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.`);
};

/**
 * 게시물 상세 정보를 가져오는 함수
 */
export const fetchPostById = async (postId: string): Promise<UIPost | null> => {
  let attempts = 0;
  
  while (attempts < MAX_RETRY_COUNT) {
    try {
      attempts++;
      
      const docRef = doc(db, POSTS_COLLECTION, postId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const post = mapDocToPost(docSnap as QueryDocumentSnapshot<DocumentData>);
        return convertToUIPost(post);
      } else {
        console.log('게시물을 찾을 수 없습니다');
        return null;
      }
    } catch (error) {
      console.error(`게시물 상세 조회 오류 (시도 ${attempts}/${MAX_RETRY_COUNT}):`, error);
      
      if (attempts >= MAX_RETRY_COUNT) {
        throw new Error(`게시물 상세 정보를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.`);
      }
      
      await delay(attempts);
    }
  }
  
  throw new Error(`게시물 상세 정보를 가져오지 못했습니다. 잠시 후 다시 시도해주세요.`);
};

/**
 * 새 게시물을 생성하는 함수
 */
export const createPost = async (postData: Partial<Post>): Promise<string> => {
  try {
    const { author, title, content, category, tags = [], authorId } = postData;
    
    if (!title || !content || !category || !author || !authorId) {
      throw new Error('필수 필드가 누락되었습니다.');
    }
    
    const docRef = await addDoc(collection(db, POSTS_COLLECTION), {
      title,
      content,
      category,
      author,
      authorId,
      tags,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      commentCount: 0,
      viewCount: 0,
    });
    
    return docRef.id;
  } catch (error) {
    console.error('게시물 생성 오류:', error);
    throw new Error('게시물을 생성하지 못했습니다. 잠시 후 다시 시도해주세요.');
  }
};

/**
 * 게시물을 수정하는 함수
 * @param postId 수정할 게시물 ID
 * @param postData 수정할 게시물 데이터
 * @param userId 현재 로그인한 사용자 ID
 * @returns 수정 완료 Promise
 */
export const updatePost = async (postId: string | number, postData: Partial<Post> | Partial<UIPost>, userId?: string): Promise<void> => {
  try {
    // ID가 number 타입이면 string으로 변환
    const postIdString = typeof postId === 'number' ? postId.toString() : postId;
    const docRef = doc(db, POSTS_COLLECTION, postIdString);
    
    // 작성자 권한 확인 (userId가 제공된 경우에만)
    if (userId) {
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('게시물을 찾을 수 없습니다.');
      }
      
      const postAuthorId = docSnap.data().authorId;
      if (postAuthorId !== userId) {
        throw new Error('자신이 작성한 게시물만 수정할 수 있습니다.');
      }
    }
    
    const updateData: Record<string, any> = { ...postData };
    
    // updatedAt은 항상 현재 시간으로 설정
    updateData.updatedAt = Timestamp.now();
    
    // UIPost 타입인 경우 변환
    if ('date' in updateData) {
      delete updateData.date;  // Firestore에 저장하지 않음
    }
    if ('comments' in updateData) {
      updateData.commentCount = updateData.comments;
      delete updateData.comments;  // 필드명 변환
    }
    
    // createdAt은 수정 불가
    delete updateData.createdAt;
    
    // id 필드는 수정 불가
    delete updateData.id;
    
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('게시물 수정 오류:', error);
    throw new Error(error instanceof Error ? error.message : '게시물을 수정하지 못했습니다. 잠시 후 다시 시도해주세요.');
  }
};

/**
 * 게시물을 삭제하는 함수
 * @param postId 삭제할 게시물 ID
 * @param userId 현재 로그인한 사용자 ID
 * @returns 삭제 완료 Promise
 */
export const deletePost = async (postId: string | number, userId?: string): Promise<void> => {
  try {
    // ID가 number 타입이면 string으로 변환
    const postIdString = typeof postId === 'number' ? postId.toString() : postId;
    const docRef = doc(db, POSTS_COLLECTION, postIdString);
    
    // 작성자 권한 확인 (userId가 제공된 경우에만)
    if (userId) {
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('게시물을 찾을 수 없습니다.');
      }
      
      const postAuthorId = docSnap.data().authorId;
      if (postAuthorId !== userId) {
        throw new Error('자신이 작성한 게시물만 삭제할 수 있습니다.');
      }
    }
    
    await deleteDoc(docRef);
  } catch (error) {
    console.error('게시물 삭제 오류:', error);
    throw new Error(error instanceof Error ? error.message : '게시물을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.');
  }
};

/**
 * 게시물을 다른 카테고리로 이동하는 함수
 * @param postId 이동할 게시물 ID
 * @param categoryId 이동할 카테고리 ID
 * @param userId 현재 로그인한 사용자 ID
 * @returns 이동 완료 Promise
 */
export const movePost = async (postId: string | number, categoryId: string, userId?: string): Promise<void> => {
  try {
    // ID가 number 타입이면 string으로 변환
    const postIdString = typeof postId === 'number' ? postId.toString() : postId;
    const docRef = doc(db, POSTS_COLLECTION, postIdString);
    
    // 작성자 권한 확인 (userId가 제공된 경우에만)
    if (userId) {
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error('게시물을 찾을 수 없습니다.');
      }
      
      const postAuthorId = docSnap.data().authorId;
      if (postAuthorId !== userId) {
        throw new Error('자신이 작성한 게시물만 이동할 수 있습니다.');
      }
      
      // 동일한 카테고리로 이동하려는 경우
      if (docSnap.data().category === categoryId) {
        throw new Error('이미 해당 카테고리에 속해 있는 게시물입니다.');
      }
    }
    
    // 카테고리 업데이트 및 수정 시간 갱신
    await updateDoc(docRef, {
      category: categoryId,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('게시물 이동 오류:', error);
    throw new Error(error instanceof Error ? error.message : '게시물을 이동하지 못했습니다. 잠시 후 다시 시도해주세요.');
  }
};

/**
 * 특정 게시물의 댓글 목록을 가져오는 함수
 * @param postId 게시물 ID
 * @returns 댓글 목록
 */
export const fetchCommentsByPostId = async (postId: string): Promise<UIComment[]> => {
  let attempts = 0;
  
  while (attempts < MAX_RETRY_COUNT) {
    try {
      attempts++;
      
      const q = query(
        collection(db, COMMENTS_COLLECTION),
        where('postId', '==', postId),
        orderBy('createdAt', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const comments = querySnapshot.docs.map(mapDocToComment);
      
      return comments.map(convertToUIComment);
    } catch (error: any) {
      console.error(`댓글 조회 오류 (시도 ${attempts}/${MAX_RETRY_COUNT}):`, error);
      
      // Firebase 인덱스 오류 처리
      if (error.code === 'failed-precondition' || error.message?.includes('requires an index')) {
        const indexUrl = error.message?.match(/https:\/\/console\.firebase\.google\.com[^\s"]*/)?.[0];
        const indexMessage = indexUrl 
          ? `Firebase 복합 인덱스가 필요합니다. 다음 링크에서 인덱스를 생성해주세요: ${indexUrl}`
          : 'Firebase 복합 인덱스가 필요합니다. Firebase 콘솔에서 인덱스를 생성해주세요.';
        
        console.error(indexMessage);
        throw new Error(`댓글 조회를 위한 ${indexMessage}`);
      }
      
      if (attempts >= MAX_RETRY_COUNT) {
        throw new Error(`댓글을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.`);
      }
      
      await delay(attempts);
    }
  }
  
  throw new Error(`댓글을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.`);
};

/**
 * 새 댓글을 생성하는 함수
 * @param commentData 댓글 데이터
 * @returns 생성된 댓글 ID
 */
export const createComment = async (commentData: { 
  postId: string; 
  content: string; 
  author: { name: string; photoURL?: string }; 
  authorId: string;
}): Promise<string> => {
  try {
    const { postId, content, author, authorId } = commentData;
    
    if (!postId || !content || !author || !authorId) {
      throw new Error('필수 필드가 누락되었습니다.');
    }
    
    // 트랜잭션을 사용하여 댓글 추가 및 게시물의 댓글 수 증가를 원자적으로 처리
    return await runTransaction(db, async (transaction) => {
      // 1. 새 댓글 문서 생성
      const commentRef = doc(collection(db, COMMENTS_COLLECTION));
      
      transaction.set(commentRef, {
        postId,
        content,
        author,
        authorId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      
      // 2. 게시물의 댓글 수 증가
      const postRef = doc(db, POSTS_COLLECTION, postId);
      transaction.update(postRef, {
        commentCount: increment(1),
        updatedAt: Timestamp.now()
      });
      
      return commentRef.id;
    });
  } catch (error) {
    console.error('댓글 생성 오류:', error);
    throw new Error(error instanceof Error ? error.message : '댓글을 생성하지 못했습니다. 잠시 후 다시 시도해주세요.');
  }
};

/**
 * 댓글을 수정하는 함수
 * @param commentId 수정할 댓글 ID
 * @param content 새 댓글 내용
 * @param userId 현재 로그인한 사용자 ID
 * @returns 수정 완료 Promise
 */
export const updateComment = async (commentId: string, content: string, userId: string): Promise<void> => {
  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    
    // 작성자 권한 확인
    const commentSnap = await getDoc(commentRef);
    if (!commentSnap.exists()) {
      throw new Error('댓글을 찾을 수 없습니다.');
    }
    
    const commentAuthorId = commentSnap.data().authorId;
    if (commentAuthorId !== userId) {
      throw new Error('자신이 작성한 댓글만 수정할 수 있습니다.');
    }
    
    // 댓글 내용이 비어있는지 확인
    if (!content.trim()) {
      throw new Error('댓글 내용을 입력해주세요.');
    }
    
    await updateDoc(commentRef, {
      content,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('댓글 수정 오류:', error);
    throw new Error(error instanceof Error ? error.message : '댓글을 수정하지 못했습니다. 잠시 후 다시 시도해주세요.');
  }
};

/**
 * 댓글을 삭제하는 함수
 * @param commentId 삭제할 댓글 ID
 * @param postId 게시물 ID
 * @param userId 현재 로그인한 사용자 ID
 * @returns 삭제 완료 Promise
 */
export const deleteComment = async (commentId: string, postId: string, userId: string): Promise<void> => {
  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId);
    
    // 작성자 권한 확인
    const commentSnap = await getDoc(commentRef);
    if (!commentSnap.exists()) {
      throw new Error('댓글을 찾을 수 없습니다.');
    }
    
    const commentAuthorId = commentSnap.data().authorId;
    if (commentAuthorId !== userId) {
      throw new Error('자신이 작성한 댓글만 삭제할 수 있습니다.');
    }
    
    // 트랜잭션을 사용하여 댓글 삭제 및 게시물의 댓글 수 감소를 원자적으로 처리
    await runTransaction(db, async (transaction) => {
      // 1. 댓글 삭제
      transaction.delete(commentRef);
      
      // 2. 게시물의 댓글 수 감소
      const postRef = doc(db, POSTS_COLLECTION, postId);
      transaction.update(postRef, {
        commentCount: increment(-1),
        updatedAt: Timestamp.now()
      });
    });
  } catch (error) {
    console.error('댓글 삭제 오류:', error);
    throw new Error(error instanceof Error ? error.message : '댓글을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.');
  }
}; 

/**
 * 게시물을 북마크에 추가하는 함수
 * @param userId 사용자 ID
 * @param postId 북마크할 게시물 ID
 * @returns 생성된 북마크 ID
 */
export const addBookmark = async (userId: string, postId: string): Promise<string> => {
  try {
    if (!userId || !postId) {
      throw new Error('사용자 ID와 게시물 ID는 필수입니다.');
    }

    // 이미 북마크되어 있는지 확인
    const isAlreadyBookmarked = await isBookmarked(userId, postId);
    if (isAlreadyBookmarked) {
      throw new Error('이미 북마크된 게시물입니다.');
    }

    // 북마크 문서 생성
    const bookmarkRef = doc(collection(db, BOOKMARKS_COLLECTION));
    await setDoc(bookmarkRef, {
      userId,
      postId,
      createdAt: Timestamp.now()
    });

    return bookmarkRef.id;
  } catch (error) {
    console.error('북마크 추가 오류:', error);
    throw new Error(error instanceof Error ? error.message : '북마크를 추가하지 못했습니다. 잠시 후 다시 시도해주세요.');
  }
};

/**
 * 북마크에서 게시물을 제거하는 함수
 * @param userId 사용자 ID
 * @param postId 북마크 해제할 게시물 ID
 */
export const removeBookmark = async (userId: string, postId: string): Promise<void> => {
  try {
    if (!userId || !postId) {
      throw new Error('사용자 ID와 게시물 ID는 필수입니다.');
    }

    // 북마크 조회
    const q = query(
      collection(db, BOOKMARKS_COLLECTION),
      where('userId', '==', userId),
      where('postId', '==', postId),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      throw new Error('북마크를 찾을 수 없습니다.');
    }

    // 북마크 문서 삭제
    const bookmarkDoc = querySnapshot.docs[0];
    await deleteDoc(doc(db, BOOKMARKS_COLLECTION, bookmarkDoc.id));
  } catch (error) {
    console.error('북마크 제거 오류:', error);
    throw new Error(error instanceof Error ? error.message : '북마크를 제거하지 못했습니다. 잠시 후 다시 시도해주세요.');
  }
};

/**
 * 게시물이 북마크되었는지 확인하는 함수
 * @param userId 사용자 ID
 * @param postId 게시물 ID
 * @returns 북마크 여부
 */
export const isBookmarked = async (userId: string, postId: string): Promise<boolean> => {
  try {
    if (!userId || !postId) {
      return false;
    }

    const q = query(
      collection(db, BOOKMARKS_COLLECTION),
      where('userId', '==', userId),
      where('postId', '==', postId),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('북마크 상태 확인 오류:', error);
    return false;
  }
};

/**
 * 사용자가 북마크한 게시물 목록을 가져오는 함수
 * @param userId 사용자 ID
 * @returns 북마크한 게시물 목록
 */
export const fetchBookmarkedPosts = async (userId: string): Promise<UIPost[]> => {
  let attempts = 0;
  
  while (attempts < MAX_RETRY_COUNT) {
    try {
      attempts++;
      
      if (!userId) {
        return [];
      }
      
      // 1. 사용자의 북마크 목록 조회
      const bookmarksQuery = query(
        collection(db, BOOKMARKS_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const bookmarksSnapshot = await getDocs(bookmarksQuery);
      
      if (bookmarksSnapshot.empty) {
        return [];
      }
      
      // 2. 북마크한 게시물 ID 목록 추출
      const postIds = bookmarksSnapshot.docs.map(doc => doc.data().postId);
      
      // 3. 빈 배열이면 조기 반환
      if (postIds.length === 0) {
        return [];
      }
      
      // 4. 각 게시물 정보 조회
      const postsPromises = postIds.map(async (postId) => {
        try {
          const postDoc = await getDoc(doc(db, POSTS_COLLECTION, postId));
          if (postDoc.exists()) {
            const post = mapDocToPost(postDoc as QueryDocumentSnapshot<DocumentData>);
            return convertToUIPost(post);
          }
          return null;
        } catch (error) {
          console.error(`게시물 ID ${postId} 조회 오류:`, error);
          return null;
        }
      });
      
      const posts = await Promise.all(postsPromises);
      
      // null 값 필터링
      return posts.filter((post): post is UIPost => post !== null);
    } catch (error: any) {
      console.error(`북마크 게시물 조회 오류 (시도 ${attempts}/${MAX_RETRY_COUNT}):`, error);
      
      // Firebase 인덱스 오류 처리
      if (error.code === 'failed-precondition' || error.message?.includes('requires an index')) {
        const indexUrl = error.message?.match(/https:\/\/console\.firebase\.google\.com[^\s"]*/)?.[0];
        const indexMessage = indexUrl 
          ? `Firebase 복합 인덱스가 필요합니다. 다음 링크에서 인덱스를 생성해주세요: ${indexUrl}`
          : 'Firebase 복합 인덱스가 필요합니다. Firebase 콘솔에서 인덱스를 생성해주세요.';
        
        console.error(indexMessage);
        throw new Error(`북마크 게시물 조회를 위한 ${indexMessage}`);
      }
      
      if (attempts >= MAX_RETRY_COUNT) {
        throw new Error(`북마크 게시물을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.`);
      }
      
      await delay(attempts);
    }
  }
  
  throw new Error(`북마크 게시물을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.`);
}; 

/**
 * 특정 기간 내에 생성된 게시물을 조회하는 함수
 * @param startDate 시작 날짜 (ISO 문자열)
 * @param endDate 종료 날짜 (ISO 문자열)
 * @returns 조회된 게시물 목록
 */
export const fetchPostsByDateRange = async (startDate: string, endDate: string): Promise<UIPost[]> => {
  let attempts = 0;
  
  while (attempts < MAX_RETRY_COUNT) {
    try {
      attempts++;
      
      // ISO 문자열을 Timestamp로 변환
      const startTimestamp = Timestamp.fromDate(new Date(startDate));
      const endTimestamp = Timestamp.fromDate(new Date(endDate));
      
      const q = query(
        collection(db, POSTS_COLLECTION),
        where('createdAt', '>=', startTimestamp),
        where('createdAt', '<=', endTimestamp),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map(mapDocToPost);
      
      return posts.map(convertToUIPost);
    } catch (error: any) {
      console.error(`기간 내 게시물 조회 오류 (시도 ${attempts}/${MAX_RETRY_COUNT}):`, error);
      
      // Firebase 인덱스 오류 처리
      if (error.code === 'failed-precondition' || error.message?.includes('requires an index')) {
        const indexUrl = error.message?.match(/https:\/\/console\.firebase\.google\.com[^\s"]*/)?.[0];
        const indexMessage = indexUrl 
          ? `Firebase 복합 인덱스가 필요합니다. 다음 링크에서 인덱스를 생성해주세요: ${indexUrl}`
          : 'Firebase 복합 인덱스가 필요합니다. Firebase 콘솔에서 인덱스를 생성해주세요.';
        
        console.error(indexMessage);
        throw new Error(`기간 조회를 위한 ${indexMessage}`);
      }
      
      if (attempts >= MAX_RETRY_COUNT) {
        throw new Error(`기간 내 게시물을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.`);
      }
      
      await delay(attempts);
    }
  }
  
  throw new Error(`기간 내 게시물을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.`);
};

/**
 * 특정 기간 내에 수정된 게시물을 조회하는 함수
 * @param startDate 시작 날짜 (ISO 문자열)
 * @param endDate 종료 날짜 (ISO 문자열)
 * @returns 조회된 게시물 목록
 */
export const fetchUpdatedPostsByDateRange = async (startDate: string, endDate: string): Promise<UIPost[]> => {
  let attempts = 0;
  
  while (attempts < MAX_RETRY_COUNT) {
    try {
      attempts++;
      
      // ISO 문자열을 Timestamp로 변환
      const startTimestamp = Timestamp.fromDate(new Date(startDate));
      const endTimestamp = Timestamp.fromDate(new Date(endDate));
      
      const q = query(
        collection(db, POSTS_COLLECTION),
        where('updatedAt', '>=', startTimestamp),
        where('updatedAt', '<=', endTimestamp),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map(mapDocToPost);
      
      return posts.map(convertToUIPost);
    } catch (error: any) {
      console.error(`기간 내 수정 게시물 조회 오류 (시도 ${attempts}/${MAX_RETRY_COUNT}):`, error);
      
      // Firebase 인덱스 오류 처리
      if (error.code === 'failed-precondition' || error.message?.includes('requires an index')) {
        const indexUrl = error.message?.match(/https:\/\/console\.firebase\.google\.com[^\s"]*/)?.[0];
        const indexMessage = indexUrl 
          ? `Firebase 복합 인덱스가 필요합니다. 다음 링크에서 인덱스를 생성해주세요: ${indexUrl}`
          : 'Firebase 복합 인덱스가 필요합니다. Firebase 콘솔에서 인덱스를 생성해주세요.';
        
        console.error(indexMessage);
        throw new Error(`수정된 게시물 조회를 위한 ${indexMessage}`);
      }
      
      if (attempts >= MAX_RETRY_COUNT) {
        throw new Error(`기간 내 수정 게시물을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.`);
      }
      
      await delay(attempts);
    }
  }
  
  throw new Error(`기간 내 수정 게시물을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.`);
}; 

/**
 * Firestore에서 카테고리 목록을 가져오는 함수
 * @returns 카테고리 목록
 */
export const fetchCategoriesFromFirestore = async (): Promise<{ id: string; name: string; icon?: string }[]> => {
  let attempts = 0;
  
  console.log('Firestore에서 카테고리 목록 조회 시작');
  
  while (attempts < MAX_RETRY_COUNT) {
    try {
      attempts++;
      console.log(`카테고리 목록 조회 시도 ${attempts}/${MAX_RETRY_COUNT}`);
      
      const settingsRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
      const settingsSnap = await getDoc(settingsRef);
      
      if (!settingsSnap.exists()) {
        console.error('설정 문서가 존재하지 않습니다. 초기 설정이 필요합니다.');
        
        // 초기 설정 문서 생성 시도
        try {
          console.log('설정 문서 생성 시도...');
          
          // 기본 카테고리 설정
          const defaultCategories = [
            { id: 'general', name: '자유게시판', icon: '📝' }
          ];
          
          await setDoc(settingsRef, {
            categories: defaultCategories,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });
          console.log('설정 문서가 생성되었습니다.');
          
          // 새로 생성된 카테고리 반환
          return defaultCategories;
        } catch (initError) {
          console.error('설정 문서 초기화 실패:', initError);
          throw new Error(`설정 초기화에 실패했습니다: ${initError instanceof Error ? initError.message : '알 수 없는 오류'}`);
        }
      }
      
      const settingsData = settingsSnap.data();
      const categories = settingsData.categories || [];
      
      console.log(`카테고리 목록 조회 성공: ${categories.length}개 카테고리 발견`);
      
      // 카테고리 정렬 (기본 카테고리를 먼저 표시)
      return categories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon // 아이콘 필드 추가
      }));
    } catch (error) {
      console.error(`카테고리 조회 오류 (시도 ${attempts}/${MAX_RETRY_COUNT}):`, error);
      
      if (attempts >= MAX_RETRY_COUNT) {
        throw new Error('카테고리 목록을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.');
      }
      
      await delay(attempts);
    }
  }
  
  throw new Error('카테고리 목록을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.');
}; 