/**
 * 관리자 인증 관련 커스텀 훅
 * 관리자 로그인, 로그아웃 및 인증 상태 관리 기능을 제공합니다.
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  adminLogin as adminLoginService, 
  adminLogout as adminLogoutService,
  getAdminSession, 
  refreshAdminSession,
  isAdminAuthenticated as checkAdminAuth
} from '../services/admin/auth';
import type { Admin } from '../types';

// 세션 체크 간격 (5분)
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000;

/**
 * 관리자 인증 관련 커스텀 훅
 * @returns 관리자 인증 관련 상태와 함수들
 */
export const useAdminAuth = () => {
  // 관리자 상태
  const [admin, setAdmin] = useState<Admin | null>(null);
  // 로딩 상태
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // 에러 상태
  const [error, setError] = useState<string | null>(null);

  /**
   * 관리자 세션 초기화 함수
   * 로컬 스토리지에서 관리자 세션을 조회하여 상태를 설정합니다.
   */
  const initAdminSession = useCallback(() => {
    try {
      const adminSession = getAdminSession();
      setAdmin(adminSession);
    } catch (err) {
      console.error('관리자 세션 초기화 오류:', err);
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 시 세션 초기화
  useEffect(() => {
    initAdminSession();
  }, [initAdminSession]);

  // 주기적으로 세션 체크 및 갱신
  useEffect(() => {
    if (!admin) return;

    const checkSession = () => {
      const refreshed = refreshAdminSession();
      if (!refreshed) {
        // 세션이 만료된 경우
        setAdmin(null);
        setError('세션이 만료되었습니다. 다시 로그인해 주세요.');
      }
    };

    const intervalId = setInterval(checkSession, SESSION_CHECK_INTERVAL);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [admin]);

  /**
   * 관리자 로그인 함수
   * @param id 관리자 ID
   * @param password 관리자 비밀번호
   * @returns 로그인 성공 여부
   */
  const login = useCallback(async (id: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // adminLoginService 호출 (Promise로 래핑하여 비동기 처리)
      const adminData = await Promise.resolve(adminLoginService(id, password));
      
      if (adminData) {
        // 로그인 성공 시 안전하게 상태 업데이트
        console.log('로그인 성공, 관리자 정보:', adminData);
        
        // 상태 업데이트 전에 유효성 검사
        if (!adminData.id || !adminData.isAdmin) {
          console.error('유효하지 않은 관리자 정보:', adminData);
          setError('유효하지 않은 관리자 정보입니다.');
          return false;
        }
        
        // 관리자 상태 업데이트
        setAdmin(adminData);
        
        return true;
      } else {
        setError('아이디 또는 비밀번호가 올바르지 않습니다.');
        return false;
      }
    } catch (err: any) {
      console.error('관리자 로그인 오류:', err);
      setError(err.message || '로그인 중 오류가 발생했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 관리자 로그아웃 함수
   */
  const logout = useCallback(() => {
    try {
      adminLogoutService();
      setAdmin(null);
    } catch (err: any) {
      console.error('관리자 로그아웃 오류:', err);
      setError(err.message || '로그아웃 중 오류가 발생했습니다.');
    }
  }, []);

  /**
   * 관리자 인증 여부 확인 함수
   * @returns 관리자 인증 여부
   */
  const isAdminAuthenticated = useCallback((): boolean => {
    return checkAdminAuth();
  }, []);

  return {
    admin,
    isAdmin: !!admin,
    isLoading,
    error,
    login,
    logout,
    isAdminAuthenticated
  };
}; 