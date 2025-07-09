/**
 * 관리자 전용 데이터 백업/복원 함수
 * 시스템 데이터를 JSON 형식으로 내보내거나 복원하는 기능을 제공합니다.
 */
import { 
  collection,
  getDocs,
  writeBatch,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  limit,
  DocumentData,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { isAdminAuthenticated } from './auth';

// Firestore 컬렉션 이름
const POSTS_COLLECTION = 'posts';
const COMMENTS_COLLECTION = 'comments';
const SETTINGS_COLLECTION = 'settings';
const USERS_COLLECTION = 'users';
const BOOKMARKS_COLLECTION = 'bookmarks';

// 관리자 권한 검증 에러 메시지
const ADMIN_AUTH_ERROR = '관리자 권한이 필요합니다.';

// 에러 핸들링을 위한 도우미 함수
const handleError = (error: unknown, message: string) => {
  const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
  console.error(`${message}: ${errorMessage}`, error);
  throw new Error(`${message}: ${errorMessage}`);
};

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
 * 타임스탬프 객체를 ISO 문자열로 변환하는 함수
 * @param timestamp Firebase Timestamp 객체
 * @returns ISO 형식의 날짜 문자열
 */
const timestampToISOString = (timestamp: any): string => {
  if (!timestamp) return '';
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return '';
};

/**
 * ISO 문자열을 타임스탬프로 변환하는 함수
 * @param isoString ISO 형식의 날짜 문자열
 * @returns Firebase Timestamp 객체
 */
const isoStringToTimestamp = (isoString: string): Timestamp | null => {
  if (!isoString) return null;
  
  try {
    // 먼저 자바스크립트 Date 객체로 변환
    const date = new Date(isoString);
    
    // 올바른 날짜인지 확인 (Invalid Date가 아닌지)
    if (isNaN(date.getTime())) {
      console.error('올바르지 않은 날짜 형식:', isoString);
      return null;
    }
    
    // Timestamp 객체로 변환
    return Timestamp.fromDate(date);
  } catch (error) {
    console.error('날짜 변환 오류:', error, isoString);
    return null;
  }
};

/**
 * 문서 데이터에서 타임스탬프를 ISO 문자열로 변환하는 함수
 * @param data Firestore 문서 데이터
 * @returns 변환된 데이터
 */
const convertTimestampsToISOStrings = (data: any): any => {
  if (!data) return data;
  
  // 객체인 경우 재귀적으로 처리
  if (typeof data === 'object' && data !== null) {
    // 배열인 경우
    if (Array.isArray(data)) {
      return data.map(item => convertTimestampsToISOStrings(item));
    }
    
    // Timestamp 객체인 경우
    if (data instanceof Timestamp) {
      return timestampToISOString(data);
    }
    
    // 일반 객체인 경우 각 필드를 재귀적으로 처리
    const result: Record<string, any> = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = convertTimestampsToISOStrings(data[key]);
      }
    }
    return result;
  }
  
  return data;
};

/**
 * 문서 데이터에서 ISO 문자열을 타임스탬프로 변환하는 함수
 * @param data JSON에서 변환된 데이터
 * @returns 변환된 데이터
 */
const convertISOStringsToTimestamps = (data: any): any => {
  if (!data) return data;
  
  // 객체인 경우 재귀적으로 처리
  if (typeof data === 'object' && data !== null) {
    // 배열인 경우
    if (Array.isArray(data)) {
      return data.map(item => convertISOStringsToTimestamps(item));
    }
    
    // 일반 객체인 경우 각 필드를 재귀적으로 처리
    const result: Record<string, any> = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        // 날짜 관련 필드는 명시적으로 처리
        if ((key === 'createdAt' || key === 'updatedAt' || key === 'editedAt') && typeof data[key] === 'string') {
          try {
            result[key] = Timestamp.fromDate(new Date(data[key]));
          } catch (e) {
            console.error(`${key} 필드의 날짜 변환 오류:`, e);
            result[key] = data[key]; // 변환 실패 시 원래 값 유지
          }
        } else {
          // 다른 필드의 경우 재귀적으로 처리
          result[key] = convertISOStringsToTimestamps(data[key]);
        }
      }
    }
    return result;
  }
  
  // 문자열이 ISO 형식 날짜인지 확인 - 더 유연한 정규식 패턴 사용
  if (typeof data === 'string') {
    // ISO 8601 형식의 날짜 문자열 감지 (더 포괄적인 패턴)
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
    if (isoDatePattern.test(data)) {
      try {
        return isoStringToTimestamp(data);
      } catch (e) {
        console.error('날짜 문자열 변환 오류:', e, data);
        return data; // 변환 실패 시 원래 문자열 반환
      }
    }
  }
  
  return data;
};

