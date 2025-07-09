/**
 * 관리자 전용 카테고리 관리 함수
 * 카테고리 목록 조회, 추가, 수정, 삭제 기능을 제공합니다.
 */
import { 
  doc,
  getDoc, 
  updateDoc,
  Timestamp,
  arrayUnion,
  arrayRemove,
  runTransaction,
  collection,
  query,
  where,
  getDocs,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { isAdminAuthenticated } from './auth';

// Firestore 설정 문서 정보
const SETTINGS_COLLECTION = 'settings';
const GLOBAL_SETTINGS_ID = 'global-settings';
const POSTS_COLLECTION = 'posts';

// 관리자 권한 검증 에러 메시지
const ADMIN_AUTH_ERROR = '관리자 권한이 필요합니다.';
const NOT_FOUND_ERROR = '설정 데이터를 찾을 수 없습니다.';
const UPDATE_ERROR = '카테고리 업데이트 중 오류가 발생했습니다.';

// 에러 발생 시 최대 재시도 횟수
const MAX_RETRY_COUNT = 5;

/**
 * 지수 백오프 지연 함수 (랜덤 지터 포함)
 * 재시도 사이에 점점 늘어나는 지연 시간을 적용하고, 일부 랜덤 지연을 추가하여
 * 여러 요청이 동시에 재시도되는 것을 방지합니다.
 * @param attempts 시도 횟수
 * @returns Promise 객체
 */
const delay = (attempts: number) => {
  return new Promise(resolve => {
    // 기본 지수 백오프 계산 (2초, 4초, 8초, 16초, 32초)
    const baseWaitTime = Math.pow(2, attempts) * 1000;
    // 기본 대기 시간의 0-25% 사이의 랜덤 지터 추가
    const jitter = Math.floor(Math.random() * (baseWaitTime * 0.25));
    const waitTime = baseWaitTime + jitter;
    
    console.log(`재시도 대기 시간: ${waitTime}ms (시도 ${attempts}/${MAX_RETRY_COUNT})`);
    setTimeout(resolve, waitTime);
  });
};

/**
 * 오류 메시지를 안전하게 문자열로 변환하는 함수
 * @param error 오류 객체
 * @returns 문자열화된 오류 메시지
 */
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '알 수 없는 오류';
};

/**
 * 카테고리 인터페이스
 */
export interface CategoryItem {
  id: string;
  name: string;
  icon?: string; // 아이콘 이름 (선택적 필드)
}

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
 * 모든 카테고리 조회 함수
 * @returns 카테고리 목록
 */
export const fetchCategories = async (): Promise<CategoryItem[]> => {
  let attempts = 0;
  
  while (attempts < MAX_RETRY_COUNT) {
    try {
      attempts++;
      
      // 전역 설정 문서 조회
      const settingsRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
      const settingsSnap = await getDoc(settingsRef);
      
      if (!settingsSnap.exists()) {
        throw new Error(NOT_FOUND_ERROR);
      }
      
      const settingsData = settingsSnap.data();
      return settingsData.categories || [];
    } catch (error) {
      console.error(`카테고리 조회 오류 (시도 ${attempts}/${MAX_RETRY_COUNT}):`, error);
      
      // resource-exhausted 에러인 경우 재시도
      const errorMsg = getErrorMessage(error);
      if (errorMsg.includes('resource-exhausted') && attempts < MAX_RETRY_COUNT) {
        console.log(`Firebase 쿼터 초과로 인한 재시도: ${attempts}/${MAX_RETRY_COUNT}`);
        await delay(attempts);
        continue;
      }
      
      if (attempts >= MAX_RETRY_COUNT) {
        throw new Error(`카테고리 목록을 가져오는 중 오류가 발생했습니다: ${errorMsg}`);
      }
      
      // 다른 오류도 재시도
      await delay(attempts);
    }
  }
  
  throw new Error('카테고리 목록을 가져오는 중 오류가 발생했습니다: 재시도 횟수 초과');
};

/**
 * 관리자용 카테고리 추가 함수 (트랜잭션 없이 구현)
 * @param category 추가할 카테고리 정보
 * @returns 추가된 카테고리 ID
 */
