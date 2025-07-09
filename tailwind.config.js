/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // PC통신 스타일 색상 (기존 맥 스타일 색상은 유지하되 필요 시 삭제 가능)
        'mac-blue': '#0070c9',
        'mac-gray': '#f5f5f7',
        'mac-dark': '#1d1d1f',
        'mac-light': '#fbfbfd',
        'mac-border': '#d2d2d7',
        'mac-window': 'rgba(255, 255, 255, 0.8)',
        'mac-sidebar': '#f9f9f9',

        // PC통신 색상 추가
        'pc-bg': {
          'deep-blue': '#00008B',  // 기본 배경색
          'blue': '#0000CD',       // 보조 배경색
          'light-blue': '#1E3A8A', // 강조 배경색
        },
        'pc-text': {
          'white': '#FFFFFF',      // 기본 텍스트
          'yellow': '#FFFF00',     // 강조 텍스트
          'cyan': '#00FFFF',       // 서브 강조 텍스트
          'green': '#00FF00',      // 성공/확인 텍스트
          'red': '#FF0000',        // 경고/오류 텍스트
          'gray': '#AAAAAA',       // 비활성화 텍스트
        },
        'pc-border': {
          'white': '#FFFFFF',      // 기본 테두리
          'yellow': '#FFFF00',     // 강조 테두리
        },
        'pc-selection': {
          'bg': '#FFFF00',         // 선택된 항목 배경색
          'text': '#00008B',       // 선택된 항목 텍스트 색상
        },
      },
      fontFamily: {
        'mac': ['-apple-system', 'BlinkMacSystemFont', 'San Francisco', 'Helvetica Neue', 'sans-serif'],
        
        // PC통신 고정폭 폰트 추가
        'pc': ['Courier New', 'monospace', 'D2Coding', 'Consolas', 'Liberation Mono'],
      },
      boxShadow: {
        'mac-window': '0 10px 30px rgba(0, 0, 0, 0.1)',
        'mac-dock': '0 0 20px rgba(0, 0, 0, 0.2)',
        
        // PC통신 스타일 그림자 없음 (플랫 디자인)
        'pc-flat': 'none',
      },
      backdropBlur: {
        'mac': '20px',
      },
      // PC통신 스타일을 위한 테두리 스타일 추가
      borderWidth: {
        '1': '1px',
        '2': '2px',
        '3': '3px',
      },
      // ASCII 아트를 위한 고정폭 설정
      spacing: {
        'char': '0.6em', // 문자 기반 간격
      },
      // 줄 높이 설정
      lineHeight: {
        'pc-tight': '1.2',
        'pc-normal': '1.5',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 