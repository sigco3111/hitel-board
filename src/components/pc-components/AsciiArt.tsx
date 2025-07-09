/**
 * PC통신 스타일 ASCII 아트 컴포넌트
 * 로고나 장식 요소로 사용될 수 있는 ASCII 아트를 렌더링합니다.
 */
import React from 'react';
import { pcColors } from '../../styles/colors';

interface AsciiArtProps {
  art: string;                  // ASCII 아트 문자열
  color?: string;               // 색상
  className?: string;           // 추가 클래스
  preserveWhitespace?: boolean; // 공백 보존 여부
  animate?: boolean;            // 애니메이션 효과 적용 여부
  animationSpeed?: number;      // 애니메이션 속도 (ms)
  centered?: boolean;           // 중앙 정렬 여부
}

/**
 * ASCII 아트를 렌더링하는 컴포넌트
 * 로고, 배너, 장식 요소 등으로 활용할 수 있습니다.
 */
const AsciiArt: React.FC<AsciiArtProps> = ({
  art,
  color = pcColors.text.accent,
  className = '',
  preserveWhitespace = true,
  animate = false,
  animationSpeed = 100,
  centered = false,
}) => {
  const [displayedArt, setDisplayedArt] = React.useState<string>('');
  const [animationIndex, setAnimationIndex] = React.useState<number>(0);

  // 애니메이션 효과 구현
  React.useEffect(() => {
    if (!animate) {
      setDisplayedArt(art);
      return;
    }

    // 애니메이션 효과를 위한 타이머 설정
    const timer = setInterval(() => {
      if (animationIndex < art.length) {
        setDisplayedArt(prev => prev + art[animationIndex]);
        setAnimationIndex(prev => prev + 1);
      } else {
        clearInterval(timer);
      }
    }, animationSpeed);

    return () => clearInterval(timer);
  }, [art, animate, animationSpeed, animationIndex]);

  // 줄바꿈 처리 및 공백 보존
  const formattedArt = animate ? displayedArt : art;
  const lines = formattedArt.split('\n');

  return (
    <div 
      className={`font-pc ${centered ? 'text-center' : ''} ${className}`}
      style={{ color }}
    >
      {preserveWhitespace ? (
        <pre className="font-pc whitespace-pre">
          {formattedArt}
        </pre>
      ) : (
        lines.map((line, index) => (
          <div key={index} className="font-pc">
            {line || <br />}
          </div>
        ))
      )}
    </div>
  );
};

// 기본 제공되는 ASCII 아트 로고 (예시)
export const DEFAULT_LOGOS = {
  HITEL: `
  ██   ██ ██ ████████ ███████ ██      
  ██   ██ ██    ██    ██      ██      
  ███████ ██    ██    █████   ██      
  ██   ██ ██    ██    ██      ██      
  ██   ██ ██    ██    ███████ ███████ 
  `,
  BOARD: `
  ██████   ██████   █████  ██████  ██████  
  ██   ██ ██    ██ ██   ██ ██   ██ ██   ██ 
  ██████  ██    ██ ███████ ██████  ██   ██ 
  ██   ██ ██    ██ ██   ██ ██   ██ ██   ██ 
  ██████   ██████  ██   ██ ██   ██ ██████  
  `,
  WELCOME: `
  ██     ██ ███████ ██       ██████  ██████  ███    ███ ███████ 
  ██     ██ ██      ██      ██      ██    ██ ████  ████ ██      
  ██  █  ██ █████   ██      ██      ██    ██ ██ ████ ██ █████   
  ██ ███ ██ ██      ██      ██      ██    ██ ██  ██  ██ ██      
   ███ ███  ███████ ███████  ██████  ██████  ██      ██ ███████ 
  `
};

export default AsciiArt; 