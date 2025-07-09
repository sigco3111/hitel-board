/**
 * PC통신 스타일 로그인 화면 컴포넌트
 * ASCII 아트 로고와 텍스트 기반 로그인 폼을 제공합니다.
 */
import React, { useState, useEffect } from 'react';
import { GoogleIcon, UserIcon } from './icons';
import { useAuth } from '../src/hooks/useAuth';
import type { User } from '../types';
import { 
  PCLayout, 
  TextBox, 
  PCHeader, 
  AsciiArt, 
  DEFAULT_LOGOS 
} from '../src/components/pc-components';
import { pcColors } from '../src/styles/colors';
import { BORDER_DOUBLE } from '../src/styles/asciiChars';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

/**
 * PC통신 스타일 로그인 화면 컴포넌트
 * 하이텔 스타일의 로그인 화면을 구현합니다.
 */
const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [time, setTime] = useState(new Date());
  const { signInWithGoogle, signInAnonymously, isLoading, error, user } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<'google' | 'guest'>('google');

  // 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000); // 1초마다 업데이트
    return () => clearInterval(timer);
  }, []);

  // 에러 처리
  useEffect(() => {
    if (error) {
      setLoginError(error);
      const timer = setTimeout(() => setLoginError(null), 5000); // 5초 후 에러 메시지 제거
      return () => clearTimeout(timer);
    }
  }, [error]);

  // 사용자 로그인 감지
  useEffect(() => {
    if (user) {
      console.log('사용자 로그인 감지:', user);
      onLogin(user);
    }
  }, [user, onLogin]);

  // 구글 로그인 처리
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithGoogle();
      if (result) {
        console.log('구글 로그인 성공:', result);
        onLogin(result);
      }
    } catch (err) {
      console.error('구글 로그인 처리 중 오류:', err);
    }
  };
  
  // 게스트 로그인 처리
  const handleGuestLogin = async () => {
    try {
      if (signInAnonymously) {
        const result = await signInAnonymously();
        if (result) {
          console.log('게스트 로그인 성공:', result);
          onLogin(result);
        }
      } else {
        const guestUser = {
          uid: 'guest-' + Math.random().toString(36).substring(2, 15),
          displayName: '게스트',
          isAnonymous: true
        };
        console.log('임시 게스트 로그인 생성:', guestUser);
        onLogin(guestUser);
      }
    } catch (err) {
      console.error('게스트 로그인 처리 중 오류:', err);
    }
  };

  // 키보드 이벤트 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      // 위/아래 화살표 키로 옵션 전환
      setSelectedOption(prev => prev === 'google' ? 'guest' : 'google');
    } else if (e.key === 'Enter') {
      // 엔터 키로 선택된 옵션 실행
      if (selectedOption === 'google') {
        handleGoogleLogin();
      } else {
        handleGuestLogin();
      }
    }
  };

  // 로그인 처리
  const handleLogin = () => {
    if (selectedOption === 'google') {
      handleGoogleLogin();
    } else {
      handleGuestLogin();
    }
  };

  // 현재 시간 포맷팅
  const formattedTime = time.toLocaleTimeString('ko-KR', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <PCLayout fullScreen>
      {/* 헤더 */}
      <PCHeader 
        title="하이텔 게시판" 
        info={formattedTime}
        borderStyle="double"
      />

      <div className="flex flex-col items-center justify-center h-[calc(100vh-60px)] p-4">
        {/* 로고 */}
        <div className="mb-8">
          <AsciiArt 
            art={DEFAULT_LOGOS.HITEL}
            color={pcColors.text.accent}
            centered
            animate
          />
          <div className="text-center text-pc-text-cyan mt-2">
            PC통신 스타일 게시판
          </div>
        </div>

        {/* 로그인 박스 */}
        <TextBox 
          title="로그인" 
          borderStyle="double"
          width="100%"
          className="mx-auto"
          padding="2rem"
          style={{ maxWidth: '500px' }}
        >
          <div 
            className="flex flex-col space-y-4"
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
            {/* 로그인 옵션 */}
            <div 
              className={`
                flex items-center p-2 cursor-pointer
                ${selectedOption === 'google' ? 'bg-pc-selection-bg text-pc-selection-text' : ''}
              `}
              onClick={() => setSelectedOption('google')}
            >
              <span className="inline-block w-4 mr-2">
                {selectedOption === 'google' ? '→' : ' '}
              </span>
              <span>Google 계정으로 로그인</span>
            </div>
            
            <div 
              className={`
                flex items-center p-2 cursor-pointer
                ${selectedOption === 'guest' ? 'bg-pc-selection-bg text-pc-selection-text' : ''}
              `}
              onClick={() => setSelectedOption('guest')}
            >
              <span className="inline-block w-4 mr-2">
                {selectedOption === 'guest' ? '→' : ' '}
              </span>
              <span>게스트로 로그인</span>
            </div>

            {/* 로그인 버튼 */}
            <div className="pt-4 flex justify-center">
              <button 
                className="pc-button px-8 py-2"
                onClick={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </button>
            </div>

            {/* 로딩 표시 */}
            {isLoading && (
              <div className="text-center mt-4">
                <div className="inline-block">
                  <span className="animate-pulse">■</span>
                  <span className="animate-pulse delay-100">■</span>
                  <span className="animate-pulse delay-200">■</span>
                </div>
              </div>
            )}

            {/* 에러 메시지 */}
            {loginError && (
              <div className="mt-4 p-2 text-pc-text-red border border-pc-text-red">
                <p>오류: {loginError}</p>
              </div>
            )}
          </div>
        </TextBox>

        {/* 안내 메시지 */}
        <div className="mt-8 text-center text-pc-text-white">
          <p>방향키(↑/↓)로 이동하고 Enter 키를 눌러 로그인하세요.</p>
          <p className="mt-2 text-pc-text-cyan">© 2025 하이텔 게시판</p>
        </div>
      </div>
    </PCLayout>
  );
};

export default LoginScreen;