export const addCategory = async (category: Omit<CategoryItem, 'id'>): Promise<string> => {
  // 관리자 권한 검증
  verifyAdminAuth();
  
  let attempts = 0;
  
  while (attempts < MAX_RETRY_COUNT) {
    try {
      attempts++;
      
      // 새 카테고리 ID 생성 (소문자 알파벳과 숫자만 포함)
      const newId = category.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
        
      if (!newId) {
        throw new Error('유효한 카테고리 ID를 생성할 수 없습니다. 카테고리 이름을 확인해주세요.');
      }

      console.log(`카테고리 추가 시도: ${category.name} (ID: ${newId})`);

      // 설정 문서 참조
      const settingsRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
      
      // 1. 먼저 설정 문서를 가져옵니다 (트랜잭션 대신 단일 쿼리)
      const settingsSnap = await getDoc(settingsRef);
      
      if (!settingsSnap.exists()) {
        console.error('설정 문서가 존재하지 않습니다. 초기 설정이 필요합니다.');
        
        // 초기 설정 문서 생성 시도
        try {
          await setDoc(settingsRef, {
            categories: [],
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });
          console.log('설정 문서가 생성되었습니다.');
          
          // 새로운 카테고리 추가를 위해 빈 배열로 계속 진행
          const newCategory: CategoryItem = { 
            id: newId, 
            name: category.name
          };
          
          if (category.icon !== undefined) {
            newCategory.icon = category.icon;
          }
          
          await updateDoc(settingsRef, {
            categories: [newCategory],
            updatedAt: Timestamp.now()
          });
          
          console.log(`카테고리 '${category.name}' 추가 성공 (ID: ${newId})`);
          return newId;
        } catch (initError) {
          console.error('설정 문서 초기화 실패:', initError);
          throw new Error(`설정 초기화에 실패했습니다: ${getErrorMessage(initError)}`);
        }
      }
      
      const settingsData = settingsSnap.data();
      const categories = settingsData.categories || [];
      
      console.log(`현재 카테고리 수: ${categories.length}`);
      
      // 2. 중복 ID 검사
      if (categories.some((cat: CategoryItem) => cat.id === newId)) {
        throw new Error(`ID '${newId}'는 이미 사용 중입니다. 다른 카테고리 이름을 선택해주세요.`);
      }
      
      // 3. 중복 이름 검사
      if (categories.some((cat: CategoryItem) => cat.name === category.name)) {
        throw new Error(`이름 '${category.name}'은(는) 이미 사용 중입니다. 다른 카테고리 이름을 선택해주세요.`);
      }
      
      // 4. 새 카테고리 추가
      const newCategory: CategoryItem = { 
        id: newId, 
        name: category.name
      };
      
      // 아이콘이 제공된 경우 추가 (빈 문자열도 유효한 값으로 처리)
      if (category.icon !== undefined) {
        newCategory.icon = category.icon;
      }
      
      const updatedCategories = [...categories, newCategory];
      
      // 현재 타임스탬프를 한 번만 생성하여 재사용
      const now = Timestamp.now();
      
      // 5. 문서 업데이트 (트랜잭션 대신 단일 업데이트)
      await updateDoc(settingsRef, {
        categories: updatedCategories,
        updatedAt: now
      });
      
      const iconText = typeof category.icon === 'string' ? category.icon : '없음';
      console.log(`카테고리 '${category.name}' 추가 성공 (ID: ${newId}, 아이콘: ${iconText})`);
      
      // 명시적 타입 변환 없이 문자열 반환
      return newId;
      
    } catch (error) {
      console.error(`카테고리 추가 오류 (시도 ${attempts}/${MAX_RETRY_COUNT}):`, error);
      
      // resource-exhausted 에러인 경우 재시도
      const errorMsg = getErrorMessage(error);
      if (errorMsg.includes('resource-exhausted') && attempts < MAX_RETRY_COUNT) {
        console.log(`Firebase 쿼터 초과로 인한 재시도: ${attempts}/${MAX_RETRY_COUNT}`);
        await delay(attempts);
        continue;
      }
      
      if (attempts >= MAX_RETRY_COUNT) {
        throw new Error(`카테고리 추가 중 오류가 발생했습니다: ${errorMsg}`);
      }
      
      // 다른 오류도 재시도
      await delay(attempts);
    }
  }
  
  throw new Error('카테고리 추가 중 오류가 발생했습니다: 재시도 횟수 초과');
};

/**
 * 관리자용 카테고리 수정 함수
 * @param categoryId 수정할 카테고리 ID
 * @param updatedName 새 카테고리 이름
 * @param icon 카테고리 아이콘 (선택적)
 * @returns 수정 성공 여부
 */
