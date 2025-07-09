/**
 * 애플리케이션 렌더링 진입점
 * React 앱을 DOM에 마운트합니다.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { initFirestore } from './services/firebase/initFirestore';

// URL 파라미터에서 'init=firestore'가 있는지 확인하여 Firestore 초기화
const checkAndInitFirestore = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const shouldInit = urlParams.get('init');
  
  if (shouldInit === 'firestore') {
    try {
      console.log('🚀 Firestore 초기화 시작...');
      await initFirestore();
      console.log('✅ Firestore 초기화가 완료되었습니다. URL 파라미터를 제거합니다.');
      
      // 초기화 완료 후 URL 파라미터 제거
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
    } catch (error) {
      console.error('❌ Firestore 초기화 중 오류 발생:', error);
    }
  }
};

// 앱 초기화 시 Firestore 초기화 체크
checkAndInitFirestore();

// IndexSizeError 에러를 전역적으로 처리하는 핸들러 추가
window.addEventListener('error', (event) => {
  // Selection 관련 에러 감지
  if (
    event.error && 
    event.error.name === 'IndexSizeError' && 
    event.error.message && 
    event.error.message.includes('getRange')
  ) {
    console.log('Selection 에러 감지, 현재 선택 초기화');
    
    // 현재 선택 초기화 시도
    try {
      if (window.getSelection) {
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
        }
      }
    } catch (e) {
      console.error('선택 초기화 중 오류:', e);
    }
    
    // 에러 처리 완료 표시
    event.preventDefault();
  }
});

// React 앱을 DOM에 마운트
// StrictMode 비활성화 - react-beautiful-dnd와의 호환성 문제 해결을 위함
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  // <React.StrictMode> // react-beautiful-dnd와 충돌하여 일시적으로 비활성화
    <BrowserRouter>
      <App />
    </BrowserRouter>
  // </React.StrictMode>
); 