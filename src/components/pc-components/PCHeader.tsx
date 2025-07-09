/**
 * PC통신 스타일 상단 헤더 컴포넌트
 * 화면 상단에 제목과 부가 정보를 표시합니다.
 */
import React, { ReactNode, useEffect, useState, useRef } from 'react';
import { pcColors } from '../../styles/colors';
import { BORDER_DOUBLE, BORDER_SINGLE, drawDivider } from '../../styles/asciiChars';

interface PCHeaderProps {
  title: string;
  subtitle?: string;
  info?: string | ReactNode; // 우측에 표시될 정보 (예: 현재 시간, 사용자 정보 등)
  borderStyle?: 'single' | 'double' | 'none';
  className?: string;
  textAlign?: 'left' | 'center' | 'right';
  showDivider?: boolean;
}

/**
 * PC통신 스타일 상단 헤더 컴포넌트
 * 화면 상단에 제목과 부가 정보를 표시합니다.
 */
const PCHeader: React.FC<PCHeaderProps> = ({
  title,
  subtitle,
  info,
  borderStyle = 'double',
  className = '',
  textAlign = 'center',
  showDivider = true,
}) => {
  // 테두리 스타일에 따른 문자 세트 선택
  const borderChars = borderStyle === 'double' ? BORDER_DOUBLE : BORDER_SINGLE;
  const dividerRef = useRef<HTMLDivElement>(null);
  const [dividerWidth, setDividerWidth] = useState(200);
  
  // 화면 너비에 맞게 구분선 너비 계산
  useEffect(() => {
    const updateDividerWidth = () => {
      if (dividerRef.current) {
        // 글꼴이 고정폭이므로 컨테이너 너비를 글꼴 크기로 나누어 문자 수 계산
        const containerWidth = dividerRef.current.offsetWidth;
        // 고정폭 폰트에서 한 문자당 약 8px로 가정 (실제 값은 폰트에 따라 다를 수 있음)
        const charWidth = 8;
        const chars = Math.floor(containerWidth / charWidth);
        setDividerWidth(chars);
      }
    };

    // 초기 렌더링 및 창 크기 변경 시 구분선 너비 업데이트
    updateDividerWidth();
    window.addEventListener('resize', updateDividerWidth);
    
    return () => {
      window.removeEventListener('resize', updateDividerWidth);
    };
  }, []);
  
  // 텍스트 정렬에 따른 클래스
  const getAlignClass = () => {
    switch(textAlign) {
      case 'left': return 'text-left';
      case 'right': return 'text-right';
      default: return 'text-center';
    }
  };

  return (
    <div className={`w-full font-pc ${className}`}>
      {/* 헤더 제목 영역 */}
      <div className="flex justify-between items-center py-1">
        {/* 왼쪽 여백 또는 추가 정보 */}
        <div className="w-1/6"></div>
        
        {/* 중앙 제목 */}
        <div className={`flex-grow ${getAlignClass()}`}>
          <h1 
            className="text-pc-text-yellow font-bold text-xl"
            style={{ color: pcColors.text.accent }}
          >
            {borderStyle !== 'none' && (
              <span style={{ color: pcColors.border.accent }}>
                {borderChars.horizontal.repeat(3)}
              </span>
            )}
            <span className="px-3">{title}</span>
            {borderStyle !== 'none' && (
              <span style={{ color: pcColors.border.accent }}>
                {borderChars.horizontal.repeat(3)}
              </span>
            )}
          </h1>
          
          {subtitle && (
            <div 
              className="text-pc-text-cyan text-sm"
              style={{ color: pcColors.text.secondary }}
            >
              {subtitle}
            </div>
          )}
        </div>
        
        {/* 우측 정보 */}
        <div 
          className="w-1/6 text-right text-pc-text-white text-sm pr-2"
          style={{ color: pcColors.text.primary }}
        >
          {info}
        </div>
      </div>
      
      {/* 구분선 */}
      {showDivider && (
        <div 
          ref={dividerRef}
          className="w-full overflow-hidden"
          style={{ color: borderStyle === 'double' ? pcColors.border.accent : pcColors.border.primary }}
        >
          {borderStyle === 'none' ? (
            <hr className="border-pc-text-white my-1" />
          ) : (
            <div className="font-mono whitespace-nowrap">
              {drawDivider(dividerWidth, borderStyle === 'double' ? 'double' : 'single')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PCHeader; 