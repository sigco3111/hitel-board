# MAC-BOARD 개발 가이드라인

## 1. 프로젝트 개요

- MAC-BOARD는 Mac OS 인터페이스를 모방한 온라인 게시판 시스템
- **기술 스택**: React, TypeScript, Tailwind CSS, Firebase
- **핵심 기능**: 게시물 CRUD, 구글 및 익명 로그인, 마크다운 지원, 북마크 시스템, 반응형 디자인

## 2. 프로젝트 아키텍처

### 2.1 폴더 구조

- `src/components/`: 모든 UI 컴포넌트를 이곳에 배치하라
- `src/services/firebase/`: Firebase 연동 코드는 반드시 이 폴더에만 구현하라
- `src/hooks/`: React 커스텀 훅을 이곳에 구현하라
- `src/utils/`: 유틸리티 함수만 이곳에 배치하라
- `src/types/`: 타입 정의는 반드시 이 폴더 내의 파일에만 작성하라

### 2.2 중복 파일 처리 규칙

- **루트와 src의 App.tsx**: 반드시 `src/App.tsx`만 사용하고 수정하라. 루트의 App.tsx는 레거시로 취급하며 절대 수정하지 마라.
- **types.ts와 src/types/index.ts**: 반드시 `src/types/index.ts`를 사용하라. 루트의 types.ts는 레거시로 간주하고 절대 수정하지 마라.
- **모든 작업은 src/ 디렉토리 내부의 파일만 대상으로 하라.**

### 2.3 주요 파일 역할

- `src/App.tsx`: 애플리케이션 진입점, 라우팅, 인증 상태 관리
- `src/types/index.ts`: 모든 타입 정의 (Post, Category, User 등)
- `src/services/firebase/config.ts`: Firebase 설정 (환경변수 사용 필수)
- `src/services/firebase/auth.ts`: 인증 관련 함수 (로그인, 로그아웃 등)
- `src/services/firebase/firestore.ts`: Firestore 데이터베이스 접근 함수
- `src/hooks/useAuth.ts`: 인증 상태 관리 훅
- `src/hooks/usePosts.ts`: 게시물 데이터 관리 훅

## 3. 코드 작성 표준

### 3.1 주석 규칙

- 모든 함수와 주요 로직 상단에 한국어로 목적 설명을 반드시 작성하라
- 복잡한 로직에는 한국어로 맥락 설명을 추가하라

```tsx
/**
 * 게시물 목록을 필터링하는 함수
 * 카테고리와 태그를 기준으로 필터링합니다.
 */
const filterPosts = (posts: Post[], category: string, tag: string | null) => {
  // 카테고리가 'all'이 아니면 해당 카테고리만 필터링
  const categoryFiltered = category === 'all' 
    ? posts 
    : posts.filter(post => post.category === category);
  
  // 태그가 있으면 해당 태그를 가진 게시물만 필터링
  return tag 
    ? categoryFiltered.filter(post => post.tags?.includes(tag)) 
    : categoryFiltered;
};
```

### 3.2 네이밍 규칙

- **상수**: 대문자와 언더스코어를 사용하라 (`MAX_POSTS_PER_PAGE`, `AUTH_STATE_KEY`)
- **Boolean 변수**: is, has, can으로 시작하는 이름을 사용하라 (`isVisible`, `hasPermission`)
- **함수**: 동사로 시작하는 camelCase를 사용하라 (`fetchPosts`, `handleSubmit`)
- **컴포넌트**: PascalCase를 사용하라 (`PostList`, `LoginButton`)
- **인터페이스/타입**: PascalCase를 사용하고 인터페이스는 'I' 접두사 없이 작성하라 (`Post`, `User`)

### 3.3 에러 처리

- 모든 비동기 함수는 반드시 try-catch로 감싸라
- 에러 발생 시 로그를 기록하고 사용자에게는 일반화된 메시지를 제공하라
- Firebase 오류 코드에 따라 적절한 처리를 구현하라

