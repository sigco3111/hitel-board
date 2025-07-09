# MAC-BOARD 프로젝트 구조

## 1. 프로젝트 개요

MAC-BOARD는 Mac OS 인터페이스를 모방한 온라인 게시판 시스템입니다. React, TypeScript, Tailwind CSS, Firebase를 사용하여 구현되었으며, 게시물 CRUD, 구글 및 익명 로그인, 마크다운 지원, 북마크 시스템, 반응형 디자인 등의 기능을 제공합니다.

## 2. 디렉토리 구조

### 2.1 루트 디렉토리

```
/
├── components/          # UI 컴포넌트 (레거시, 사용하지 않음)
├── src/                 # 소스 코드 (주요 개발 디렉토리)
├── App.tsx              # 루트 App 컴포넌트 (레거시, 사용하지 않음)
├── types.ts             # 타입 정의 (레거시, 사용하지 않음)
├── index.html           # HTML 템플릿
├── index.tsx            # 애플리케이션 진입점 (레거시)
├── package.json         # 프로젝트 의존성 및 스크립트
├── tailwind.config.js   # Tailwind CSS 설정
├── tsconfig.json        # TypeScript 설정
├── vite.config.ts       # Vite 설정
├── PRD.md               # 제품 요구사항 문서
└── shrimp-rules.md      # 개발 가이드라인
```

### 2.2 src 디렉토리 (주요 개발 디렉토리)

```
src/
├── components/          # UI 컴포넌트 (필요한 경우 생성)
├── hooks/               # React 커스텀 훅
│   ├── useAuth.ts       # 인증 관련 훅
│   └── usePosts.ts      # 게시물 데이터 관련 훅
├── services/            # 외부 서비스 연동
│   └── firebase/        # Firebase 관련 서비스
│       ├── auth.ts      # 인증 관련 함수
│       ├── config.ts    # Firebase 설정
│       └── firestore.ts # Firestore 데이터 액세스 함수
├── types/               # 타입 정의
│   └── index.ts         # 공통 타입 정의
├── utils/               # 유틸리티 함수
│   └── formatDate.ts    # 날짜 포맷팅 함수
├── App.tsx              # 애플리케이션 메인 컴포넌트
├── env.d.ts             # 환경변수 타입 정의
├── index.css            # 글로벌 CSS
└── index.tsx            # 애플리케이션 진입점
```

### 2.3 components 디렉토리 (현재 루트 디렉토리에 위치, 레거시)

```
components/
├── BulletinBoard.tsx    # 게시판 컴포넌트
├── ConfirmationModal.tsx # 확인 모달
├── Desktop.tsx          # 바탕화면 컴포넌트
├── HelpModal.tsx        # 도움말 모달
├── LoginScreen.tsx      # 로그인 화면
├── MenuBar.tsx          # 메뉴 바 컴포넌트
├── NewPostModal.tsx     # 새 게시물 작성 모달
├── PostDetail.tsx       # 게시물 상세 보기
├── PostItem.tsx         # 게시물 항목
├── PostList.tsx         # 게시물 목록
├── Sidebar.tsx          # 사이드바 컴포넌트
├── TrafficLights.tsx    # 창 제어 버튼 (최소화, 최대화, 닫기)
├── WindowMenuBar.tsx    # 창 메뉴 바
└── icons.tsx            # 아이콘 컴포넌트
```

## 3. 중복 파일 구조 분석

### 3.1 중복된 파일 목록

| 루트 파일 | src 디렉토리 파일 | 상태 |
|----------|-----------------|------|
| `/App.tsx` | `/src/App.tsx` | 다른 구현, src 버전이 더 발전된 형태 |
| `/types.ts` | `/src/types/index.ts` | 거의 동일한 내용, 마지막 줄에 공백 차이만 있음 |
| `/index.tsx` | `/src/index.tsx` | 다른 구현 |
| `/components/` | `/src/components/` | src/components는 현재 없음, 필요시 생성 필요 |

### 3.2 중복 파일 처리 방법

- **App.tsx**: `/src/App.tsx`를 표준으로 사용, 루트의 App.tsx는 레거시로 취급
- **types.ts**: `/src/types/index.ts`를 표준으로 사용, 루트의 types.ts는 레거시로 취급
- **components 디렉토리**: 현재 루트의 components 디렉토리에 있는 컴포넌트들은 `/src/components/` 디렉토리로 이동 필요 (필요할 경우)

## 4. 누락된 디렉토리 구조

현재 shrimp-rules.md에 명시된 폴더 구조 중 다음 항목이 누락되어 있습니다:

1. `/src/components/` - UI 컴포넌트를 위한 디렉토리 (필요시 생성)
2. `/src/assets/` - 이미지, 아이콘 등 정적 리소스를 위한 디렉토리 (필요시 생성)

## 5. 결론 및 권장사항

1. 모든 개발은 `/src/` 디렉토리 내에서만 진행해야 함
2. 루트의 App.tsx와 types.ts는 레거시로 취급하고 수정하지 않음
3. `/src/components/` 디렉토리를 생성하고 필요한 컴포넌트는 이 디렉토리에 구현
4. `/src/types/index.ts`를 통해 모든 타입 정의를 관리
5. Firebase 관련 코드는 `/src/services/firebase/` 디렉토리에만 구현 