/**
 * 컬렉션의 모든 문서 데이터를 가져오는 함수
 * @param collectionName 컬렉션 이름
 * @returns 문서 데이터 배열
 */
const fetchCollectionData = async (collectionName: string): Promise<any[]> => {
  try {
    const collectionRef = collection(db, collectionName);
    const querySnapshot = await getDocs(collectionRef);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...convertTimestampsToISOStrings(data)
      };
    });
  } catch (error) {
    handleError(error, `${collectionName} 컬렉션 데이터 조회 중 오류가 발생했습니다`);
    return [];
  }
};

/**
 * 시스템 데이터를 백업하는 함수
 * @param options 백업 옵션 (특정 컬렉션만 백업, 기간 제한 등)
 * @returns JSON 형식의 백업 데이터
 */
export const backupData = async (options: {
  collections?: string[];
  includeUsers?: boolean;
} = {}): Promise<string> => {
  // 관리자 권한 검증
  verifyAdminAuth();
  
  try {
    const { 
      collections = [POSTS_COLLECTION, COMMENTS_COLLECTION, SETTINGS_COLLECTION, BOOKMARKS_COLLECTION],
      includeUsers = false
    } = options;
    
    const backupData: Record<string, any[]> = {};
    
    // 선택된 컬렉션 데이터 가져오기
    for (const collectionName of collections) {
      if (collectionName === USERS_COLLECTION && !includeUsers) continue;
      
      console.log(`${collectionName} 컬렉션 백업 중...`);
      backupData[collectionName] = await fetchCollectionData(collectionName);
    }
    
    // 사용자 정보 포함 옵션이 활성화된 경우 추가
    if (includeUsers && !collections.includes(USERS_COLLECTION)) {
      console.log(`${USERS_COLLECTION} 컬렉션 백업 중...`);
      backupData[USERS_COLLECTION] = await fetchCollectionData(USERS_COLLECTION);
    }
    
    // 백업 메타데이터 추가
    const backupResult = {
      metadata: {
        createdAt: new Date().toISOString(),
        version: '1.0',
        collections: Object.keys(backupData),
        counts: Object.fromEntries(
          Object.entries(backupData).map(([key, value]) => [key, value.length])
        )
      },
      data: backupData
    };
    
    return JSON.stringify(backupResult, null, 2);
  } catch (error) {
    handleError(error, '데이터 백업 중 오류가 발생했습니다');
    return '';
  }
};

/**
 * 백업 데이터를 복원하는 함수
 * @param jsonData JSON 형식의 백업 데이터
 * @param options 복원 옵션 (기존 데이터 덮어쓰기, 특정 컬렉션만 복원 등)
 * @returns 복원 결과 (성공 여부, 복원된 문서 수 등)
 */
