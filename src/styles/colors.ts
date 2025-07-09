/**
 * PC통신 스타일 색상 팔레트 정의
 * 90년대 PC통신(하이텔, 천리안 등)의 색상을 기반으로 합니다.
 */

// 기본 배경 색상 (짙은 파란색)
export const PC_BG_DEEP_BLUE = '#00008B'; // 기본 배경색
export const PC_BG_BLUE = '#0000CD';      // 보조 배경색
export const PC_BG_LIGHT_BLUE = '#1E3A8A'; // 강조 배경색

// 텍스트 색상
export const PC_TEXT_WHITE = '#FFFFFF';    // 기본 텍스트
export const PC_TEXT_YELLOW = '#FFFF00';   // 강조 텍스트
export const PC_TEXT_CYAN = '#00FFFF';     // 서브 강조 텍스트
export const PC_TEXT_GREEN = '#00FF00';    // 성공/확인 텍스트
export const PC_TEXT_RED = '#FF0000';      // 경고/오류 텍스트
export const PC_TEXT_GRAY = '#AAAAAA';     // 비활성화 텍스트

// 테두리 색상
export const PC_BORDER_WHITE = '#FFFFFF';  // 기본 테두리
export const PC_BORDER_YELLOW = '#FFFF00'; // 강조 테두리

// 선택 색상
export const PC_SELECTION_BG = '#FFFF00';  // 선택된 항목 배경색
export const PC_SELECTION_TEXT = '#00008B'; // 선택된 항목 텍스트 색상

// 색상 조합 객체 (컴포넌트에서 사용하기 편하게 구성)
export const pcColors = {
  // 배경
  background: {
    primary: PC_BG_DEEP_BLUE,
    secondary: PC_BG_BLUE,
    accent: PC_BG_LIGHT_BLUE,
  },
  
  // 텍스트
  text: {
    primary: PC_TEXT_WHITE,
    accent: PC_TEXT_YELLOW,
    secondary: PC_TEXT_CYAN,
    success: PC_TEXT_GREEN,
    error: PC_TEXT_RED,
    disabled: PC_TEXT_GRAY,
  },
  
  // 테두리
  border: {
    primary: PC_BORDER_WHITE,
    accent: PC_BORDER_YELLOW,
  },
  
  // 선택 상태
  selection: {
    background: PC_SELECTION_BG,
    text: PC_SELECTION_TEXT,
  }
};

export default pcColors; 