```tsx
try {
  await createPost(newPost);
} catch (error) {
  console.error('게시물 생성 오류:', error);
  // 사용자에게는 구체적이지 않은 메시지
  setErrorMessage('게시물을 생성하는 중 오류가 발생했습니다. 다시 시도해 주세요.');
}
```

## 4. Firebase 연동 규칙

### 4.1 Firebase 환경변수

- Firebase 설정은 반드시 환경변수를 사용하여 구현하라
- 환경변수는 `.env` 파일에 `VITE_` 접두사로 정의하라
- 환경변수가 없을 경우 대체 로직을 반드시 포함하라

```tsx
// 올바른 예시
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  // 나머지 설정...
};

// 금지된 예시 - 하드코딩된 값 사용
const firebaseConfig = {
  apiKey: "AIzaSyA1AbCdEfGhIjKlMnOpQrStUvWxYz",
  authDomain: "mac-board.firebaseapp.com",
  // 나머지 설정...
};
```

### 4.2 인증 관련 구현

- 로그인 상태는 로컬 스토리지에 저장하고 24시간 유효 기간을 설정하라
- 로그아웃 시 `AUTH_STATE_KEY`, `LOGOUT_FLAG_KEY` 등 모든 관련 스토리지를 정리하라
- 인증 상태 감지를 위해 Firebase의 `onAuthStateChanged`를 사용하라
- 로그인/로그아웃 상태 관리는 `src/hooks/useAuth.ts` 훅을 통해서만 처리하라

```tsx
// 로컬 스토리지에 로그인 상태 저장 예시
const saveAuthState = (isLoggedIn: boolean, user?: User | null) => {
  if (isLoggedIn && user) {
    localStorage.setItem(AUTH_STATE_KEY, JSON.stringify({
      isLoggedIn: true,
      user: user,
      timestamp: Date.now() // 24시간 유효
    }));
  } else {
    localStorage.removeItem(AUTH_STATE_KEY);
  }
};
```

### 4.3 Firestore 데이터 액세스

- Firestore 데이터 접근 함수는 `src/services/firebase/firestore.ts`에만 구현하라
- 데이터 조회 시 항상 쿼리 최적화를 고려하라
- 실시간 업데이트가 필요한 기능에만 `onSnapshot`을 사용하라
- 트랜잭션이 필요한 작업은 반드시 Firestore 트랜잭션 API를 사용하라

```tsx
// 게시물 조회 함수 예시
export const fetchPosts = async (category?: string) => {
  try {
    let postsQuery;
    
    if (category && category !== 'all') {
      postsQuery = query(collection(db, 'posts'), where('category', '==', category));
    } else {
      postsQuery = collection(db, 'posts');
    }
    
    const snapshot = await getDocs(postsQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[];
  } catch (error) {
    console.error('게시물 조회 오류:', error);
    throw error;
  }
};
```

## 5. 컴포넌트 관리 및 확장

### 5.1 기존 컴포넌트 수정

- 컴포넌트의 props 타입을 변경할 때는 반드시 관련 인터페이스도 함께 수정하라
- 컴포넌트 상태 관리는 내부에서 처리하고 이벤트는 props로 전달하라
- 기존 컴포넌트를 수정할 때는 반드시 기존 스타일과 패턴을 유지하라

### 5.2 새 컴포넌트 추가

- 단일 책임 원칙을 반드시 준수하라 (한 컴포넌트는 한 가지 책임만 가져야 함)
- 컴포넌트 파일명은 PascalCase로 작성하고 `.tsx` 확장자를 사용하라
- 모든 컴포넌트는 명시적으로 props 타입 인터페이스를 정의하라
- 컴포넌트는 `export default` 형태로 내보내라