export const restoreData = async (
  jsonData: string,
  options: {
    collections?: string[];
    overwrite?: boolean;
    deleteBeforeRestore?: boolean;
  } = {}
): Promise<{
  success: boolean;
  message: string;
  restoredCounts: Record<string, number>;
  warnings?: string[];
}> => {
  // 관리자 권한 검증
  verifyAdminAuth();
  
  const warnings: string[] = [];
  
  try {
    const { 
      collections = [POSTS_COLLECTION, COMMENTS_COLLECTION, SETTINGS_COLLECTION, BOOKMARKS_COLLECTION],
      overwrite = false,
      deleteBeforeRestore = false
    } = options;
    
    let backupContent;
    
    // JSON 파싱 시도
    try {
      backupContent = JSON.parse(jsonData);
      console.log('백업 파일 파싱 성공', {
        version: backupContent.metadata?.version || '알 수 없음',
        createdAt: backupContent.metadata?.createdAt || '알 수 없음',
        collections: backupContent.metadata?.collections || []
      });
    } catch (error) {
      throw new Error('올바른 JSON 형식이 아닙니다. 백업 파일을 확인해주세요.');
    }
    
    // 백업 데이터 형식 검증
    if (!backupContent.data || typeof backupContent.data !== 'object') {
      throw new Error('백업 데이터 형식이 올바르지 않습니다.');
    }
    
    const restoredCounts: Record<string, number> = {};
    const failedCounts: Record<string, number> = {};
    
    // 각 컬렉션별 복원 작업
    for (const collectionName of collections) {
      // 해당 컬렉션 데이터가 백업에 없는 경우 스킵
      if (!backupContent.data[collectionName]) {
        console.log(`${collectionName} 컬렉션은 백업에 포함되지 않았습니다.`);
        continue;
      }
      
      const collectionData = backupContent.data[collectionName];
      console.log(`${collectionName} 컬렉션 복원 시작: ${collectionData.length}개 문서`);
      
      // 복원 전 데이터 삭제 옵션이 활성화된 경우
      if (deleteBeforeRestore) {
        try {
          await clearCollection(collectionName);
          console.log(`${collectionName} 컬렉션 초기화 완료`);
        } catch (clearError) {
          console.error(`${collectionName} 컬렉션 초기화 실패:`, clearError);
          warnings.push(`${collectionName} 컬렉션 초기화 중 오류가 발생했습니다. 일부 데이터만 복원될 수 있습니다.`);
        }
      }
      
      // 각 문서 복원
      let restoredCount = 0;
      let failedCount = 0;
      
      for (const item of collectionData) {
        const { id, ...docData } = item;
        
        try {
          const docRef = doc(db, collectionName, id);
          
          // 덮어쓰기 옵션이 비활성화된 경우, 기존 문서 확인
          if (!overwrite) {
            const docSnapshot = await getDoc(docRef);
            if (docSnapshot.exists()) {
              console.log(`문서 ${collectionName}/${id}가 이미 존재합니다. 스킵합니다.`);
              continue;
            }
          }
          
          // 타임스탬프 변환 처리
          let processedData;
          try {
            processedData = convertISOStringsToTimestamps(docData);
          } catch (convertError) {
            console.error(`문서 ${collectionName}/${id} 데이터 변환 오류:`, convertError);
            // 변환 오류 시에도 원본 데이터로 저장 시도
            processedData = docData;
            warnings.push(`${collectionName}/${id} 문서의 일부 필드 변환에 실패했습니다.`);
          }
          
          // 컬렉션 타입별 추가 처리
          const finalData = processCollectionSpecificData(collectionName, processedData);
          
          // 문서 작성 전 로깅
          if (collectionName === POSTS_COLLECTION || collectionName === COMMENTS_COLLECTION) {
            console.log(`${collectionName}/${id} 문서 복원 준비:`, { 
              hasCreatedAt: !!finalData.createdAt, 
              createdAtType: finalData.createdAt ? typeof finalData.createdAt : 'undefined',
              isTimestamp: finalData.createdAt instanceof Timestamp
            });
          }
          
          await setDoc(docRef, finalData);
          restoredCount++;
          
        } catch (docError) {
          failedCount++;
          console.error(`문서 ${collectionName}/${id} 복원 중 오류:`, docError);
          warnings.push(`${collectionName}/${id} 문서 복원에 실패했습니다: ${docError instanceof Error ? docError.message : '알 수 없는 오류'}`);
          // 개별 문서 오류는 전체 프로세스를 중단하지 않음
        }
      }
      
      restoredCounts[collectionName] = restoredCount;
      failedCounts[collectionName] = failedCount;
      
      console.log(`${collectionName} 컬렉션 복원 완료: ${restoredCount}개 성공, ${failedCount}개 실패`);
    }
    
    // 실패한 문서가 있는 경우 경고 추가
    const totalFailed = Object.values(failedCounts).reduce((sum, count) => sum + count, 0);
    if (totalFailed > 0) {
      warnings.push(`총 ${totalFailed}개 문서가 복원에 실패했습니다. 자세한 내용은 콘솔 로그를 확인하세요.`);
    }
    
    return {
      success: true,
      message: warnings.length > 0 
        ? '데이터 복원이 일부 경고와 함께 완료되었습니다.' 
        : '데이터 복원이 성공적으로 완료되었습니다.',
      restoredCounts,
      warnings: warnings.length > 0 ? warnings : undefined
    };
    
  } catch (error) {
    handleError(error, '데이터 복원 중 오류가 발생했습니다');
    
    return {
      success: false,
      message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      restoredCounts: {},
      warnings
    };
  }
};

