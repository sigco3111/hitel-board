/**
 * 대시보드 컴포넌트
 * 사이트의 주요 통계와 정보를 시각화하여 보여줍니다.
 */
import React, { useState, useEffect } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend,
  Filler 
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  fetchPosts, 
  fetchUpdatedPostsByDateRange,
  fetchPostsByDateRange
} from '../src/services/firebase/firestore';
import { UIPost } from '../src/types';

// Chart.js 컴포넌트 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * 대시보드 속성
 */
interface DashboardProps {
  // 필요시 속성 추가
}

/**
 * 날짜 범위 옵션 정의
 */
type DateRangeOption = '7days' | '30days' | '90days' | 'custom';

/**
 * 대시보드 컴포넌트
 */
const Dashboard: React.FC<DashboardProps> = () => {
  const [posts, setPosts] = useState<UIPost[]>([]);
  const [updatedPosts, setUpdatedPosts] = useState<UIPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeOption>('7days');
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const [stats, setStats] = useState({
    totalPosts: 0,
    periodNewPosts: 0,
    periodUpdatedPosts: 0,
    categoryDistribution: {} as Record<string, number>,
    postsByDay: [] as number[],
    updatedByDay: [] as number[],
    dateLabels: [] as string[]
  });

  /**
   * 날짜 범위에 따른 시작일과 종료일 계산
   */
  const getDateRange = (): { startDate: Date, endDate: Date, days: number } => {
    const endDate = new Date();
    let startDate: Date;
    let days: number;

    switch (dateRange) {
      case '7days':
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 6); // 오늘 포함 7일
        days = 7;
        break;
      case '30days':
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 29); // 오늘 포함 30일
        days = 30;
        break;
      case '90days':
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 89); // 오늘 포함 90일
        days = 90;
        break;
      case 'custom':
        startDate = new Date(customStartDate);
        // endDate는 이미 정의되어 있음
        const timeDiff = endDate.getTime() - startDate.getTime();
        days = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1; // 종료일 포함
        break;
      default:
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 6);
        days = 7;
    }

    // 시간 정보 초기화
    startDate.setHours(0, 0, 0, 0);
    
    // 종료일은 해당 일의 끝으로 설정
    const actualEndDate = new Date(endDate);
    actualEndDate.setHours(23, 59, 59, 999);

    return { startDate, endDate: actualEndDate, days };
  };

  // 데이터 로드
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // 날짜 범위 계산
      const { startDate, endDate, days } = getDateRange();
      
      // 모든 게시물 조회 (전체 통계용)
      const allPostsData = await fetchPosts();

      // 선택한 기간 내의 신규 게시물 조회
      const periodPostsData = await fetchPostsByDateRange(
        startDate.toISOString(),
        endDate.toISOString()
      );

      // 선택한 기간 내의 업데이트된 게시물 조회
      const updatedPostsData = await fetchUpdatedPostsByDateRange(
        startDate.toISOString(),
        endDate.toISOString()
      );

      setPosts(periodPostsData);
      setUpdatedPosts(updatedPostsData);
      
      // 통계 계산
      calculateStats(allPostsData, periodPostsData, updatedPostsData, startDate, endDate, days);
      
      setIsLoading(false);
    } catch (err) {
      console.error('대시보드 데이터 로드 오류:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  // 날짜 범위 변경시 데이터 로드
  useEffect(() => {
    loadData();
  }, [dateRange, customStartDate, customEndDate]);
  
  /**
   * 통계 데이터 계산
   */
  const calculateStats = (
    allPostsData: UIPost[],
    periodPostsData: UIPost[],
    updatedPostsData: UIPost[],
    startDate: Date,
    endDate: Date,
    days: number
  ) => {
    // 전체 게시물 수
    const totalPosts = allPostsData.length;
    
    // 선택한 기간 내의 신규 게시물 수
    const periodNewPosts = periodPostsData.length;
    
    // 선택한 기간 내의 업데이트된 게시물 수
    const periodUpdatedPosts = updatedPostsData.length;
    
    // 카테고리별 분포
    const categoryDistribution = allPostsData.reduce((acc, post) => {
      const category = post.category || '미분류';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // 선택한 기간 내의 일별 게시물 수 (최대 90일)
    const postsByDay: number[] = Array(days).fill(0);
    const updatedByDay: number[] = Array(days).fill(0);
    const dateLabels: string[] = [];
    
    // 날짜 레이블 생성
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      // 포맷에 따라 날짜 레이블 생성
      const dateFormat = days <= 14 
        ? { month: '2-digit', day: '2-digit' } as const
        : { month: '2-digit', day: '2-digit' } as const;
        
      dateLabels.push(date.toLocaleDateString('ko-KR', dateFormat));
    }
    
    // 일별 데이터 계산
    periodPostsData.forEach(post => {
      const postDate = new Date(post.date);
      const daysDiff = Math.floor((postDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff >= 0 && daysDiff < days) {
        postsByDay[daysDiff]++;
      }
    });
    
    updatedPostsData.forEach(post => {
      const postDate = new Date(post.date);
      const daysDiff = Math.floor((postDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff >= 0 && daysDiff < days) {
        updatedByDay[daysDiff]++;
      }
    });
    
    setStats({
      totalPosts,
      periodNewPosts,
      periodUpdatedPosts,
      categoryDistribution,
      postsByDay,
      updatedByDay,
      dateLabels
    });
  };

  // 기간별 게시물 데이터 생성
  const getDailyPostsData = () => {
    return {
      labels: stats.dateLabels,
      datasets: [
        {
          label: '신규 게시물',
          data: stats.postsByDay,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          fill: true,
        },
        {
          label: '업데이트된 게시물',
          data: stats.updatedByDay,
          borderColor: 'rgba(255, 159, 64, 1)',
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          tension: 0.1,
          fill: true,
        }
      ],
    };
  };
  
  // 카테고리 분포 데이터 생성
  const getCategoryDistributionData = () => {
    const labels = Object.keys(stats.categoryDistribution);
    const data = labels.map(category => stats.categoryDistribution[category]);
    
    // 색상 배열
    const backgroundColors = [
      'rgba(255, 99, 132, 0.7)',
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 206, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(255, 159, 64, 0.7)',
      'rgba(199, 199, 199, 0.7)',
    ];
    
    // 카테고리가 색상보다 많으면 색상 반복
    const colors = labels.map((_, i) => backgroundColors[i % backgroundColors.length]);
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace('0.7', '1')),
          borderWidth: 1,
        },
      ],
    };
  };

  /**
   * 날짜 범위 변경 핸들러
   */
  const handleDateRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDateRange(e.target.value as DateRangeOption);
  };

  /**
   * 사용자 지정 시작 날짜 변경 핸들러
   */
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomStartDate(e.target.value);
  };

  /**
   * 사용자 지정 종료 날짜 변경 핸들러
   */
  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomEndDate(e.target.value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center text-red-600">
        <p className="font-medium">오류</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      {/* 날짜 범위 선택 */}
      <div className="mb-4 bg-gray-50 p-3 rounded-md border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <div className="font-medium text-gray-700">기간 선택:</div>
          <select 
            className="p-1 border border-gray-300 rounded-md"
            value={dateRange}
            onChange={handleDateRangeChange}
          >
            <option value="7days">최근 7일</option>
            <option value="30days">최근 30일</option>
            <option value="90days">최근 90일</option>
            <option value="custom">사용자 지정</option>
          </select>
          
          {dateRange === 'custom' && (
            <div className="flex flex-col md:flex-row gap-2 items-center">
              <input 
                type="date" 
                className="p-1 border border-gray-300 rounded-md"
                value={customStartDate}
                onChange={handleStartDateChange}
              />
              <span className="mx-1">~</span>
              <input 
                type="date" 
                className="p-1 border border-gray-300 rounded-md"
                value={customEndDate}
                onChange={handleEndDateChange}
              />
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* 통계 카드 */}
        <div className="bg-blue-50 rounded-lg p-3 shadow-sm">
          <h3 className="text-xs font-medium text-blue-800">전체 게시글</h3>
          <p className="text-xl font-bold text-blue-600">{stats.totalPosts}개</p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3 shadow-sm">
          <h3 className="text-xs font-medium text-green-800">선택 기간 신규</h3>
          <p className="text-xl font-bold text-green-600">{stats.periodNewPosts}개</p>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-3 shadow-sm">
          <h3 className="text-xs font-medium text-orange-800">선택 기간 수정</h3>
          <p className="text-xl font-bold text-orange-600">{stats.periodUpdatedPosts}개</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* 일별 게시물 차트 */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-2">기간별 게시물 추이</h3>
          <div style={{ height: '120px' }}>
            <Line 
              data={getDailyPostsData()} 
              options={{
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      precision: 0,
                      font: {
                        size: 10
                      }
                    }
                  },
                  x: {
                    ticks: {
                      font: {
                        size: 9
                      }
                    }
                  }
                },
                plugins: {
                  legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                      boxWidth: 8,
                      padding: 8,
                      font: {
                        size: 10
                      }
                    }
                  }
                },
                maintainAspectRatio: false,
              }}
            />
          </div>
        </div>
        
        {/* 카테고리 분포 차트 */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-2">카테고리별 게시물 분포</h3>
          <div style={{ height: '120px' }}>
            {Object.keys(stats.categoryDistribution).length > 0 ? (
              <Doughnut 
                data={getCategoryDistributionData()}
                options={{
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        boxWidth: 8,
                        padding: 8,
                        font: {
                          size: 9
                        }
                      }
                    }
                  },
                  maintainAspectRatio: false,
                }}
              />
            ) : (
              <p className="text-center text-gray-500 py-6">데이터가 없습니다</p>
            )}
          </div>
        </div>
      </div>
      
      {/* 게시물 통계 막대 차트 */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
        <h3 className="text-sm font-medium text-gray-700 mb-2">카테고리별 게시물 분포</h3>
        <div style={{ height: '120px' }}>
          <Bar 
            data={{
              labels: Object.keys(stats.categoryDistribution),
              datasets: [{
                label: '게시물 수',
                data: Object.values(stats.categoryDistribution),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
              }]
            }}
            options={{
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    precision: 0,
                    font: {
                      size: 10
                    }
                  }
                },
                x: {
                  ticks: {
                    font: {
                      size: 9
                    }
                  }
                }
              },
              plugins: {
                legend: {
                  display: false
                }
              },
              maintainAspectRatio: false,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 