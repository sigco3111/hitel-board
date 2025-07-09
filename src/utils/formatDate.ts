/**
 * 날짜 포맷팅 유틸리티 함수
 * 다양한 형식으로 날짜를 표시하는 기능을 제공합니다.
 */

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷팅하는 함수
 * @param date 포맷팅할 날짜 객체 또는 날짜 문자열
 * @returns 포맷팅된 날짜 문자열
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // 유효한 날짜인지 확인
  if (isNaN(dateObj.getTime())) {
    console.error('유효하지 않은 날짜:', date);
    return '날짜 오류';
  }
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * 날짜를 YYYY-MM-DD HH:MM 형식으로 포맷팅하는 함수
 * @param date 포맷팅할 날짜 객체 또는 날짜 문자열
 * @returns 포맷팅된 날짜와 시간 문자열
 */
export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // 유효한 날짜인지 확인
  if (isNaN(dateObj.getTime())) {
    console.error('유효하지 않은 날짜:', date);
    return '날짜 오류';
  }
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

/**
 * 날짜를 상대적 시간으로 포맷팅하는 함수 (예: '3일 전', '방금 전')
 * @param date 포맷팅할 날짜 객체 또는 날짜 문자열
 * @returns 상대적 시간 문자열
 */
export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // 유효한 날짜인지 확인
  if (isNaN(dateObj.getTime())) {
    console.error('유효하지 않은 날짜:', date);
    return '날짜 오류';
  }
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  // 1분 미만
  if (diffInSeconds < 60) {
    return '방금 전';
  }
  
  // 1시간 미만
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }
  
  // 24시간 미만
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }
  
  // 30일 미만
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}일 전`;
  }
  
  // 12개월 미만
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}개월 전`;
  }
  
  // 1년 이상
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears}년 전`;
};

/**
 * 날짜를 한국어 형식으로 포맷팅하는 함수 (예: '2023년 5월 15일')
 * @param date 포맷팅할 날짜 객체 또는 날짜 문자열
 * @returns 한국어 형식의 날짜 문자열
 */
export const formatKoreanDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // 유효한 날짜인지 확인
  if (isNaN(dateObj.getTime())) {
    console.error('유효하지 않은 날짜:', date);
    return '날짜 오류';
  }
  
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  
  return `${year}년 ${month}월 ${day}일`;
};

/**
 * 두 날짜 사이의 일수를 계산하는 함수
 * @param startDate 시작 날짜
 * @param endDate 종료 날짜 (기본값: 현재 날짜)
 * @returns 두 날짜 사이의 일수
 */
export const daysBetween = (startDate: Date | string, endDate: Date | string = new Date()): number => {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  // 유효한 날짜인지 확인
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.error('유효하지 않은 날짜:', { startDate, endDate });
    return 0;
  }
  
  // 시간 부분을 제거하고 날짜만 비교
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  
  // 밀리초를 일로 변환 (1일 = 24시간 * 60분 * 60초 * 1000밀리초)
  return Math.floor((endUtc - startUtc) / (24 * 60 * 60 * 1000));
}; 