export const updateCategory = async (
  categoryId: string, 
  updatedName: string,
  icon?: string
): Promise<boolean> => {
  // 관리자 권한 검증
  verifyAdminAuth();
  
  let attempts = 0;
  
  while (attempts < MAX_RETRY_COUNT) {
    try {
      attempts++;
      
      // 설정 문서 참조
      const settingsRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
      
      // 트랜잭션 대신 일반 업데이트로 변경하여 에러 방지
      // 1. 먼저 설정 문서를 가져옵니다
      const settingsSnap = await getDoc(settingsRef);
      
      if (!settingsSnap.exists()) {
        throw new Error(NOT_FOUND_ERROR);
      }
      
      const settingsData = settingsSnap.data();
      const categories = settingsData.categories || [];
      
      // 대상 카테고리 검색
      const categoryIndex = categories.findIndex((cat: CategoryItem) => cat.id === categoryId);
      
      if (categoryIndex === -1) {
        throw new Error(`ID가 '${categoryId}'인 카테고리를 찾을 수 없습니다.`);
      }
      
      // 중복 이름 검사 (다른 카테고리와 이름 중복 확인)
      if (categories.some((cat: CategoryItem, index: number) => 
          cat.name === updatedName && index !== categoryIndex)) {
        throw new Error(`이름 '${updatedName}'은(는) 이미 사용 중입니다. 다른 카테고리 이름을 선택해주세요.`);
      }
      
      // 새 카테고리 배열 생성
      const updatedCategories = [...categories];
      
      // 기존 카테고리 객체 가져오기
      const existingCategory = { ...updatedCategories[categoryIndex] };
      
      // 업데이트할 필드 설정
      const updatedCategory: CategoryItem = { 
        ...existingCategory,
        name: updatedName
      };
      
      // 아이콘이 제공된 경우 추가 또는 제거
      if (icon !== undefined) {
        updatedCategory.icon = icon || undefined;
      }
      
      // 업데이트된 카테고리로 교체
      updatedCategories[categoryIndex] = updatedCategory;
      
      // 업데이트 실행
      await updateDoc(settingsRef, {
        categories: updatedCategories,
        updatedAt: Timestamp.now()
      });
      
      return true;
      
    } catch (error) {
      console.error(`카테고리 수정 오류 (ID: ${categoryId}, 시도 ${attempts}/${MAX_RETRY_COUNT}):`, error);
      
      // resource-exhausted 에러인 경우 재시도
      const errorMsg = getErrorMessage(error);
      if (errorMsg.includes('resource-exhausted') && attempts < MAX_RETRY_COUNT) {
        console.log(`Firebase 쿼터 초과로 인한 재시도: ${attempts}/${MAX_RETRY_COUNT}`);
        await delay(attempts);
        continue;
      }
      
      if (attempts >= MAX_RETRY_COUNT) {
        throw new Error(`카테고리 수정 중 오류가 발생했습니다: ${errorMsg}`);
      }
      
      // 다른 오류도 재시도
      await delay(attempts);
    }
  }
  
  throw new Error(`카테고리 수정 중 오류가 발생했습니다: 재시도 횟수 초과`);
};

/**
 * 관리자용 카테고리 삭제 함수
 * @param categoryId 삭제할 카테고리 ID
 * @returns 삭제 성공 여부
 */
