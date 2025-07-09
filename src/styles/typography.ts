/**
 * PC통신 스타일 타이포그래피 설정
 * 고정폭 폰트와 텍스트 스타일을 정의합니다.
 */

// 기본 폰트 패밀리 설정
export const FONT_FAMILY = {
  // 기본 고정폭 폰트 (PC통신 느낌을 위한)
  monospace: [
    'Courier New',
    'monospace',
    'D2Coding',
    'Consolas',
    'Liberation Mono',
  ].join(', '),
  
  // 마크다운 렌더링을 위한 보조 폰트
  markdownBody: [
    'Courier New',
    'monospace',
    'D2Coding',
    'Consolas',
    'Liberation Mono',
  ].join(', '),
};

// 폰트 사이즈 설정
export const FONT_SIZE = {
  xs: '0.75rem',     // 12px
  sm: '0.875rem',    // 14px
  base: '1rem',      // 16px
  lg: '1.125rem',    // 18px
  xl: '1.25rem',     // 20px
  '2xl': '1.5rem',   // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem',  // 36px
};

// 텍스트 스타일 (마크다운 출력용)
export const TEXT_STYLE = {
  // 제목 스타일
  heading: {
    h1: {
      fontSize: FONT_SIZE['2xl'],
      fontFamily: FONT_FAMILY.monospace,
      fontWeight: 'bold',
    },
    h2: {
      fontSize: FONT_SIZE.xl,
      fontFamily: FONT_FAMILY.monospace,
      fontWeight: 'bold',
    },
    h3: {
      fontSize: FONT_SIZE.lg,
      fontFamily: FONT_FAMILY.monospace,
      fontWeight: 'bold',
    },
    h4: {
      fontSize: FONT_SIZE.base,
      fontFamily: FONT_FAMILY.monospace,
      fontWeight: 'bold',
    },
  },
  
  // 본문 스타일
  body: {
    normal: {
      fontSize: FONT_SIZE.base,
      fontFamily: FONT_FAMILY.monospace,
      lineHeight: 1.5,
    },
    small: {
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.monospace,
      lineHeight: 1.5,
    },
  },
  
  // 코드 블록 스타일
  code: {
    block: {
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.monospace,
      lineHeight: 1.4,
      padding: '0.5rem',
    },
    inline: {
      fontSize: FONT_SIZE.sm,
      fontFamily: FONT_FAMILY.monospace,
      padding: '0.125rem 0.25rem',
    },
  },
};

// 글자 간격 설정
export const LETTER_SPACING = {
  normal: '0',
  wide: '0.025em',
};

// PC통신 스타일 텍스트 스타일 타입 정의
interface PCTextStyle {
  fontFamily: string;
  fontSize: string;
  fontWeight?: string;
  letterSpacing?: string;
  lineHeight?: number | string;
}

// PC통신 스타일의 텍스트 스타일 정의
export const PC_TEXT_STYLE: Record<string, PCTextStyle> = {
  // 메뉴 제목
  menuTitle: {
    fontFamily: FONT_FAMILY.monospace,
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
    letterSpacing: LETTER_SPACING.wide,
  },
  
  // 메뉴 항목
  menuItem: {
    fontFamily: FONT_FAMILY.monospace,
    fontSize: FONT_SIZE.base,
    letterSpacing: LETTER_SPACING.wide,
  },
  
  // 게시판 제목
  boardTitle: {
    fontFamily: FONT_FAMILY.monospace,
    fontSize: FONT_SIZE.xl,
    fontWeight: 'bold',
    letterSpacing: LETTER_SPACING.wide,
  },
  
  // 게시물 목록 항목
  postListItem: {
    fontFamily: FONT_FAMILY.monospace,
    fontSize: FONT_SIZE.base,
  },
  
  // 게시물 제목
  postTitle: {
    fontFamily: FONT_FAMILY.monospace,
    fontSize: FONT_SIZE.lg,
    fontWeight: 'bold',
  },
  
  // 게시물 내용
  postContent: {
    fontFamily: FONT_FAMILY.monospace,
    fontSize: FONT_SIZE.base,
    lineHeight: 1.6,
  },
};

// PC통신 스타일에 특화된 CSS 클래스 네임 생성 헬퍼
export const generatePCTextClass = (style: keyof typeof PC_TEXT_STYLE): string => {
  const baseStyles = PC_TEXT_STYLE[style];
  return `font-family: ${baseStyles.fontFamily}; font-size: ${baseStyles.fontSize}; ${baseStyles.fontWeight ? `font-weight: ${baseStyles.fontWeight};` : ''} ${baseStyles.letterSpacing ? `letter-spacing: ${baseStyles.letterSpacing};` : ''} ${baseStyles.lineHeight ? `line-height: ${baseStyles.lineHeight};` : ''}`;
};

export default {
  FONT_FAMILY,
  FONT_SIZE,
  TEXT_STYLE,
  LETTER_SPACING,
  PC_TEXT_STYLE,
  generatePCTextClass
}; 