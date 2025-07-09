/**
 * Firebase Firestore 초기화 및 샘플 데이터 추가 스크립트
 * 최초 설정 시에만 실행하는 스크립트입니다.
 */
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './config';

// 샘플 게시물 데이터
const samplePosts = [
  {
    title: '리액트 19 새로운 기능',
    content: '<p>리액트 19가 드디어 출시되었습니다! 이번 업데이트에는 Automatic Batching, 새로운 Concurrent features, 그리고 Server Components 개선 사항이 포함되어 있습니다.</p><p>특히 <strong>useTransition</strong> 훅은 UI 끊김 없이 상태를 업데이트하는 데 큰 도움이 될 것입니다.</p>',
    category: 'tech',
    author: {
      name: '김민준',
      avatarUrl: 'https://picsum.photos/id/1005/100/100'
    },
    authorId: 'user_sample_1',
    tags: ['리액트', '프론트엔드', '자바스크립트'],
    commentCount: 5,
    viewCount: 120
  },
  {
    title: 'Tailwind CSS vs. Styled Components',
    content: '<p>스타일링 방법에 대한 오랜 논쟁이죠. Tailwind CSS는 유틸리티-우선 접근 방식으로 빠르게 프로토타이핑할 수 있는 장점이 있고, Styled Components는 컴포넌트 레벨에서 스타일을 캡슐화하는 데 강력합니다. 여러분의 선택은 무엇인가요?</p>',
    category: 'tech',
    author: {
      name: '이수진',
      avatarUrl: 'https://picsum.photos/id/1011/100/100'
    },
    authorId: 'user_sample_2',
    tags: ['CSS', '프론트엔드', '스타일링'],
    commentCount: 12,
    viewCount: 85
  },
  {
    title: '주말에 가볼만한 곳 추천',
    content: '<h2>서울 근교 나들이</h2><p>이번 주말, 날씨가 좋다면 양평 두물머리에 가보는 건 어떠세요? 강과 산이 어우러진 풍경이 정말 아름답습니다. 맛있는 핫도그도 놓치지 마세요!</p><ul><li>두물머리</li><li>세미원</li><li>양평 레일바이크</li></ul>',
    category: 'general',
    author: {
      name: '박서연',
      avatarUrl: 'https://picsum.photos/id/1027/100/100'
    },
    authorId: 'user_sample_3',
    tags: ['여행', '주말', '나들이'],
    commentCount: 8,
    viewCount: 64
  },
  {
    title: 'Gemini API 사용 후기',
    content: '<p>Google의 새로운 Gemini API를 사용해봤습니다. 텍스트 생성 능력뿐만 아니라 이미지 인식 능력도 뛰어나서 다양한 애플리케이션에 활용할 수 있을 것 같습니다. 특히 JSON 모드로 구조화된 데이터를 받아오는 기능이 인상적이었습니다.</p>',
    category: 'tech',
    author: {
      name: '최현우',
      avatarUrl: 'https://picsum.photos/id/10/100/100'
    },
    authorId: 'user_sample_4',
    tags: ['AI', 'API', 'Gemini'],
    commentCount: 21,
    viewCount: 132
  }
];

// 기본 카테고리 설정
const defaultSettings = {
  id: 'global-settings',
  categories: [
    { id: 'general', name: '자유게시판' }
  ],
  allowAnonymousPosting: true,
  allowComments: true,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now()
};

/**
 * 설정 데이터 초기화 함수
 */
export const initSettings = async (): Promise<void> => {
  try {
    const settingsRef = doc(db, 'settings', 'global-settings');
    const settingsSnap = await getDoc(settingsRef);
    
    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, defaultSettings);
      console.log('⚙️ 기본 설정이 성공적으로 초기화되었습니다.');
    } else {
      console.log('ℹ️ 설정이 이미 존재합니다. 초기화를 건너뜁니다.');
    }
  } catch (error) {
    console.error('❌ 설정 초기화 중 오류 발생:', error);
    throw error;
  }
};

/**
 * 샘플 게시물 추가 함수
 */
export const addSamplePosts = async (): Promise<void> => {
  try {
    const postsRef = collection(db, 'posts');
    const batch = writeBatch(db);
    
    console.log('📝 샘플 게시물 추가 중...');
    
    samplePosts.forEach((post, index) => {
      const postRef = doc(postsRef);
      const now = Timestamp.now();
      
      // 시간차를 두어 게시물이 서로 다른 시간에 작성된 것처럼 보이도록 함
      const createdAt = new Timestamp(
        now.seconds - (index * 86400), // 하루(86400초) 간격으로 과거에 작성된 것처럼 설정
        now.nanoseconds
      );
      
      batch.set(postRef, {
        ...post,
        createdAt,
        updatedAt: createdAt
      });
    });
    
    await batch.commit();
    console.log('✅ 샘플 게시물이 성공적으로 추가되었습니다.');
  } catch (error) {
    console.error('❌ 샘플 게시물 추가 중 오류 발생:', error);
    throw error;
  }
};

/**
 * Firestore 초기화 함수
 * 설정과 샘플 데이터를 초기화합니다.
 */
export const initFirestore = async (): Promise<void> => {
  try {
    console.log('🔥 Firestore 초기화 시작...');
    await initSettings();
    await addSamplePosts();
    console.log('🎉 Firestore 초기화가 완료되었습니다!');
  } catch (error) {
    console.error('❌ Firestore 초기화 중 오류 발생:', error);
    throw error;
  }
};

export default initFirestore; 