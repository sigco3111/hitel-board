/**
 * PC통신 UI 컴포넌트 내보내기
 * 모든 PC통신 스타일 UI 컴포넌트를 이 파일에서 내보냅니다.
 */

import PCLayout from './PCLayout';
import TextBox, { BorderStyle } from './TextBox';
import PCMenu, { MenuItem } from './PCMenu';
import PCHeader from './PCHeader';
import AsciiArt, { DEFAULT_LOGOS } from './AsciiArt';

// 컴포넌트 내보내기
export {
  PCLayout,
  TextBox,
  PCMenu,
  PCHeader,
  AsciiArt,
  DEFAULT_LOGOS,
};

// 타입 내보내기
export type { BorderStyle, MenuItem };

// 기본 내보내기
export default {
  PCLayout,
  TextBox,
  PCMenu,
  PCHeader,
  AsciiArt,
  DEFAULT_LOGOS,
}; 