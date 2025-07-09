/**
 * PC통신 UI 컴포넌트 데모 페이지
 * 구현된 PC통신 스타일 컴포넌트들을 테스트하고 보여주는 페이지입니다.
 */
import React, { useState } from 'react';
import { PCLayout, PCHeader, TextBox, PCMenu, AsciiArt, DEFAULT_LOGOS } from './index';
import { MenuItem } from './PCMenu';

const PCComponentsDemo: React.FC = () => {
  const [selectedMenuId, setSelectedMenuId] = useState<string>('menu1');
  const [currentTime, setCurrentTime] = useState<string>(
    new Date().toLocaleTimeString()
  );

  // 시간 업데이트를 위한 효과
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 메뉴 항목 정의
  const menuItems: MenuItem[] = [
    { id: 'menu1', label: '게시판 목록 보기', shortcut: 'F1' },
    { id: 'menu2', label: '새 게시물 작성', shortcut: 'F2' },
    { id: 'menu3', label: '게시물 검색', shortcut: 'F3' },
    { id: 'menu4', label: '환경 설정', shortcut: 'F4' },
    { id: 'menu5', label: '도움말', shortcut: 'F5' },
    { id: 'menu6', label: '로그아웃', shortcut: 'F9', disabled: true },
  ];

  return (
    <PCLayout fullScreen>
      {/* 헤더 */}
      <PCHeader 
        title="하이텔 게시판" 
        subtitle="PC통신 스타일 UI 데모"
        info={currentTime}
      />

      <div className="p-4">
        {/* ASCII 아트 로고 */}
        <div className="mb-6">
          <AsciiArt art={DEFAULT_LOGOS.HITEL} centered />
        </div>

        <div className="flex gap-4">
          {/* 왼쪽 메뉴 */}
          <div className="w-1/4">
            <PCMenu
              title="메인 메뉴"
              items={menuItems}
              selectedId={selectedMenuId}
              onSelect={setSelectedMenuId}
              borderStyle="double"
            />
          </div>

          {/* 오른쪽 콘텐츠 영역 */}
          <div className="flex-grow">
            <TextBox 
              title="PC통신 UI 컴포넌트 데모" 
              borderStyle="single"
              padding="1rem"
            >
              <div className="space-y-4">
                <p>이 페이지는 PC통신 스타일 UI 컴포넌트들을 테스트하기 위한 데모 페이지입니다.</p>
                <p>왼쪽의 메뉴에서 항목을 선택해보세요.</p>
                <p>현재 선택된 메뉴: <span className="text-pc-text-yellow">{menuItems.find(item => item.id === selectedMenuId)?.label}</span></p>
              </div>
            </TextBox>

            <div className="mt-4">
              <TextBox 
                title="테두리 스타일 예시" 
                borderStyle="double"
                padding="1rem"
              >
                <div className="grid grid-cols-2 gap-4">
                  <TextBox title="단일선 테두리" borderStyle="single" padding="0.5rem">
                    <p>단일선 테두리 스타일입니다.</p>
                  </TextBox>
                  
                  <TextBox title="이중선 테두리" borderStyle="double" padding="0.5rem">
                    <p>이중선 테두리 스타일입니다.</p>
                  </TextBox>
                  
                  <TextBox title="혼합 테두리" borderStyle="mixed" padding="0.5rem">
                    <p>혼합 테두리 스타일입니다.</p>
                  </TextBox>
                  
                  <TextBox title="테두리 없음" borderStyle="none" padding="0.5rem">
                    <p>테두리가 없는 스타일입니다.</p>
                  </TextBox>
                </div>
              </TextBox>
            </div>
          </div>
        </div>
      </div>
    </PCLayout>
  );
};

export default PCComponentsDemo; 