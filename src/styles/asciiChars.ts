/**
 * PC통신 스타일 ASCII 특수문자 세트 정의
 * UI 요소(테두리, 구분선 등)에 사용될 ASCII 문자들을 정의합니다.
 */

// 기본 테두리 문자 (단일 라인)
export const BORDER_SINGLE = {
  horizontal: '─',  // 가로선
  vertical: '│',    // 세로선
  topLeft: '┌',     // 좌상단 모서리
  topRight: '┐',    // 우상단 모서리
  bottomLeft: '└',  // 좌하단 모서리
  bottomRight: '┘', // 우하단 모서리
  verticalLeft: '├', // T자 좌측
  verticalRight: '┤', // T자 우측
  horizontalTop: '┬', // T자 상단
  horizontalBottom: '┴', // T자 하단
  cross: '┼',       // 십자 교차점
};

// 이중 테두리 문자 (더블 라인)
export const BORDER_DOUBLE = {
  horizontal: '═',  // 가로선
  vertical: '║',    // 세로선
  topLeft: '╔',     // 좌상단 모서리
  topRight: '╗',    // 우상단 모서리
  bottomLeft: '╚',  // 좌하단 모서리
  bottomRight: '╝', // 우하단 모서리
  verticalLeft: '╠', // T자 좌측
  verticalRight: '╣', // T자 우측
  horizontalTop: '╦', // T자 상단
  horizontalBottom: '╩', // T자 하단
  cross: '╬',       // 십자 교차점
};

// 강조 테두리 (단일/이중 혼합)
export const BORDER_MIXED = {
  horizontal: '─',   // 가로선 (단일)
  vertical: '║',     // 세로선 (이중)
  topLeft: '╓',      // 좌상단 모서리 (혼합)
  topRight: '╖',     // 우상단 모서리 (혼합)
  bottomLeft: '╙',   // 좌하단 모서리 (혼합)
  bottomRight: '╜',  // 우하단 모서리 (혼합)
};

// 블록 문자 (채우기용)
export const BLOCK = {
  full: '█',        // 전체 블록
  shade: '▓',       // 짙은 명암
  mediumShade: '▒', // 중간 명암
  lightShade: '░',  // 연한 명암
};

// 기타 특수 문자
export const SPECIAL = {
  bullet: '•',      // 글머리 기호
  arrow: '→',       // 화살표
  leftArrow: '←',   // 왼쪽 화살표
  upArrow: '↑',     // 위쪽 화살표
  downArrow: '↓',   // 아래쪽 화살표
  doubleArrow: '⇒', // 이중 화살표
  checkbox: '☐',    // 빈 체크박스
  checkedBox: '☑',  // 체크된 체크박스
  star: '★',        // 별표
  emptyStar: '☆',   // 빈 별표
};

// 박스 그리기 헬퍼 함수
export const drawBox = (
  width: number, 
  height: number, 
  style: 'single' | 'double' | 'mixed' = 'single'
): string => {
  const border = style === 'double' ? BORDER_DOUBLE : 
                 style === 'mixed' ? BORDER_MIXED : 
                 BORDER_SINGLE;
  
  let result = '';
  
  // 상단 테두리
  result += border.topLeft;
  result += border.horizontal.repeat(width - 2);
  result += border.topRight;
  result += '\n';
  
  // 중간 내용
  for (let i = 0; i < height - 2; i++) {
    result += border.vertical;
    result += ' '.repeat(width - 2);
    result += border.vertical;
    result += '\n';
  }
  
  // 하단 테두리
  result += border.bottomLeft;
  result += border.horizontal.repeat(width - 2);
  result += border.bottomRight;
  
  return result;
};

// 제목 상자 그리기 헬퍼 함수 (예: ╔════ 제목 ════╗)
export const drawTitleBox = (
  title: string,
  width: number,
  style: 'single' | 'double' = 'double'
): string => {
  const border = style === 'double' ? BORDER_DOUBLE : BORDER_SINGLE;
  const padding = Math.max(0, width - title.length - 2);
  const leftPadding = Math.floor(padding / 2);
  const rightPadding = padding - leftPadding;
  
  return `${border.topLeft}${border.horizontal.repeat(leftPadding)} ${title} ${border.horizontal.repeat(rightPadding)}${border.topRight}`;
};

// 구분선 그리기 헬퍼 함수
export const drawDivider = (
  width: number,
  style: 'single' | 'double' = 'single'
): string => {
  const border = style === 'double' ? BORDER_DOUBLE : BORDER_SINGLE;
  return border.horizontal.repeat(width);
};

// 메뉴 아이템 포맷팅 (예: "→ 메뉴 항목")
export const formatMenuItem = (
  text: string, 
  selected: boolean = false
): string => {
  return selected 
    ? `${SPECIAL.arrow} ${text}` 
    : `  ${text}`;
};

export default {
  BORDER_SINGLE,
  BORDER_DOUBLE,
  BORDER_MIXED,
  BLOCK,
  SPECIAL,
  drawBox,
  drawTitleBox,
  drawDivider,
  formatMenuItem
}; 