/**
 * 컬렉션별 특수 처리 함수
 * 각 컬렉션 타입에 맞게 데이터를 추가 처리합니다.
 * 
 * @param collectionName 컬렉션 이름
 * @param data 처리할 데이터
 * @returns 처리된 데이터
 */
const processCollectionSpecificData = (collectionName: string, data: any): any => {
  // 데이터 복사본 생성
  const processedData = { ...data };
  
  // 컬렉션 타입별 처리
  switch (collectionName) {
    case POSTS_COLLECTION:
      // 게시물의 날짜 필드 명시적 처리
      if (processedData.createdAt && typeof processedData.createdAt === 'string') {
        processedData.createdAt = Timestamp.fromDate(new Date(processedData.createdAt));
      }
      if (processedData.updatedAt && typeof processedData.updatedAt === 'string') {
        processedData.updatedAt = Timestamp.fromDate(new Date(processedData.updatedAt));
      }
      break;
      
    case COMMENTS_COLLECTION:
      // 댓글의 날짜 필드 명시적 처리
      if (processedData.createdAt && typeof processedData.createdAt === 'string') {
        processedData.createdAt = Timestamp.fromDate(new Date(processedData.createdAt));
      }
      if (processedData.updatedAt && typeof processedData.updatedAt === 'string') {
        processedData.updatedAt = Timestamp.fromDate(new Date(processedData.updatedAt));
      }
      break;
      
    case SETTINGS_COLLECTION:
      // 설정의 날짜 필드 명시적 처리
      if (processedData.updatedAt && typeof processedData.updatedAt === 'string') {
        processedData.updatedAt = Timestamp.fromDate(new Date(processedData.updatedAt));
      }
      break;
      
    default:
      // 기본 처리 없음
      break;
  }
  
  return processedData;
};

/**
 * 특정 컬렉션의 모든 문서를 삭제하는 함수
 * @param collectionName 컬렉션 이름
 */
const clearCollection = async (collectionName: string): Promise<void> => {
  try {
    const collectionRef = collection(db, collectionName);
    const batchSize = 500; // Firestore 일괄 삭제 최대 크기
    
    let query_ = query(collectionRef, limit(batchSize));
    let numDeleted = 0;
    
    while (true) {
      const snapshot = await getDocs(query_);
      
      // 삭제할 문서가 없으면 종료
      if (snapshot.size === 0) {
        break;
      }
      
      // 배치 작업으로 문서 삭제
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      numDeleted += snapshot.size;
      
      // 모든 문서가 삭제되었으면 종료
      if (snapshot.size < batchSize) {
        break;
      }
    }
    
    console.log(`${collectionName} 컬렉션에서 ${numDeleted}개 문서가 삭제되었습니다.`);
    
  } catch (error) {
    handleError(error, `${collectionName} 컬렉션 초기화 중 오류가 발생했습니다`);
  }
}; 