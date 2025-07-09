/**
 * 관리자 페이지 사이드바 컴포넌트
 * 관리자 기능 메뉴를 제공하는 사이드바를 구현합니다.
 */
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * 메뉴 아이템 타입 정의
 */
interface MenuItem {
  id: string;
  name: string;
  path: string;
  icon: React.ReactNode;
  subItems?: MenuItem[];
}

/**
 * 관리자 사이드바 컴포넌트 속성
 */
interface AdminSidebarProps {
  /** 사이드바 축소 여부 */
  collapsed?: boolean;
  /** 사이드바 토글 핸들러 */
  onToggle?: () => void;
}

/**
 * 아이콘 컴포넌트 - 대시보드
 */
const DashboardIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

/**
 * 아이콘 컴포넌트 - 게시물
 */
const PostIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

/**
 * 아이콘 컴포넌트 - 카테고리
 */
const CategoryIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

// TagIcon 컴포넌트 제거

/**
 * 아이콘 컴포넌트 - 백업
 */
const BackupIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
  </svg>
);

/**
 * 아이콘 컴포넌트 - 토글
 */
const ToggleIcon: React.FC<{ collapsed: boolean, className?: string }> = ({ collapsed, className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
  </svg>
);

/**
 * 관리자 사이드바 컴포넌트
 */
const AdminSidebar: React.FC<AdminSidebarProps> = ({ collapsed = false, onToggle }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(collapsed);
  const location = useLocation();
  
  // 현재 활성화된 메뉴 확인
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // 사이드바 토글 핸들러
  const handleToggle = () => {
    setIsCollapsed(!isCollapsed);
    if (onToggle) {
      onToggle();
    }
  };

  // 관리자 메뉴 아이템 정의
  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      name: '대시보드',
      path: '/admin',
      icon: <DashboardIcon />
    },
    {
      id: 'posts',
      name: '게시물 관리',
      path: '/admin/posts',
      icon: <PostIcon />,
      subItems: [
        {
          id: 'posts-list',
          name: '게시물 목록',
          path: '/admin/posts',
          icon: <></>
        }
      ]
    },
    {
      id: 'categories',
      name: '카테고리 관리',
      path: '/admin/categories',
      icon: <CategoryIcon />
    },
    // 태그 관리 메뉴 항목 제거
    {
      id: 'backup',
      name: '데이터 백업/복원',
      path: '/admin/backup',
      icon: <BackupIcon />
    }
  ];

  return (
    <aside 
      className={`bg-gray-900 text-white transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}
    >
      {/* 사이드바 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {!isCollapsed && (
          <h2 className="text-xl font-bold">관리자</h2>
        )}
        <button 
          onClick={handleToggle}
          className="p-1 rounded-md hover:bg-gray-700 transition-colors"
          aria-label={isCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
        >
          <ToggleIcon collapsed={isCollapsed} />
        </button>
      </div>

      {/* 메뉴 목록 */}
      <nav className="mt-5 px-2">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <Link
                to={item.path}
                className={`flex items-center p-2 rounded-md transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {!isCollapsed && <span>{item.name}</span>}
              </Link>

              {/* 서브 메뉴 (축소 모드가 아닐 때만 표시) */}
              {!isCollapsed && item.subItems && (
                <ul className="mt-1 ml-6 space-y-1">
                  {item.subItems.map((subItem) => (
                    <li key={subItem.id}>
                      <Link
                        to={subItem.path}
                        className={`flex items-center p-2 rounded-md transition-colors ${
                          isActive(subItem.path)
                            ? 'bg-blue-600/30 text-white'
                            : 'text-gray-400 hover:bg-gray-800'
                        }`}
                      >
                        <span>{subItem.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar; 