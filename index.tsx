/**
 * 레거시 진입점 파일
 * 이 파일은 src/index.tsx로 리디렉션합니다.
 */
import './src/index'; // src/index.tsx 파일을 가리킵니다.

// 이 파일은 레거시로 취급되며, 실제 앱은 src/index.tsx에서 시작됩니다.

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
