/**
 * 관리자 전용 게시물 관리 함수
 * 게시물 목록 조회, 필터링, 정렬, 수정, 삭제 기능을 제공합니다.
 */
import { 
  collection, 
  doc,
  getDocs, 
  getDoc,
  updateDoc,
  deleteDoc,
  query, 
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  writeBatch,
  runTransaction,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { isAdminAuthenticated } from './auth';
import { convertToUIPost } from '../firebase/firestore';
import type { Post, UIPost } from '../../types/index';

// Firestore 컬렉션 이름
const POSTS_COLLECTION = 'posts';
const COMMENTS_COLLECTION = 'comments';

// 페이지당 기본 게시물 수
const DEFAULT_PAGE_SIZE = 20;

// 관리자 권한 검증 에러 메시지
const ADMIN_AUTH_ERROR = '관리자 권한이 필요합니다.';

/**
 * 관리자 권한 검증 함수
 * @throws {Error} 관리자가 아닌 경우 에러 발생
 */
const verifyAdminAuth = () => {
  if (!isAdminAuthenticated()) {
    throw new Error(ADMIN_AUTH_ERROR);
  }
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
    author: {
      name: data.author?.name || '알 수 없음',
    },
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
 * 수정 이력 객체 생성 함수
 * @param adminId 관리자 ID
 * @param reason 수정 사유
 * @returns 수정 이력 객체
 */
const createEditHistory = (adminId: string, reason?: string) => {
  return {
    // serverTimestamp() 대신 현재 시간을 Timestamp로 직접 생성
    editedAt: Timestamp.now(),
    editedBy: adminId,
    reason: reason || '관리자에 의한 수정'
  };
};

/**
 * 관리자용 모든 게시물 조회 함수 (페이지네이션 지원)
 * @param options 조회 옵션 (페이지 크기, 마지막 문서, 정렬 기준 등)
 * @returns 게시물 목록과 페이지네이션 정보
 */
export const fetchAllPostsAdmin = async (options: {
  pageSize?: number;
  lastVisible?: QueryDocumentSnapshot<DocumentData>;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
  category?: string;
  tag?: string;
  authorId?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
} = {}) => {
  // 관리자 권한 검증
  verifyAdminAuth();

  try {
    const {
      pageSize = DEFAULT_PAGE_SIZE,
      lastVisible,
      sortField = 'createdAt',
      sortOrder = 'desc',
      category,
      tag,
      authorId,
      startDate,
      endDate,
      searchTerm
    } = options;

    // 쿼리 기본 설정
    let q = collection(db, POSTS_COLLECTION);
    let constraints: any[] = [orderBy(sortField, sortOrder)];

    // 필터링 조건 추가
    if (category) {
      constraints.push(where('category', '==', category));
    }

    if (tag) {
      constraints.push(where('tags', 'array-contains', tag));
    }

    if (authorId) {
      constraints.push(where('authorId', '==', authorId));
    }

    // 날짜 범위 필터링
    if (startDate && endDate) {
      const startTimestamp = Timestamp.fromDate(new Date(startDate));
      const endTimestamp = Timestamp.fromDate(new Date(endDate));
      constraints.push(where('createdAt', '>=', startTimestamp));
      constraints.push(where('createdAt', '<=', endTimestamp));
    }

    // 페이지네이션 처리
    if (lastVisible) {
      constraints.push(startAfter(lastVisible));
    }

    constraints.push(limit(pageSize));

    // 쿼리 실행
    const querySnapshot = await getDocs(query(q, ...constraints));
    
    // 결과 매핑
    const posts = querySnapshot.docs.map((doc) => {
      const post = mapDocToPost(doc);
      return convertToUIPost(post);
    });

    // 검색어 필터링 (Firestore에서 전체 텍스트 검색이 제한적이므로 클라이언트에서 처리)
    const filteredPosts = searchTerm 
      ? posts.filter(post => 
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.author.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : posts;

    // 페이지네이션 정보
    const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    const hasMore = querySnapshot.docs.length === pageSize;

    return {
      posts: filteredPosts,
      pagination: {
        lastVisible: lastVisibleDoc,
        hasMore
      }
    };
  } catch (error) {
    console.error('관리자 게시물 조회 오류:', error);
    throw new Error(`게시물 조회 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
};

/**
 * 관리자용 게시물 상세 조회 함수
 * @param postId 게시물 ID
 * @returns 게시물 상세 정보
 */
export const fetchPostDetailAdmin = async (postId: string) => {
  // 관리자 권한 검증
  verifyAdminAuth();

  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      throw new Error(`ID가 ${postId}인 게시물을 찾을 수 없습니다.`);
    }

    // 원본 데이터 (수정 이력 등 포함)
    const postData = postSnap.data();
    const post = mapDocToPost(postSnap as QueryDocumentSnapshot<DocumentData>);
    
    // 댓글 수 조회
    const commentsQuery = query(
      collection(db, COMMENTS_COLLECTION),
      where('postId', '==', postId)
    );
    const commentsSnap = await getDocs(commentsQuery);
    
    return {
      ...convertToUIPost(post),
      rawData: postData,
      commentCount: commentsSnap.docs.length,
      editHistory: postData.editHistory || []
    };
  } catch (error) {
    console.error(`게시물 상세 조회 오류 (ID: ${postId}):`, error);
    throw new Error(`게시물 상세 정보를 가져오는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
};

/**
 * 관리자용 게시물 수정 함수
 * @param postId 게시물 ID
 * @param postData 수정할 게시물 데이터
 * @param adminId 관리자 ID
 * @param reason 수정 사유
 * @returns 수정된 게시물 정보
 */
export const updatePostAdmin = async (
  postId: string, 
  postData: Partial<Post> | Partial<UIPost>, 
  adminId: string,
  reason?: string
) => {
  // 관리자 권한 검증
  verifyAdminAuth();

  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      throw new Error(`ID가 ${postId}인 게시물을 찾을 수 없습니다.`);
    }

    // 수정할 데이터 준비
    const updateData: Record<string, any> = {
      ...postData,
      updatedAt: serverTimestamp()
    };

    // 날짜 형식 변환 (UIPost에서 Post로 변환 시 필요)
    if ('date' in postData) {
      delete updateData.date;
    }

    // 수정 이력 추가 - serverTimestamp() 대신 Timestamp.now() 사용
    const editHistory = createEditHistory(adminId, reason);
    
    // 기존 이력이 있는 경우 배열에 추가, 없는 경우 새 배열 생성
    const existingHistory = postSnap.data().editHistory || [];
    updateData.editHistory = [...existingHistory, editHistory];

    // 게시물 업데이트
    await updateDoc(postRef, updateData);

    // 업데이트된 게시물 조회
    const updatedPostSnap = await getDoc(postRef);
    const updatedPost = mapDocToPost(updatedPostSnap as QueryDocumentSnapshot<DocumentData>);

    return convertToUIPost(updatedPost);
  } catch (error) {
    console.error(`게시물 수정 오류 (ID: ${postId}):`, error);
    throw new Error(`게시물 수정 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
};

/**
 * 관리자용 게시물 삭제 함수
 * @param postId 게시물 ID
 */
export const deletePostAdmin = async (postId: string) => {
  // 관리자 권한 검증
  verifyAdminAuth();

  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      throw new Error(`ID가 ${postId}인 게시물을 찾을 수 없습니다.`);
    }

    // 트랜잭션으로 게시물과 관련 댓글 삭제
    await runTransaction(db, async (transaction) => {
      // 게시물 삭제
      transaction.delete(postRef);

      // 관련 댓글 조회
      const commentsQuery = query(
        collection(db, COMMENTS_COLLECTION),
        where('postId', '==', postId)
      );
      const commentsSnap = await getDocs(commentsQuery);

      // 관련 댓글 삭제
      commentsSnap.docs.forEach((commentDoc) => {
        transaction.delete(commentDoc.ref);
      });
    });
  } catch (error) {
    console.error(`게시물 삭제 오류 (ID: ${postId}):`, error);
    throw new Error(`게시물 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
};

/**
 * 관리자용 게시물 일괄 삭제 함수
 * @param postIds 삭제할 게시물 ID 배열
 * @returns 삭제된 게시물 수
 */
export const bulkDeletePostsAdmin = async (postIds: string[]) => {
  // 관리자 권한 검증
  verifyAdminAuth();

  if (!postIds.length) {
    return { deletedCount: 0 };
  }

  try {
    const batch = writeBatch(db);
    let deletedCount = 0;

    // 게시물 일괄 삭제
    for (const postId of postIds) {
      const postRef = doc(db, POSTS_COLLECTION, postId);
      const postSnap = await getDoc(postRef);

      if (postSnap.exists()) {
        batch.delete(postRef);
        deletedCount++;
      }
    }

    // 배치 커밋
    await batch.commit();

    // 관련 댓글 삭제 (별도 배치로 처리)
    for (const postId of postIds) {
      const commentsQuery = query(
        collection(db, COMMENTS_COLLECTION),
        where('postId', '==', postId)
      );
      const commentsSnap = await getDocs(commentsQuery);
      
      if (commentsSnap.docs.length > 0) {
        const commentBatch = writeBatch(db);
        commentsSnap.docs.forEach((commentDoc) => {
          commentBatch.delete(commentDoc.ref);
        });
        await commentBatch.commit();
      }
    }

    return { deletedCount };
  } catch (error) {
    console.error('게시물 일괄 삭제 오류:', error);
    throw new Error(`게시물 일괄 삭제 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
};

/**
 * 관리자용 게시물 통계 정보 조회 함수
 * @returns 게시물 통계 정보
 */
export const fetchPostStatsAdmin = async () => {
  // 관리자 권한 검증
  verifyAdminAuth();

  try {
    // 모든 게시물 조회
    const postsSnap = await getDocs(collection(db, POSTS_COLLECTION));
    const posts = postsSnap.docs.map(doc => doc.data());

    // 카테고리별 게시물 수
    const categoryCounts: Record<string, number> = {};
    posts.forEach(post => {
      const category = post.category || 'uncategorized';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    // 태그별 게시물 수
    const tagCounts: Record<string, number> = {};
    posts.forEach(post => {
      const tags = post.tags || [];
      tags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // 작성자별 게시물 수
    const authorCounts: Record<string, number> = {};
    posts.forEach(post => {
      const authorId = post.authorId || 'anonymous';
      authorCounts[authorId] = (authorCounts[authorId] || 0) + 1;
    });

    // 월별 게시물 수
    const monthlyCounts: Record<string, number> = {};
    posts.forEach(post => {
      if (post.createdAt) {
        const date = post.createdAt.toDate();
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyCounts[monthYear] = (monthlyCounts[monthYear] || 0) + 1;
      }
    });

    return {
      totalPosts: postsSnap.docs.length,
      categoryCounts,
      tagCounts,
      authorCounts,
      monthlyCounts
    };
  } catch (error) {
    console.error('게시물 통계 조회 오류:', error);
    throw new Error(`게시물 통계 정보를 가져오는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}; 

/**
 * 새 게시물 생성 함수
 * @param postData 생성할 게시물 데이터
 * @param adminId 관리자 ID
 * @returns 생성된 게시물 정보
 */
export const createPostAdmin = async (
  postInput: Partial<Post> | Partial<UIPost>,
  adminId: string
): Promise<UIPost> => {
  if (!isAdminAuthenticated()) {
    throw new Error('관리자 권한이 필요합니다.');
  }

  try {
    // 현재 시간 생성
    const now = Timestamp.now();
    
    // 게시물 컬렉션 참조
    const postsRef = collection(db, 'posts');
    
    // 새 게시물 데이터 구성
    const newPostData: Partial<Post> = {
      title: postInput.title || '제목 없음',
      content: postInput.content || '',
      category: postInput.category || 'general',
      tags: Array.isArray(postInput.tags) ? postInput.tags : [],
      author: {
        name: '관리자'
      },
      authorId: adminId,
      createdAt: now,
      updatedAt: now,
      commentCount: 0,
      viewCount: 0
    };
    
    // Firestore에 새 게시물 추가
    const docRef = await addDoc(postsRef, newPostData);
    
    // 생성된 게시물 ID로 문서 다시 조회
    const postSnap = await getDoc(docRef);
    
    if (!postSnap.exists()) {
      throw new Error('게시물 생성 후 조회 실패');
    }
    
    // 문서 데이터와 ID를 결합하여 Post 객체 생성
    const docData = postSnap.data();
    const post: Post = {
      id: postSnap.id,
      title: docData.title || '제목 없음',
      content: docData.content || '',
      category: docData.category || 'general',
      author: {
        name: docData.author?.name || '관리자'
      },
      authorId: docData.authorId || adminId,
      tags: docData.tags || [],
      createdAt: docData.createdAt || now,
      updatedAt: docData.updatedAt || now,
      commentCount: docData.commentCount || 0,
      viewCount: docData.viewCount || 0,
      isNew: true
    };
    
    // UI 표시용 게시물 데이터로 변환
    return convertToUIPost(post);
  } catch (error) {
    console.error('게시물 생성 오류:', error);
    throw error instanceof Error ? error : new Error('게시물 생성 중 오류가 발생했습니다.');
  }
}; 