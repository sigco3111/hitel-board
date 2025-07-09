/**
 * PC통신 메인 화면 컴포넌트
 * 텍스트 기반 메뉴 시스템을 제공합니다.
 */
import React, { useState, useEffect } from 'react';
import { User } from '../src/types';
import BulletinBoard from './BulletinBoard';
import HelpModal from './HelpModal';
import SettingsModal from './SettingsModal';
import { 
  PCLayout, 
  PCHeader, 
  PCMenu, 
  TextBox, 
  AsciiArt,
  DEFAULT_LOGOS
} from '../src/components/pc-components';
import { pcColors } from '../src/styles/colors';

// 로그아웃 상태를 저장하기 위한 로컬 스토리지 키
const LOGOUT_FLAG_KEY = 'mac_board_force_logout';

type BoardState = 'closed' | 'board' | 'bookmarks';

/**
 * Desktop 컴포넌트 속성
 */
interface DesktopProps {
  /** 현재 로그인된 사용자 정보 */
  user: User;
  /** 게시판 열기 핸들러 */
  onOpenBoard: () => void;
  /** 로그아웃 핸들러 */
  onLogout: () => Promise<void>;
}

/**
 * PC통신 메인 화면 컴포넌트
 */
const Desktop: React.FC<DesktopProps> = ({ user, onOpenBoard, onLogout }) => {
  const [selectedMenuIndex, setSelectedMenuIndex] = useState<number>(0);
  const [isHelpModalOpen, setHelpModalOpen] = useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [boardState, setBoardState] = useState<BoardState>('closed');
  const [time, setTime] = useState(new Date());

  // 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 메뉴 항목 정의
  const menuItems = [
    { 
      id: 'bulletin-board', 
      name: '게시판', 
      description: '게시판에서 글을 읽고 작성합니다.',
      onSelect: () => setBoardState('board')
    },
    { 
      id: 'bookmark', 
      name: '북마크', 
      description: '저장한 게시물을 확인합니다.',
      onSelect: () => setBoardState('bookmarks')
    },
    { 
      id: 'settings', 
      name: '설정', 
      description: '프로그램 설정을 변경합니다.',
      onSelect: () => setSettingsModalOpen(true)
    },
    { 
      id: 'help', 
      name: '도움말', 
      description: '프로그램 사용법을 확인합니다.',
      onSelect: () => setHelpModalOpen(true)
    },
    { 
      id: 'logout', 
      name: '로그아웃', 
      description: '프로그램을 종료합니다.',
      onSelect: handleLogout
    }
  ];

  // 게시판 닫기
  const handleCloseBoard = () => {
    setBoardState('closed');
  };

  // 로그아웃 처리
  async function handleLogout() {
    localStorage.setItem(LOGOUT_FLAG_KEY, 'true');
    try {
      await onLogout();
    } catch (error) {
      console.error('Desktop: 로그아웃 오류:', error);
      localStorage.setItem(LOGOUT_FLAG_KEY, 'true');
    }
  }

  // 로그아웃 플래그 확인
  useEffect(() => {
    const checkLogoutFlag = () => {
      if (localStorage.getItem(LOGOUT_FLAG_KEY) === 'true') {
        onLogout().catch(err => console.error('자동 로그아웃 오류:', err));
      }
    };
    const interval = setInterval(checkLogoutFlag, 1000);
    return () => clearInterval(interval);
  }, [onLogout]);

  // 키보드 이벤트 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    
    switch (e.key) {
      case 'ArrowUp':
        setSelectedMenuIndex(prev => (prev > 0 ? prev - 1 : menuItems.length - 1));
        break;
      case 'ArrowDown':
        setSelectedMenuIndex(prev => (prev < menuItems.length - 1 ? prev + 1 : 0));
        break;
      case 'Enter':
        menuItems[selectedMenuIndex].onSelect();
        break;
      default:
        // 숫자 키로 메뉴 선택
        const num = parseInt(e.key);
        if (!isNaN(num) && num > 0 && num <= menuItems.length) {
          setSelectedMenuIndex(num - 1);
          menuItems[num - 1].onSelect();
        }
        break;
    }
  };

  // 현재 시간 포맷팅
  const formattedTime = time.toLocaleTimeString('ko-KR', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });

  // 현재 날짜 포맷팅
  const formattedDate = time.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  return (
    <PCLayout fullScreen>
      {/* 헤더 */}
      <PCHeader 
        title="하이텔 게시판" 
        info={formattedTime}
        borderStyle="double"
      />

      <div className="flex flex-col h-[calc(100vh-60px)] p-4">
        {/* 로고 및 환영 메시지 */}
        <div className="mb-6 text-center">
          <AsciiArt 
            art={DEFAULT_LOGOS.HITEL}
            color={pcColors.text.accent}
            centered
          />
          <div className="text-pc-text-cyan mt-2">
            <p>PC통신 스타일 게시판에 오신 것을 환영합니다.</p>
            <p className="mt-1">{user.displayName}님, 반갑습니다!</p>
            <p className="mt-1">{formattedDate}</p>
          </div>
        </div>

        {/* 메인 메뉴 */}
        <TextBox 
          title="메인 메뉴" 
          borderStyle="none"
          className="mx-auto w-full max-w-2xl"
          padding="1.5rem"
        >
          <div 
            className="flex flex-col"
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
            {menuItems.map((item, index) => (
              <div 
                key={item.id}
                className={`
                  flex items-center p-2 cursor-pointer mb-2
                  ${selectedMenuIndex === index ? 'bg-pc-selection-bg text-pc-selection-text' : ''}
                `}
                onClick={() => {
                  setSelectedMenuIndex(index);
                  item.onSelect();
                }}
              >
                <span className="inline-block w-8 text-center mr-2">
                  {index + 1}.
                </span>
                <span className="font-bold mr-4">{item.name}</span>
                <span className="text-pc-text-secondary">
                  {item.description}
                </span>
                {selectedMenuIndex === index && (
                  <span className="ml-auto animate-pulse">▶</span>
                )}
              </div>
            ))}
          </div>
        </TextBox>

      </div>

      {/* 모달 및 게시판 */}
      {isHelpModalOpen && <HelpModal isOpen={isHelpModalOpen} onClose={() => setHelpModalOpen(false)} />}
      {isSettingsModalOpen && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
          onWallpaperChange={() => {}}
        />
      )}
      {boardState !== 'closed' && (
        <BulletinBoard
          onClose={handleCloseBoard}
          user={user}
          initialShowBookmarks={boardState === 'bookmarks'}
        />
      )}
    </PCLayout>
  );
};

export default Desktop;
