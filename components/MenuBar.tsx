import React, { useState, useEffect, useRef } from 'react';
import { AppleIcon, WifiIcon, BatteryIcon, SearchIcon } from './icons';
import type { User } from '../types';

interface MenuBarProps {
  onOpenHelp: () => void;
  onLogout: () => void;
  user: User;
}

const MenuBar: React.FC<MenuBarProps> = ({ onOpenHelp, onLogout, user }) => {
  const [time, setTime] = useState(new Date());
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMenuToggle = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };
  
  const handleMenuAction = (action?: (() => void) | undefined) => {
    if (action) {
      console.log('MenuBar: 메뉴 액션 호출됨');
      action();
    }
    setActiveMenu(null);
  };

  // 로그아웃 핸들러 직접 래핑
  const handleLogout = () => {
    console.log('MenuBar: 로그아웃 함수 호출됨');
    onLogout();
  };

  const menuItems = [
    { 
      name: '이동', 
      items: [
        { label: 'AI 테크 허브', action: () => window.open('https://tech-toolkit-hub.vercel.app/', '_blank', 'noopener,noreferrer'), disabled: false },
        { label: '데브캔버스', action: () => window.open('https://dev-canvas-pi.vercel.app/', '_blank', 'noopener,noreferrer'), disabled: false }
      ] 
    },
    { 
      name: '도움말', 
      items: [{ label: '사용법 보기', action: onOpenHelp, disabled: false }] 
    },
  ];

  const appleMenuItems = [
    { label: '이 Mac에 관하여', action: () => {}, disabled: true },
    { isSeparator: true },
    { label: '로그아웃...', action: handleLogout, disabled: false }
  ];

  return (
    <div 
        ref={menuRef}
        className="fixed top-0 left-0 right-0 h-7 bg-white/20 backdrop-blur-lg z-50 flex items-center justify-between px-4 text-sm font-semibold text-white"
        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
    >
      <div className="flex items-center space-x-4">
        <div className="relative">
          <button onClick={() => handleMenuToggle('apple')} className="transition-opacity hover:opacity-80">
            <AppleIcon className="w-5 h-5 text-white fill-current" />
          </button>
          {activeMenu === 'apple' && (
            <div className="absolute left-0 mt-1.5 w-56 bg-white/80 backdrop-blur-xl rounded-md shadow-2xl ring-1 ring-black/5 py-1">
              {appleMenuItems.map((item, index) => (
                item.isSeparator ? <div key={`sep-${index}`} className="h-px bg-gray-900/10 my-1 mx-1" /> :
                 <button
                  key={item.label}
                  onClick={() => handleMenuAction(item.action)}
                  disabled={item.disabled}
                  className={`w-full text-left px-3 py-1 text-black text-sm ${item.disabled ? 'text-gray-400' : 'hover:bg-blue-500 hover:text-white'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <b className="font-bold">Finder</b>
        {menuItems.map(menu => (
          <div key={menu.name} className="relative">
            <button onClick={() => handleMenuToggle(menu.name)} className={`px-2 py-0.5 rounded ${activeMenu === menu.name ? 'bg-white/30' : 'hover:bg-white/20'}`}>
              {menu.name}
            </button>
            {activeMenu === menu.name && menu.items.length > 0 && (
              <div className="absolute left-0 mt-1.5 w-48 bg-white/80 backdrop-blur-xl rounded-md shadow-2xl ring-1 ring-black/5 py-1">
                {menu.items.map(item => (
                   <button
                    key={item.label}
                    onClick={() => handleMenuAction(item.action)}
                    disabled={item.disabled}
                    className={`w-full text-left px-3 py-1 text-black text-sm ${item.disabled ? 'text-gray-400' : 'hover:bg-blue-500 hover:text-white'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center space-x-4">
        <span className="font-medium">{user.displayName}</span>
        <button 
          onClick={handleLogout} 
          className="bg-red-500/20 hover:bg-red-500/40 text-white rounded px-2 py-0.5"
        >
          로그아웃
        </button>
        <BatteryIcon className="w-5 h-5"/>
        <WifiIcon className="w-4 h-4" />
        <SearchIcon className="w-4 h-4" />
        <span>{time.toLocaleDateString('ko-KR', { weekday: 'short', month: 'long', day: 'numeric' })}</span>
        <span>{time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
};

export default MenuBar;
