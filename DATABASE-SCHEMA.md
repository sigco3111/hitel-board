# MAC-BOARD 데이터베이스 설계 문서

## 개요

MAC-BOARD는 Firebase Firestore를 사용하여 데이터를 관리하는 게시판 애플리케이션입니다. 이 문서에서는 데이터베이스 스키마 및 컬렉션 구조에 대해 상세히 설명합니다.

## 데이터베이스 구조

Firebase Firestore는 NoSQL 문서 지향 데이터베이스로, 다음과 같은 컬렉션으로 구성되어 있습니다:

### 컬렉션 목록

| 컬렉션 이름 | 설명 |
|------------|------|
| `posts` | 게시물 데이터 저장 |
| `bookmarks` | 사용자 북마크 정보 저장 |
| `settings` | 게시판 전역 설정 정보 저장 |
| `comments` | 게시물 댓글 저장 |
| `users` | 사용자 정보 저장 |

## 컬렉션 스키마

### 1. posts 컬렉션

게시물 정보를 저장하는 주요 컬렉션입니다.

**문서 구조:**

```typescript
{
  id: string;             // 게시물 고유 ID
  title: string;          // 게시물 제목
  content: string;        // 게시물 내용 (HTML 형식 지원)
  category: string;       // 게시물 카테고리 ('general', 'tech' 등)
  author: {               // 작성자 정보
    name: string;         // 작성자 이름
    avatarUrl: string;    // 작성자 프로필 이미지 URL
  };
  authorId: string;       // 작성자 고유 ID (사용자 인증 시스템과 연동)
  tags: string[];         // 게시물 태그 목록
  createdAt: Timestamp;   // 생성 시간 (Firebase Timestamp)
  updatedAt: Timestamp;   // 수정 시간 (Firebase Timestamp)
  commentCount: number;   // 댓글 수
  viewCount: number;      // 조회수
}
```

### 2. bookmarks 컬렉션

사용자가 북마크한 게시물 정보를 저장하는 컬렉션입니다.

**문서 구조:**

```typescript
{
  userId: string;         // 사용자 ID
  postId: string;         // 게시물 ID
  createdAt: Timestamp;   // 북마크 생성 시간
}
```

### 3. settings 컬렉션

게시판의 전역 설정 정보를 저장하는 컬렉션입니다.

**문서 구조:**

```typescript
{
  id: string;             // 설정 ID (예: 'global-settings')
  categories: [           // 게시판 카테고리 목록
    {
      id: string;         // 카테고리 ID
      name: string;       // 카테고리 이름
    }
  ];
  allowAnonymousPosting: boolean;  // 익명 게시물 작성 허용 여부
  allowComments: boolean;          // 댓글 허용 여부
  createdAt: Timestamp;            // 생성 시간
  updatedAt: Timestamp;            // 수정 시간
}
```

### 4. comments 컬렉션

게시물의 댓글을 저장하는 컬렉션입니다.

**문서 구조:**

```typescript
{
  id: string;             // 댓글 ID
  postId: string;         // 게시물 ID
  content: string;        // 댓글 내용
  author: {               // 작성자 정보
    name: string;         // 작성자 이름
    avatarUrl: string;    // 작성자 프로필 이미지
  };
  authorId: string;       // 작성자 ID
  createdAt: Timestamp;   // 생성 시간
  updatedAt: Timestamp;   // 수정 시간
}
```

### 5. users 컬렉션

사용자 정보를 저장하는 컬렉션입니다.

**문서 구조:**

```typescript
{
  uid: string;            // 사용자 고유 ID (Firebase Auth와 연동)
  displayName: string;    // 표시 이름
  email: string;          // 이메일 주소
  photoURL: string;       // 프로필 이미지 URL
  isAnonymous: boolean;   // 익명 사용자 여부
}
```

## 데이터 관계

### 게시물과 사용자 관계

- 게시물의 `authorId`는 `users` 컬렉션의 `uid`와 연결됩니다.
- 이를 통해 사용자가 작성한 게시물을 쉽게 조회할 수 있습니다.

### 게시물과 북마크 관계

- `bookmarks` 컬렉션은 `userId`와 `postId`를 통해 사용자와 게시물을 연결합니다.
- 이 관계를 통해 사용자별 북마크된 게시물 목록을 쉽게 조회할 수 있습니다.

### 게시물과 댓글 관계

- `comments` 컬렉션의 각 문서는 `postId`를 통해 `posts` 컬렉션의 게시물과 연결됩니다.
- 게시물의 `commentCount` 필드를 통해 댓글 수를 효율적으로 관리합니다.

## 인덱싱

효율적인 쿼리 처리를 위해 다음과 같은 인덱스가 권장됩니다:

1. `posts` 컬렉션:
   - `category`, `createdAt` (복합 인덱스)
   - `tags` (배열 인덱스)
   - `authorId`, `createdAt` (복합 인덱스)

2. `bookmarks` 컬렉션:
   - `userId`, `createdAt` (복합 인덱스)

3. `comments` 컬렉션:
   - `postId`, `createdAt` (복합 인덱스)

## 초기 데이터

애플리케이션 초기 실행 시, `init-db.ts` 파일을 통해 다음과 같은 초기 데이터가 생성됩니다:

1. `posts` 컬렉션:
   - 환영 게시물
   - 기술 게시판 이용 안내 게시물

2. `settings` 컬렉션:
   - 기본 카테고리 ('all', 'tech', 'general')
   - 기본 설정 (익명 게시물 및 댓글 허용)

## 데이터 액세스 패턴

### 주요 쿼리 패턴

1. 모든 게시물 조회:
   - `posts` 컬렉션을 `createdAt` 기준 내림차순으로 정렬하여 조회

2. 카테고리별 게시물 조회:
   - `posts` 컬렉션에서 `category` 필드가 일치하는 문서를 `createdAt` 기준 내림차순으로 정렬하여 조회

3. 태그별 게시물 조회:
   - `posts` 컬렉션에서 `tags` 배열에 특정 태그가 포함된 문서를 `createdAt` 기준 내림차순으로 정렬하여 조회

4. 사용자별 북마크 조회:
   - `bookmarks` 컬렉션에서 `userId` 필드가 일치하는 문서를 조회하여 관련 게시물 ID 목록 획득
   - 해당 ID 목록을 사용하여 `posts` 컬렉션에서 게시물 정보 조회

## 데이터 무결성 및 보안

1. 데이터 일관성:
   - 관련 데이터 업데이트 시 트랜잭션 처리 필요 (예: 게시물 삭제 시 관련 댓글 및 북마크도 함께 삭제)
   - 게시물의 `commentCount` 필드는 댓글 추가/삭제 시 일관되게 업데이트 필요

2. 보안 규칙:
   - 인증된 사용자만 게시물 생성 가능
   - 게시물 작성자만 해당 게시물 수정/삭제 가능
   - 관리자는 모든 게시물 수정/삭제 가능

## 비동기 처리 및 에러 핸들링

데이터 액세스 모듈(`boardService.ts`)에서는 다음과 같은 안정성 기능을 구현하고 있습니다:

1. 재시도 로직:
   - 최대 재시도 횟수: 3회
   - 재시도 간 지연: 지수 백오프 적용 (1초, 2초, 4초...)

2. 에러 로깅:
   - 모든 데이터베이스 작업 중 발생하는 에러를 상세히 기록

3. 타입 안전성:
   - TypeScript 인터페이스를 통한 데이터 모델링 및 타입 검증 