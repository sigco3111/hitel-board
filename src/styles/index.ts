/**
 * PC통신 스타일 시스템 통합 내보내기
 * 스타일 관련 모든 요소를 내보내는 중앙 파일입니다.
 */

// 개별 스타일 파일들을 가져옵니다
import colors from './colors';
import asciiChars from './asciiChars';
import typography from './typography';

// 통합 스타일 객체 생성
const pcStyle = {
  colors,
  asciiChars,
  typography,
};

// 개별 요소 및 통합 객체 내보내기
export { colors, asciiChars, typography };
export default pcStyle; 