```tsx
// 올바른 예시
import React from 'react';

interface CommentItemProps {
  author: string;
  content: string;
  date: string;
  onDelete?: () => void;
}

/**
 * 개별 댓글을 표시하는 컴포넌트
 */
const CommentItem: React.FC<CommentItemProps> = ({ author, content, date, onDelete }) => {
  return (
    // 컴포넌트 구현
  );
};

export default CommentItem;
```

### 5.3 Tailwind CSS 사용

- 모든 스타일은 인라인 Tailwind 클래스를 사용하라
- 복잡한 스타일은 추출하여 별도 컴포넌트로 만들어라
- 반응형 디자인을 위해 `sm:`, `md:`, `lg:` 접두사를 적절히 사용하라
- Mac OS 스타일을 위해 정의된 커스텀 색상 (`mac-light`, `mac-dark` 등)을 사용하라

```tsx
// 올바른 예시
<button className="bg-mac-blue hover:bg-mac-blue-dark text-white px-4 py-2 rounded-md">
  로그인
</button>

// 금지된 예시 - 인라인 스타일
<button style={{ backgroundColor: '#0066CC', color: 'white', padding: '8px 16px' }}>
  로그인
</button>
```

## 6. 파일 의존성 및 연관관계

### 6.1 함께 수정해야 하는 파일

다음 파일은 항상 함께 검토하고 필요시 동시에 수정하라:

- `src/types/index.ts`와 해당 타입을 사용하는 컴포넌트
- `src/hooks/useAuth.ts`와 `src/services/firebase/auth.ts`
- `src/hooks/usePosts.ts`와 `src/services/firebase/firestore.ts`
- `src/App.tsx`와 인증 관련 컴포넌트 (`LoginScreen.tsx`, `Desktop.tsx` 등)

### 6.2 타입 정의 관리

- 모든 공통 타입은 `src/types/index.ts`에 정의하라
- 컴포넌트 특화 타입(props 등)은 해당 컴포넌트 파일 내에 정의하라
- 타입 이름 충돌을 방지하기 위해 네이밍 컨벤션을 준수하라 (예: `PostProps`, `PostItemProps`)

## 7. AI 의사결정 기준

### 7.1 우선순위 결정

코드 수정 시 다음 우선순위를 따르라:

1. 보안 관련 문제 (Firebase 키 노출 등) 해결
2. 에러 처리 및 예외 상황 대응
3. 코드 일관성 및 구조 유지
4. 기능 개선 및 최적화

### 7.2 애매한 상황 처리

1. 중복된 구현이 있는 경우 `src/` 폴더 내 파일을 우선시하라
2. 타입 정의가 충돌하는 경우 `src/types/index.ts`의 정의를 우선시하라
3. 스타일 관련 결정은 기존 Mac OS 스타일을 최대한 모방하는 방향으로 결정하라
4. 인증 관련 로직 수정 시 기존의 철저한 로그아웃 처리 방식을 유지하라

### 7.3 금지된 행동

- 하드코딩된 Firebase 키 사용 금지
- 중복된 타입 정의 작성 금지
- 여러 역할을 수행하는 복잡한 컴포넌트 작성 금지
- 직접적인 DOM 조작 금지 (React 패러다임 준수)
- 루트 디렉토리의 파일 수정 금지 (src/ 내부 파일만 수정)

## 8. 테스트 및 배포

### 8.1 테스트 방법

- 기능 구현 후 로컬에서 반드시 동작 테스트를 수행하라
- 인증 관련 기능 변경 시 로그인/로그아웃 전체 흐름을 테스트하라
- 브라우저 콘솔에 에러가 없는지 확인하라
- 다양한 화면 크기에서 반응형 디자인이 정상 작동하는지 확인하라

### 8.2 배포 프로세스

- `npm run build` 명령으로 프로덕션 빌드를 생성하라
- Firebase Hosting에 배포 시 환경변수가 올바르게 설정되었는지 확인하라
- 배포 후 주요 기능이 정상 작동하는지 최종 확인하라 