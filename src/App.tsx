/**
 * 애플리케이션 진입점 컴포넌트
 * 전체 앱의 레이아웃과 라우팅을 관리합니다.
 */
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Desktop from '../components/Desktop';
import LoginScreen from '../components/LoginScreen';
import { useAuth } from './hooks/useAuth';
import { useAdminAuth } from './hooks/useAdminAuth';
import AdminLayout from './components/admin/AdminLayout';
// 실제 구현된 관리자 게시물 관리 컴포넌트 임포트
import AdminPosts from './components/admin/posts';
// 카테고리 관리 컴포넌트 임포트
import CategoryManagement from './components/admin/categories';
// 백업/복원 페이지 컴포넌트 임포트
import BackupRestorePage from './components/admin/backup/BackupRestorePage';
// PC통신 UI 컴포넌트 데모 페이지 임포트
import PCComponentsDemo from './components/pc-components/PCComponentsDemo';
import './index.css';

// 로그아웃 상태를 저장하기 위한 로컬 스토리지 키
const LOGOUT_FLAG_KEY = 'mac_board_force_logout';

/**
 * 어드민 대시보드 페이지 컴포넌트
 * 실제 구현은 별도 파일로 분리할 예정입니다.
 */
const AdminDashboard: React.FC = () => (
  <AdminLayout title="대시보드">
    <h2 className="text-xl font-semibold mb-4">관리자 대시보드</h2>
    <p>관리자 대시보드 내용이 여기에 표시됩니다.</p>
  </AdminLayout>
);

// 임시 AdminBackup 컴포넌트 제거

/**
 * 애플리케이션 루트 컴포넌트
 */
const App: React.FC = () => {
  // 일반 사용자 인증 상태 관리
  const { user, isLoading, error, isAuthenticated, signOut } = useAuth();
  const [manualLoginUser, setManualLoginUser] = useState<any>(null);
  const [forceLogout, setForceLogout] = useState<boolean>(() => {
    return localStorage.getItem(LOGOUT_FLAG_KEY) === 'true';
  });

  // 강제 로그아웃 상태가 변경될 때 로컬 스토리지에 저장
  useEffect(() => {
    if (forceLogout) {
      localStorage.setItem(LOGOUT_FLAG_KEY, 'true');
    } else {
      localStorage.removeItem(LOGOUT_FLAG_KEY);
    }
  }, [forceLogout]);
  
  // 로딩 화면
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: '#fbfbfd' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mac-blue mx-auto mb-4"></div>
          <p className="text-mac-dark">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 에러 화면
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ backgroundColor: '#fbfbfd' }}>
        <div className="text-center p-6 max-w-md bg-white rounded-lg shadow-mac-window">
          <h2 className="text-xl font-medium text-red-600 mb-4">오류가 발생했습니다</h2>
          <p className="text-mac-dark mb-4">{error}</p>
          <button 
            className="mac-button" 
            onClick={() => window.location.reload()}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  /**
   * 게시판 열기 핸들러
   * 이 함수는 Desktop 컴포넌트 내부에서 처리하므로 여기서는 로그만 출력합니다.
   */
  const handleOpenBoard = () => {
    // 게시판 열기 로직은 Desktop 컴포넌트에서 처리
    console.log('App: 게시판 열기 요청 받음');
  };

  /**
   * 로그아웃 핸들러
   */
  const handleLogout = async () => {
    console.log('App: 로그아웃 요청 받음');
    
    // 로그아웃 상태로 강제 설정
    setForceLogout(true);
    setManualLoginUser(null);
    
    // useAuth의 signOut 함수 호출
    try {
      console.log('App: useAuth의 signOut 함수 호출');
      await signOut();
      console.log('App: 로그아웃 완료, 강제 로그아웃 상태 설정됨');
    } catch (err) {
      console.error('App: 로그아웃 실패', err);
    }
    
    // Promise를 반환
    return Promise.resolve();
  };

  /**
   * 로그인 핸들러
   */
  const handleLogin = (loggedInUser: any) => {
    console.log('로그인 성공:', loggedInUser);
    setManualLoginUser(loggedInUser);
    setForceLogout(false);
    localStorage.removeItem(LOGOUT_FLAG_KEY);
  };

  // 로그인 상태 확인
  const effectiveUser = user || manualLoginUser;
  const isUserLoggedIn = (isAuthenticated || !!manualLoginUser) && !forceLogout;

  console.log('인증 상태:', { 
    user, 
    manualLoginUser, 
    isAuthenticated, 
    forceLogout, 
    isUserLoggedIn 
  });

  return (
    <>
      <Routes>
        {/* PC통신 UI 컴포넌트 데모 라우트 */}
        <Route path="/pc-demo" element={<PCComponentsDemo />} />
        
        {/* 어드민 라우트 */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/posts/*" element={<AdminLayout title="게시물 관리"><AdminPosts /></AdminLayout>} />
        <Route path="/admin/categories" element={<AdminLayout title="카테고리 관리"><CategoryManagement /></AdminLayout>} />
        {/* 백업/복원 페이지 라우트 */}
        <Route path="/admin/backup" element={<BackupRestorePage />} />
        
        {/* 메인 앱 라우트 */}
        <Route path="/" element={
          isUserLoggedIn && effectiveUser ? (
            // 로그인 상태 - 데스크톱 환경 표시
            <Desktop 
              user={effectiveUser} 
              onOpenBoard={handleOpenBoard} 
              onLogout={handleLogout} 
            />
          ) : (
            // 로그아웃 상태 - 로그인 화면 표시
            <LoginScreen onLogin={handleLogin} />
          )
        } />
        
        {/* 기타 경로는 메인으로 리다이렉트 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Vercel Analytics 및 Speed Insights 추가 */}
      <Analytics debug={process.env.NODE_ENV === 'development'} />
      <SpeedInsights debug={process.env.NODE_ENV === 'development'} />
    </>
  );
};

export default App; 