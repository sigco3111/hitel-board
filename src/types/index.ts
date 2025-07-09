import React from 'react';
import { Timestamp } from 'firebase/firestore';

export interface Post {
  id: string;             // 게시물 고유 ID
  title: string;          // 게시물 제목
  content: string;        // 게시물 내용 (HTML 형식 지원)
  category: string;       // 게시물 카테고리 ('general', 'tech' 등)
  author: {               // 작성자 정보
    name: string;         // 작성자 이름
  };
  authorId: string;       // 작성자 고유 ID (사용자 인증 시스템과 연동)
  tags: string[];         // 게시물 태그 목록
  createdAt: Timestamp;   // 생성 시간 (Firebase Timestamp)
  updatedAt: Timestamp;   // 수정 시간 (Firebase Timestamp)
  commentCount: number;   // 댓글 수
  viewCount: number;      // 조회수
  // UI 용도로 사용되는 필드
  isNew?: boolean;        // 새 게시물 여부 (24시간 내 작성)
}

// UI에서 표시할 때 사용하는 포스트 타입
export interface UIPost {
  id: string;
  author: {
    name: string;
  };
  authorId: string;
  category: string;
  title: string;
  content: string;
  date: string;
  comments: number;
  isNew: boolean;
  tags: string[];
}

// 댓글 관련 타입
export interface Comment {
  id: string;             // 댓글 고유 ID
  postId: string;         // 게시물 ID
  content: string;        // 댓글 내용
  author: {               // 작성자 정보
    name: string;         // 작성자 이름
    photoURL?: string;    // 작성자 프로필 이미지
  };
  authorId: string;       // 작성자 고유 ID
  createdAt: Timestamp;   // 생성 시간
  updatedAt: Timestamp;   // 수정 시간
}

// UI에서 표시할 때 사용하는 댓글 타입
export interface UIComment {
  id: string;
  postId: string;
  content: string;
  author: {
    name: string;
    photoURL?: string;
  };
  authorId: string;
  date: string;
  isEditing?: boolean;    // 편집 중인지 여부 (UI 상태용)
}

export interface Category {
  id: string;
  name: string;
  icon?: string;  // 아이콘 (이모지 또는 아이콘 ID)
}

export type MenuItem =
  | {
      label: string;
      action?: () => void;
      disabled?: boolean;
      items?: MenuItem[];
      isSeparator?: false;
    }
  | {
      isSeparator: true;
    };


export interface Menu {
  name: string;
  items: MenuItem[];
}

export interface User {
  uid: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  isAnonymous?: boolean;
} 

/**
 * 관리자 정보 인터페이스
 * 관리자 인증 시스템에서 사용됩니다.
 */
export interface Admin {
  id: string;             // 관리자 ID
  isAdmin: boolean;       // 관리자 권한 여부
  loggedInAt: Date;       // 로그인 시간
  expiresAt: Date;        // 세션 만료 시간
} 