/**
 * 관리자 페이지 헤더 컴포넌트
 * 상단 메뉴바와 유사한 형태로 관리자 페이지의 상단 영역을 구성합니다.
 */
import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../../hooks/useAdminAuth';

/**
 * 관리자 페이지 헤더 컴포넌트 속성
 */
interface AdminHeaderProps {
  /** 제목 */
  title?: string;
}

/**
 * 관리자 페이지 헤더 컴포넌트
 */
const AdminHeader: React.FC<AdminHeaderProps> = ({ title = 'MAC-BOARD 관리자' }) => {
  // 현재 시간 상태
  const [time, setTime] = useState(new Date());
  
  // 관리자 인증 훅 사용
  const { admin, logout } = useAdminAuth();

  // 시간 업데이트 효과
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /**
   * 현재 선택(Selection) 초기화 함수
   */
  const clearSelection = () => {
    try {
      if (window.getSelection) {
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
        }
      }
    } catch (e) {
      console.error('선택 초기화 중 오류:', e);
    }
  };

  /**
   * 안전한 페이지 이동 함수
   */
  const safeRedirect = (url: string) => {
    // 현재 선택 초기화
    clearSelection();
    
    // 이벤트 루프의 다음 틱에서 실행하여 DOM 업데이트 완료 보장
    Promise.resolve().then(() => {
      try {
        console.log(`페이지 이동: ${url}`);
        // 히스토리 스택에 영향을 주지 않고 페이지 전환
        window.location.replace(url);
      } catch (e) {
        console.error('페이지 이동 중 오류:', e);
        // 오류 발생 시 일반 새로고침 시도
        window.location.href = url;
      }
    });
  };

  /**
   * 로그아웃 핸들러
   */
  const handleLogout = (e: React.MouseEvent) => {
    // 이벤트 전파 방지
    e.preventDefault();
    e.stopPropagation();
    
    console.log('관리자 로그아웃 요청');
    
    // 로그아웃 실행
    logout();
    
    // 안전한 페이지 이동
    safeRedirect('/');
  };

  return (
    <header className="bg-gray-800 text-white shadow-md">
      <div className="flex items-center justify-between px-4 py-2">
        {/* 왼쪽 영역: 제목 */}
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-bold">{title}</h1>
        </div>

        {/* 오른쪽 영역: 관리자 정보, 시간, 로그아웃 */}
        <div className="flex items-center space-x-4">
          {/* 관리자 ID 표시 */}
          {admin && (
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">관리자: {admin.id}</span>
              <span className="text-xs text-gray-300">
                ({new Date(admin.loggedInAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 로그인)
              </span>
            </div>
          )}

          {/* 현재 시간 */}
          <span className="text-sm">
            {time.toLocaleDateString('ko-KR', { weekday: 'short', month: 'long', day: 'numeric' })}
          </span>
          <span className="text-sm">
            {time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
          </span>

          {/* 로그아웃 버튼 */}
          <button 
            onClick={handleLogout} 
            className="bg-red-600 hover:bg-red-700 text-white text-sm rounded px-3 py-1 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader; 