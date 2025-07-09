/**
 * 인증 관련 커스텀 훅
 * 로그인, 로그아웃 등 인증 관련 기능과 상태를 제공합니다.
 */
import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase/config';
import { 
  signInWithGoogle as signInWithGoogleService, 
  signOut as signOutService,
  signInAnonymously as signInAnonymouslyService,
  mapFirebaseUserToUser,
  getCurrentUser,
  getAuthState
} from '../services/firebase/auth';
import type { User } from '../types';

// 인증 관련 상수
const LOGOUT_FLAG_KEY = 'mac_board_force_logout';
const AUTH_ERROR_MESSAGES = {
  default: '인증 중 오류가 발생했습니다. 다시 시도해 주세요.',
  network: '네트워크 연결을 확인하고 다시 시도해 주세요.',
  popup_closed: '로그인 창이 닫혔습니다.',
  popup_blocked: '팝업이 차단되었습니다. 브라우저 설정에서 팝업 허용 후 다시 시도해 주세요.',
  timeout: '요청 시간이 초과되었습니다. 다시 시도해 주세요.',
  user_cancelled: '사용자가 로그인을 취소했습니다.',
};

/**
 * 인증 관련 상태와 기능을 제공하는 훅
 * @returns 인증 상태와 인증 관련 함수들
 */
export function useAuth() {
  // 초기 상태 설정
  const [user, setUser] = useState<User | null>(() => {
    // 로그아웃 플래그 확인
    const isForceLogout = localStorage.getItem(LOGOUT_FLAG_KEY) === 'true';
    if (isForceLogout) {
      console.log('강제 로그아웃 플래그 발견, 사용자 상태 null로 초기화');
      return null;
    }
    
    // 초기 상태는 로컬 스토리지에서 가져옴
    const { isLoggedIn, user } = getAuthState();
    return isLoggedIn && user ? user : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 강제 로그아웃 상태 확인
  const isForceLogout = localStorage.getItem(LOGOUT_FLAG_KEY) === 'true';
  
  /**
   * 에러 메시지 포맷 함수
   * 에러 코드에 따라 적절한 에러 메시지를 반환합니다.
   */
  const formatErrorMessage = useCallback((error: any): string => {
    if (!error) return AUTH_ERROR_MESSAGES.default;
    
    const errorCode = error.code || '';
    
    if (errorCode.includes('network')) return AUTH_ERROR_MESSAGES.network;
    if (errorCode.includes('popup-closed')) return AUTH_ERROR_MESSAGES.popup_closed;
    if (errorCode.includes('popup-blocked')) return AUTH_ERROR_MESSAGES.popup_blocked;
    if (errorCode.includes('timeout')) return AUTH_ERROR_MESSAGES.timeout;
    if (errorCode.includes('cancelled') || errorCode.includes('cancel')) return AUTH_ERROR_MESSAGES.user_cancelled;
    
    return error.message || AUTH_ERROR_MESSAGES.default;
  }, []);
  
  // 인증 상태 변경 감지
  useEffect(() => {
    console.log('Auth 상태 감지 설정');
    
    // 로그아웃이 강제로 설정된 경우 인증 상태 감지를 설정하지 않음
    if (isForceLogout) {
      console.log('강제 로그아웃 상태, Firebase 인증 상태 감지 건너뜀');
      setUser(null);
      setIsLoading(false);
      return () => {};
    }
    
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        console.log('Firebase 인증 상태 변경 감지:', firebaseUser ? '로그인됨' : '로그아웃됨');
        
        // 로그아웃 플래그 확인
        const isForceLogoutNow = localStorage.getItem(LOGOUT_FLAG_KEY) === 'true';
        if (isForceLogoutNow) {
          console.log('강제 로그아웃 플래그 발견, 사용자 상태 null로 설정');
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        setIsLoading(true);
        if (firebaseUser) {
          // 사용자 정보 매핑
          const mappedUser = mapFirebaseUserToUser(firebaseUser);
          setUser(mappedUser);
          console.log('사용자 정보 설정됨:', mappedUser.displayName);
        } else {
          // Firebase 사용자가 null이면, 로컬 스토리지 체크
          const { isLoggedIn, user: storedUser } = getAuthState();
          if (isLoggedIn && storedUser) {
            console.log('로컬 스토리지에서 사용자 정보 복원:', storedUser.displayName);
            setUser(storedUser);
          } else {
            console.log('사용자 정보 null로 설정');
            setUser(null);
          }
        }
        setIsLoading(false);
        setError(null);
      },
      (error) => {
        console.error('인증 상태 변경 오류:', error);
        setError(formatErrorMessage(error));
        setIsLoading(false);
      }
    );
    
    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      console.log('Auth 상태 감지 해제');
      unsubscribe();
    };
  }, [isForceLogout, formatErrorMessage]);

  /**
   * 구글 로그인 함수
   * @returns Promise<User | null> - 로그인 성공 시 사용자 정보, 실패 시 null
   */
  const signInWithGoogle = async (): Promise<User | null> => {
    try {
      // 로그아웃 플래그 제거
      localStorage.removeItem(LOGOUT_FLAG_KEY);
      
      setIsLoading(true);
      setError(null);
      const user = await signInWithGoogleService();
      if (user) {
        setUser(user);
      }
      setIsLoading(false);
      return user;
    } catch (err: any) {
      console.error('구글 로그인 오류:', err);
      
      // 사용자가 취소한 경우 무시
      if (err.code === 'auth/popup-closed-by-user' || 
          err.message === '로그인 창이 닫혔습니다. 다시 시도해주세요.' || 
          err.message === '로그인 요청이 취소되었습니다.') {
        setError(null);
      } else {
        setError(formatErrorMessage(err));
      }
      
      setIsLoading(false);
      return null;
    }
  };

  /**
   * 익명 로그인 함수
   * @returns Promise<User | null> - 로그인 성공 시 사용자 정보, 실패 시 null
   */
  const signInAnonymously = async (): Promise<User | null> => {
    try {
      // 로그아웃 플래그 제거
      localStorage.removeItem(LOGOUT_FLAG_KEY);
      
      setIsLoading(true);
      setError(null);
      const user = await signInAnonymouslyService();
      if (user) {
        setUser(user);
      }
      setIsLoading(false);
      return user;
    } catch (err: any) {
      console.error('익명 로그인 오류:', err);
      setError(formatErrorMessage(err));
      setIsLoading(false);
      return null;
    }
  };

  /**
   * 로그아웃 함수
   */
  const signOut = async (): Promise<void> => {
    try {
      console.log('useAuth: 로그아웃 시작');
      
      // 강제 로그아웃 플래그 설정
      localStorage.setItem(LOGOUT_FLAG_KEY, 'true');
      
      setIsLoading(true);
      console.log('useAuth: signOutService 호출');
      await signOutService();
      console.log('useAuth: Firebase 로그아웃 성공');
      setUser(null);
      console.log('useAuth: 사용자 정보 초기화');
      setError(null);
      console.log('useAuth: 로그아웃 완료');
    } catch (err) {
      console.error('useAuth: 로그아웃 오류:', err);
      setError(formatErrorMessage(err));
      
      // 오류가 발생해도 강제로 로그아웃
      setUser(null);
      localStorage.setItem(LOGOUT_FLAG_KEY, 'true');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 에러 초기화 함수
   */
  const clearError = (): void => {
    setError(null);
  };

  return {
    user,
    isAuthenticated: !!user && !isForceLogout,
    isLoading,
    error,
    signInWithGoogle,
    signInAnonymously,
    signOut,
    clearError
  };
} 