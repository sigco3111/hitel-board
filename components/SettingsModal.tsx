/**
 * 설정 모달 컴포넌트
 * 바탕화면 배경 및 기타 시스템 설정을 변경할 수 있는 모달 창입니다.
 */
import React, { useState, useEffect, useRef } from 'react';
import TrafficLights from './TrafficLights';
import Dashboard from './Dashboard';

// 기본 배경화면 경로
const DEFAULT_WALLPAPER = '/assets/wallpapers/default.jpg';
// 대체 배경색
const FALLBACK_BG_COLOR = '#1E3A8A'; // 짙은 파란색

// 로컬 스토리지 키
const WALLPAPER_KEY = 'mac_board_wallpaper';
const WALLPAPER_TYPE_KEY = 'mac_board_wallpaper_type';

/**
 * 설정 모달 컴포넌트 속성
 */
interface SettingsModalProps {
  /** 모달이 열려 있는지 여부 */
  isOpen: boolean;
  /** 모달 닫기 핸들러 */
  onClose: () => void;
  /** 배경화면 변경 핸들러 */
  onWallpaperChange: (wallpaperUrl: string) => void;
}

/**
 * 설정 모달 컴포넌트
 */
const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onWallpaperChange 
}) => {
  const [activeTab, setActiveTab] = useState<string>('wallpaper');
  const [wallpaperUrl, setWallpaperUrl] = useState<string>(() => {
    // 로컬 스토리지에서 배경화면 URL 불러오기
    const type = localStorage.getItem(WALLPAPER_TYPE_KEY);
    if (type === 'default') {
      return DEFAULT_WALLPAPER;
    } else {
      return localStorage.getItem(WALLPAPER_KEY) || DEFAULT_WALLPAPER;
    }
  });
  const [isDefaultBackground, setIsDefaultBackground] = useState<boolean>(() => {
    // 로컬 스토리지에 저장된 배경화면이 없거나 기본 배경화면인 경우
    const type = localStorage.getItem(WALLPAPER_TYPE_KEY);
    return type === 'default' || !localStorage.getItem(WALLPAPER_KEY);
  });
  const [defaultImageError, setDefaultImageError] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 기본 이미지 로딩 오류 감지
  useEffect(() => {
    if (wallpaperUrl === DEFAULT_WALLPAPER) {
      const img = new Image();
      img.onload = () => setDefaultImageError(false);
      img.onerror = () => setDefaultImageError(true);
      img.src = DEFAULT_WALLPAPER;
    }
  }, [wallpaperUrl]);

  /**
   * 파일을 Base64 문자열로 변환하는 함수
   */
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // 파일 선택 핸들러
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // 선택한 파일이 이미지인지 확인
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 선택할 수 있습니다.');
      return;
    }
    
    try {
      // 파일 크기 체크 (10MB 제한)
      if (file.size > 10 * 1024 * 1024) {
        alert('10MB 이하의 이미지 파일만 선택할 수 있습니다.');
        return;
      }

      // 파일을 Base64로 변환
      const base64String = await fileToBase64(file);
      setWallpaperUrl(base64String);
      setIsDefaultBackground(false);
      setDefaultImageError(false);
      onWallpaperChange(base64String);
      
      // 로컬 스토리지에 저장
      localStorage.setItem(WALLPAPER_KEY, base64String);
      localStorage.setItem(WALLPAPER_TYPE_KEY, 'custom');
    } catch (error) {
      console.error('배경화면 이미지 설정 오류:', error);
      alert('이미지 설정 중 오류가 발생했습니다. 다른 이미지를 시도해주세요.');
    }
  };

  // 기본 배경화면으로 초기화
  const handleResetWallpaper = () => {
    setWallpaperUrl(DEFAULT_WALLPAPER);
    setIsDefaultBackground(true);
    onWallpaperChange(''); // 빈 문자열을 전달하여 Desktop.tsx에서 기본 배경화면으로 초기화하게 함
    localStorage.removeItem(WALLPAPER_KEY);
    localStorage.setItem(WALLPAPER_TYPE_KEY, 'default');
    
    // 기본 이미지 로딩 확인
    const img = new Image();
    img.onload = () => setDefaultImageError(false);
    img.onerror = () => setDefaultImageError(true);
    img.src = DEFAULT_WALLPAPER;
  };

  // 파일 선택 다이얼로그 열기
  const handleOpenFileDialog = () => {
    fileInputRef.current?.click();
  };

  // 배경화면 미리보기 스타일 결정
  const previewBgStyle = defaultImageError || (wallpaperUrl === DEFAULT_WALLPAPER && defaultImageError) ? 
    { backgroundColor: FALLBACK_BG_COLOR } : 
    { 
      backgroundImage: `url(${wallpaperUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    };

  // 배경화면 탭 내용 렌더링
  const renderWallpaperTab = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">바탕화면 배경</h3>
        
        {/* 현재 배경화면 미리보기 */}
        <div className="bg-gray-100 rounded-md p-2">
          <div 
            className="w-full h-36 rounded-md bg-cover bg-center"
            style={previewBgStyle}
          ></div>
        </div>
        
        {/* 배경화면 설정 버튼 */}
        <div className="flex flex-col space-y-2">
          <button
            onClick={handleOpenFileDialog}
            className="bg-mac-blue text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            배경화면 이미지 선택
          </button>
          
          <button
            onClick={handleResetWallpaper}
            className="border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-100 transition-colors"
          >
            기본 배경화면으로 초기화
          </button>
          
          {/* 숨겨진 파일 입력 */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
        
        <p className="text-sm text-gray-500">
          원하는 이미지 파일을 선택하여 바탕화면 배경을 변경할 수 있습니다.
          지원 형식: JPG, PNG, GIF (최대 10MB)
        </p>
        {defaultImageError && isDefaultBackground && (
          <p className="text-xs text-orange-500">
            기본 배경화면 이미지를 불러올 수 없어 기본 색상으로 표시됩니다.
            이미지 파일을 선택하여 배경화면을 변경해보세요.
          </p>
        )}
      </div>
    );
  };

  // 대시보드 탭 내용 렌더링
  const renderDashboardTab = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">대시보드</h3>
        <Dashboard />
      </div>
    );
  };

  return isOpen ? (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
      <div 
        className="bg-white/90 backdrop-blur-lg rounded-lg shadow-mac-window w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 창 상단바 */}
        <div className="flex items-center justify-between p-3 bg-gray-100/80 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <TrafficLights onClose={onClose} />
          </div>
          <div className="text-center font-semibold">시스템 설정</div>
          <div className="w-14"></div>
        </div>
        
        {/* 설정 내용 */}
        <div className="flex h-[500px]">
          {/* 사이드바 */}
          <div className="w-36 border-r border-gray-200 p-2 space-y-1">
            <button
              onClick={() => setActiveTab('wallpaper')}
              className={`w-full text-left px-2 py-1 rounded-md text-sm ${
                activeTab === 'wallpaper' 
                  ? 'bg-blue-500 text-white' 
                  : 'hover:bg-gray-100 text-gray-800'
              }`}
            >
              바탕화면
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left px-2 py-1 rounded-md text-sm ${
                activeTab === 'dashboard' 
                  ? 'bg-blue-500 text-white' 
                  : 'hover:bg-gray-100 text-gray-800'
              }`}
            >
              대시보드
            </button>
          </div>
          
          {/* 내용 영역 */}
          <div className="flex-1 p-3 overflow-y-auto">
            {activeTab === 'wallpaper' ? renderWallpaperTab() : renderDashboardTab()}
          </div>
        </div>
      </div>
    </div>
  ) : null;
};

export default SettingsModal; 