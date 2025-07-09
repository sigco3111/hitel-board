/**
 * 관리자 인증 관련 함수
 * 환경변수를 사용한 관리자 로그인, 로그아웃 및 인증 상태 관리 기능을 제공합니다.
 */
import { Admin } from '../../types';

// 관리자 인증 관련 상수 정의
const ADMIN_AUTH_KEY = 'mac_board_admin_auth';
const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2시간 (밀리초)

/**
 * 안전한 로컬 스토리지 접근 함수
 * DOM 접근 관련 에러를 방지합니다.
 */
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('로컬 스토리지 접근 오류:', error);
      return null;
    }
  },
  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('로컬 스토리지 저장 오류:', error);
      return false;
    }
  },
  removeItem: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('로컬 스토리지 삭제 오류:', error);
      return false;
    }
  }
};

/**
 * 관리자 로그인 함수
 * 환경변수와 비교하여 관리자 인증을 수행합니다.
 * @param id 입력된 관리자 ID
 * @param password 입력된 관리자 비밀번호
 * @returns 인증 성공 시 Admin 객체, 실패 시 null
 */
export const adminLogin = (id: string, password: string): Admin | null => {
  try {
    // DOM 접근 전에 필요한 값들을 먼저 준비
    const adminId = import.meta.env.VITE_ADMIN_ID;
    const adminPw = import.meta.env.VITE_ADMIN_PW;

    // 환경변수가 설정되지 않은 경우
    if (!adminId || !adminPw) {
      console.error('관리자 인증 오류: 환경변수가 설정되지 않았습니다.');
      return null;
    }

    // 인증 정보 비교
    if (id === adminId && password === adminPw) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + SESSION_DURATION);
      
      // 관리자 정보 생성
      const admin: Admin = {
        id: id,
        isAdmin: true,
        loggedInAt: now,
        expiresAt: expiresAt
      };
      
      // 세션 저장 (안전하게)
      const saved = saveAdminSession(admin);
      if (!saved) {
        console.error('관리자 세션 저장 실패');
        return admin; // 세션 저장은 실패했지만 인증은 성공했으므로 admin 객체 반환
      }
      
      console.log('관리자 로그인 성공:', admin);
      return admin;
    }
    
    console.log('관리자 로그인 실패: 인증 정보 불일치');
    return null;
  } catch (error) {
    console.error('관리자 로그인 처리 중 오류:', error);
    return null;
  }
};

/**
 * 관리자 로그아웃 함수
 * 저장된 관리자 세션을 삭제합니다.
 */
export const adminLogout = (): void => {
  try {
    safeLocalStorage.removeItem(ADMIN_AUTH_KEY);
    console.log('관리자 로그아웃 완료');
  } catch (error) {
    console.error('관리자 로그아웃 오류:', error);
  }
};

/**
 * 관리자 세션 저장 함수
 * 로컬 스토리지에 관리자 세션 정보를 저장합니다.
 * @param admin 관리자 정보
 * @returns 저장 성공 여부
 */
const saveAdminSession = (admin: Admin): boolean => {
  try {
    // Date 객체를 ISO 문자열로 변환하여 저장
    const adminData = {
      ...admin,
      loggedInAt: admin.loggedInAt.toISOString(),
      expiresAt: admin.expiresAt.toISOString()
    };
    
    // 안전하게 로컬 스토리지에 저장
    const saved = safeLocalStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(adminData));
    if (saved) {
      console.log('관리자 세션 저장됨');
      return true;
    } else {
      console.error('관리자 세션 저장 실패');
      return false;
    }
  } catch (error) {
    console.error('관리자 세션 저장 오류:', error);
    return false;
  }
};

/**
 * 관리자 세션 조회 함수
 * 로컬 스토리지에서 관리자 세션 정보를 조회합니다.
 * @returns 유효한 관리자 세션이 있으면 Admin 객체, 없으면 null
 */
export const getAdminSession = (): Admin | null => {
  try {
    // 안전하게 로컬 스토리지에서 조회
    const storedSession = safeLocalStorage.getItem(ADMIN_AUTH_KEY);
    
    if (!storedSession) {
      return null;
    }
    
    const adminData = JSON.parse(storedSession);
    
    // Date 객체로 변환 (JSON.parse는 Date를 문자열로 처리함)
    const admin: Admin = {
      ...adminData,
      loggedInAt: new Date(adminData.loggedInAt),
      expiresAt: new Date(adminData.expiresAt)
    };
    
    // 세션 만료 확인
    if (admin.expiresAt < new Date()) {
      console.log('관리자 세션 만료됨');
      safeLocalStorage.removeItem(ADMIN_AUTH_KEY);
      return null;
    }
    
    return admin;
  } catch (error) {
    console.error('관리자 세션 조회 오류:', error);
    safeLocalStorage.removeItem(ADMIN_AUTH_KEY);
    return null;
  }
};

/**
 * 관리자 세션 갱신 함수
 * 현재 세션의 만료 시간을 연장합니다.
 * @returns 갱신된 Admin 객체, 실패 시 null
 */
export const refreshAdminSession = (): Admin | null => {
  try {
    const currentSession = getAdminSession();
    
    if (!currentSession) {
      return null;
    }
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_DURATION);
    
    const refreshedAdmin: Admin = {
      ...currentSession,
      expiresAt: expiresAt
    };
    
    const saved = saveAdminSession(refreshedAdmin);
    if (!saved) {
      console.error('관리자 세션 갱신 실패');
      return currentSession; // 갱신은 실패했지만 기존 세션은 유효하므로 반환
    }
    
    return refreshedAdmin;
  } catch (error) {
    console.error('관리자 세션 갱신 오류:', error);
    return null;
  }
};

/**
 * 관리자 인증 여부 확인 함수
 * 현재 유효한 관리자 세션이 있는지 확인합니다.
 * @returns 관리자 인증 여부
 */
export const isAdminAuthenticated = (): boolean => {
  try {
    return getAdminSession() !== null;
  } catch (error) {
    console.error('관리자 인증 확인 오류:', error);
    return false;
  }
}; 