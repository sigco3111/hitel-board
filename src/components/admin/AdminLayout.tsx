/**
 * 관리자 페이지 레이아웃 컴포넌트
 * 관리자 페이지의 기본 레이아웃을 구성합니다.
 */
import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminLoginScreen from './AdminLoginScreen';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import type { Admin } from '../../types';

/**
 * 관리자 레이아웃 컴포넌트 속성
 */
interface AdminLayoutProps {
  /** 자식 컴포넌트 */
  children: React.ReactNode;
  /** 페이지 제목 */
  title?: string;
}

/**
 * 관리자 레이아웃 컴포넌트
 */
const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  // 사이드바 상태 관리
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  // 리다이렉트 상태 관리
  const [shouldRedirect, setShouldRedirect] = useState<boolean>(false);
  
  // 관리자 인증 훅 사용
  const { admin, isAdmin, isLoading, error } = useAdminAuth();
  const location = useLocation();

  // 사이드바 토글 핸들러
  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // 로그인 성공 핸들러
  const handleLoginSuccess = (admin: Admin) => {
    console.log('관리자 로그인 성공:', admin);
    // 로그인 성공 시 리다이렉트 상태 설정
    setShouldRedirect(true);
  };

  // 리다이렉트가 필요한 경우 처리
  if (shouldRedirect) {
    console.log('관리자 대시보드로 리다이렉트');
    return <Navigate to="/admin" replace />;
  }

  // 로딩 중일 때 로딩 화면 표시
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-700">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 인증되지 않은 경우 로그인 화면으로 리다이렉트
  if (!isAdmin) {
    return <AdminLoginScreen onLogin={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* 사이드바 */}
      <AdminSidebar collapsed={sidebarCollapsed} onToggle={handleSidebarToggle} />
      
      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <AdminHeader title={title} />
        
        {/* 메인 콘텐츠 */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
              <p>{error}</p>
            </div>
          )}
          
          {/* 페이지 제목 */}
          {title && (
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {location.pathname === '/admin' ? '관리자 대시보드' : '관리자 페이지'}
              </p>
            </div>
          )}
          
          {/* 자식 컴포넌트 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout; 