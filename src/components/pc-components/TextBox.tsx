/**
 * PC통신 스타일 텍스트 박스 컴포넌트
 * ASCII 테두리를 가진 텍스트 박스를 렌더링합니다.
 */
import React, { ReactNode, CSSProperties, useRef, useState, useEffect } from 'react';
import { BORDER_SINGLE, BORDER_DOUBLE, BORDER_MIXED } from '../../styles/asciiChars';
import { pcColors } from '../../styles/colors';

// 테두리 스타일 타입 정의
export type BorderStyle = 'single' | 'double' | 'mixed' | 'none';

interface TextBoxProps {
  children: ReactNode;
  title?: string;           // 텍스트 박스 제목
  width?: string | number;  // 박스 너비
  height?: string | number; // 박스 높이
  borderStyle?: BorderStyle; // 테두리 스타일
  borderColor?: string;     // 테두리 색상
  className?: string;       // 추가 클래스
  padding?: string | number; // 내부 패딩
  textAlign?: 'left' | 'center' | 'right'; // 텍스트 정렬
  titleAlign?: 'left' | 'center' | 'right'; // 제목 정렬
  style?: CSSProperties;    // 추가 스타일
}

/**
 * ASCII 테두리를 가진 텍스트 박스 컴포넌트
 * 다양한 테두리 스타일과 제목 표시 기능을 지원합니다.
 */
const TextBox: React.FC<TextBoxProps> = ({
  children,
  title,
  width = 'auto',
  height = 'auto',
  borderStyle = 'single',
  borderColor = pcColors.border.primary,
  className = '',
  padding = '1rem',
  textAlign = 'left',
  titleAlign = 'center',
  style = {}
}) => {
  // 테두리 너비 계산을 위한 ref와 state
  const containerRef = useRef<HTMLDivElement>(null);
  const [borderWidth, setBorderWidth] = useState<number>(50);
  
  // 화면 너비에 맞게 테두리 너비 계산
  useEffect(() => {
    const updateBorderWidth = () => {
      if (containerRef.current) {
        // 컨테이너 너비 측정
        const containerWidth = containerRef.current.offsetWidth;
        // 좌우 테두리 문자 2개 제외한 너비 계산 (고정폭 폰트 기준)
        const charWidth = 8; // 고정폭 폰트에서 한 문자당 약 8px로 가정
        const chars = Math.floor((containerWidth - (2 * charWidth)) / charWidth);
        setBorderWidth(Math.max(10, chars)); // 최소 10자 이상
      }
    };

    // 초기 렌더링 및 창 크기 변경 시 테두리 너비 업데이트
    updateBorderWidth();
    window.addEventListener('resize', updateBorderWidth);
    
    return () => {
      window.removeEventListener('resize', updateBorderWidth);
    };
  }, []);
  
  // 테두리 스타일에 따른 문자 세트 선택
  const getBorderChars = () => {
    switch(borderStyle) {
      case 'double':
        return BORDER_DOUBLE;
      case 'mixed':
        return BORDER_MIXED;
      case 'single':
        return BORDER_SINGLE;
      case 'none':
        return null;
      default:
        return BORDER_SINGLE;
    }
  };

  // 테두리가 없는 경우 단순 렌더링
  if (borderStyle === 'none') {
    return (
      <div 
        className={`font-pc ${className}`}
        style={{ 
          width, 
          height, 
          padding, 
          textAlign,
          color: pcColors.text.primary,
          ...style
        }}
      >
        {title && (
          <div 
            className="text-pc-text-yellow font-bold mb-2"
            style={{ 
              textAlign: titleAlign,
              color: pcColors.text.accent
            }}
          >
            {title}
          </div>
        )}
        {children}
      </div>
    );
  }

  // 테두리 문자 세트
  const borderChars = getBorderChars();
  
  // 제목 위치에 따른 클래스
  const getTitleAlignClass = () => {
    switch(titleAlign) {
      case 'left': return 'text-left pl-4';
      case 'right': return 'text-right pr-4';
      default: return 'text-center';
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative font-pc flex flex-col ${className}`}
      style={{ 
        width, 
        height,
        color: pcColors.text.primary,
        ...style
      }}
    >
      {/* 상단 테두리 */}
      <div className="flex items-center overflow-hidden whitespace-nowrap">
        <span style={{ color: borderColor }}>{borderChars?.topLeft}</span>
        {title ? (
          <>
            <div 
              className={`flex-grow ${getTitleAlignClass()}`}
              style={{ color: pcColors.text.accent }}
            >
              <span style={{ color: borderColor }}>
                {borderChars?.horizontal.repeat(2)}
              </span>
              <span className="px-2 font-bold">{title}</span>
              <span style={{ color: borderColor }}>
                {borderChars?.horizontal.repeat(2)}
              </span>
            </div>
          </>
        ) : (
          <div className="flex-grow" style={{ color: borderColor }}>
            {borderChars?.horizontal.repeat(borderWidth)}
          </div>
        )}
        <span style={{ color: borderColor }}>{borderChars?.topRight}</span>
      </div>
      
      {/* 콘텐츠 영역 */}
      <div 
        className="flex flex-grow overflow-hidden"
        style={{ minHeight: '2rem' }}
      >
        <div style={{ color: borderColor }}>{borderChars?.vertical}</div>
        <div 
          className="flex-grow overflow-auto"
          style={{ 
            padding, 
            textAlign
          }}
        >
          {children}
        </div>
        <div style={{ color: borderColor }}>{borderChars?.vertical}</div>
      </div>
      
      {/* 하단 테두리 */}
      <div className="flex overflow-hidden whitespace-nowrap">
        <span style={{ color: borderColor }}>{borderChars?.bottomLeft}</span>
        <div className="flex-grow" style={{ color: borderColor }}>
          {borderChars?.horizontal.repeat(borderWidth)}
        </div>
        <span style={{ color: borderColor }}>{borderChars?.bottomRight}</span>
      </div>
    </div>
  );
};

export default TextBox; 