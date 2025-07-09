/**
 * PC통신 스타일 기본 레이아웃 컴포넌트
 * 전체 애플리케이션에 PC통신 스타일의 기본 배경과 레이아웃 구조를 제공합니다.
 */
import React, { ReactNode } from 'react';
import { pcColors } from '../../styles/colors';

interface PCLayoutProps {
  children: ReactNode;
  className?: string;
  fullScreen?: boolean; // 전체 화면 모드 여부
}

/**
 * PC통신 스타일의 기본 레이아웃을 제공하는 컴포넌트
 * 짙은 파란색 배경과 고정폭 폰트를 기본으로 적용합니다.
 */
const PCLayout: React.FC<PCLayoutProps> = ({ 
  children, 
  className = '', 
  fullScreen = true 
}) => {
  return (
    <div 
      className={`bg-pc-bg-deep-blue text-pc-text-white font-pc ${fullScreen ? 'min-h-screen w-full' : ''} ${className}`}
      style={{
        backgroundColor: pcColors.background.primary,
        color: pcColors.text.primary,
      }}
    >
      {children}
    </div>
  );
};

export default PCLayout; 