export const deleteCategory = async (categoryId: string): Promise<boolean> => {
  // 관리자 권한 검증
  verifyAdminAuth();
  
  let attempts = 0;
  
  while (attempts < MAX_RETRY_COUNT) {
    try {
      attempts++;
      
      // 설정 문서 참조
      const settingsRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
      const settingsSnap = await getDoc(settingsRef);
      
      if (!settingsSnap.exists()) {
        throw new Error(NOT_FOUND_ERROR);
      }
      
      const settingsData = settingsSnap.data();
      const categories = settingsData.categories || [];
      
      // 대상 카테고리 검색
      const categoryToDelete = categories.find((cat: CategoryItem) => cat.id === categoryId);
      
      if (!categoryToDelete) {
        throw new Error(`ID가 '${categoryId}'인 카테고리를 찾을 수 없습니다.`);
      }
      
      // 트랜잭션 시작 - 카테고리 삭제 및 게시물 카테고리 변경
      return await runTransaction(db, async (transaction) => {
        // 1. 해당 카테고리의 게시물 조회
        const postsQuery = query(
          collection(db, POSTS_COLLECTION),
          where('category', '==', categoryId)
        );
        const postsSnapshot = await getDocs(postsQuery);
        
        // 2. 남아있는 카테고리 중 첫 번째 카테고리를 찾아서 사용
        const remainingCategories = categories.filter((cat: CategoryItem) => cat.id !== categoryId);
        const targetCategoryId = remainingCategories.length > 0 ? remainingCategories[0].id : '';
        
        if (postsSnapshot.size > 0) {
          if (!targetCategoryId) {
            throw new Error('게시물을 이동할 카테고리가 없습니다. 최소한 하나의 카테고리가 필요합니다.');
          }
          
          // 모든 게시물의 카테고리를 첫 번째 카테고리로 변경
          postsSnapshot.docs.forEach(postDoc => {
            const postRef = doc(db, POSTS_COLLECTION, postDoc.id);
            transaction.update(postRef, { 
              category: targetCategoryId,
              updatedAt: Timestamp.now()
            });
          });
        }
        
        // 3. 카테고리 삭제
        transaction.update(settingsRef, {
          categories: arrayRemove(categoryToDelete),
          updatedAt: Timestamp.now()
        });
        
        console.log(`카테고리 '${categoryId}' 삭제 완료, ${postsSnapshot.size}개의 게시물을 '${targetCategoryId}' 카테고리로 이동했습니다.`);
        return true;
      });
    } catch (error) {
      console.error(`카테고리 삭제 오류 (ID: ${categoryId}, 시도 ${attempts}/${MAX_RETRY_COUNT}):`, error);
      
      // resource-exhausted 에러인 경우 재시도
      const errorMsg = getErrorMessage(error);
      if (errorMsg.includes('resource-exhausted') && attempts < MAX_RETRY_COUNT) {
        console.log(`Firebase 쿼터 초과로 인한 재시도: ${attempts}/${MAX_RETRY_COUNT}`);
        await delay(attempts);
        continue;
      }
      
      if (attempts >= MAX_RETRY_COUNT) {
        throw new Error(`카테고리 삭제 중 오류가 발생했습니다: ${errorMsg}`);
      }
      
      // 다른 오류도 재시도
      await delay(attempts);
    }
  }
  
  throw new Error(`카테고리 삭제 중 오류가 발생했습니다: 재시도 횟수 초과`);
};

/**
 * 카테고리 순서 변경 함수
 * @param sortedCategories 정렬된 카테고리 목록
 * @returns 업데이트 성공 여부
 */
export const reorderCategories = async (sortedCategories: CategoryItem[]): Promise<boolean> => {
  // 관리자 권한 검증
  verifyAdminAuth();
  
  let attempts = 0;
  
  while (attempts < MAX_RETRY_COUNT) {
    try {
      attempts++;
      
      // 기존 카테고리 가져오기
      const settingsRef = doc(db, SETTINGS_COLLECTION, GLOBAL_SETTINGS_ID);
      const settingsSnap = await getDoc(settingsRef);
      
      if (!settingsSnap.exists()) {
        throw new Error(NOT_FOUND_ERROR);
      }
      
      // 카테고리 유효성 검사 (모든 기존 카테고리가 포함되어 있는지)
      const existingCategories = settingsSnap.data().categories || [];
      const existingIds = new Set(existingCategories.map((cat: CategoryItem) => cat.id));
      const newIds = new Set(sortedCategories.map((cat: CategoryItem) => cat.id));
      
      // 삭제된 ID 확인
      for (const id of existingIds) {
        if (!newIds.has(id)) {
          throw new Error(`카테고리 ID '${id}'가 누락되었습니다. 모든 기존 카테고리를 포함해야 합니다.`);
        }
      }
      
      // 추가된 ID 확인
      for (const id of newIds) {
        if (!existingIds.has(id)) {
          throw new Error(`카테고리 ID '${id}'는 기존에 존재하지 않습니다. 새 카테고리는 추가할 수 없습니다.`);
        }
      }
      
      // 순서 업데이트
      await updateDoc(settingsRef, {
        categories: sortedCategories as CategoryItem[],
        updatedAt: Timestamp.now()
      });
      
      return true;
    } catch (error) {
      console.error(`카테고리 순서 변경 오류 (시도 ${attempts}/${MAX_RETRY_COUNT}):`, error);
      
      // resource-exhausted 에러인 경우 재시도
      const errorMsg = getErrorMessage(error);
      if (errorMsg.includes('resource-exhausted') && attempts < MAX_RETRY_COUNT) {
        console.log(`Firebase 쿼터 초과로 인한 재시도: ${attempts}/${MAX_RETRY_COUNT}`);
        await delay(attempts);
        continue;
      }
      
      if (attempts >= MAX_RETRY_COUNT) {
        throw new Error(`카테고리 순서 변경 중 오류가 발생했습니다: ${errorMsg}`);
      }
      
      // 다른 오류도 재시도
      await delay(attempts);
    }
  }
  
  throw new Error(`카테고리 순서 변경 중 오류가 발생했습니다: 재시도 횟수 초과`);
}; 