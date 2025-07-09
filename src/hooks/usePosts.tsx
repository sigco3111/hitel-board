/**
 * 게시물 목록을 관리하는 커스텀 훅
 * @returns 게시물 관련 상태 및 함수들
 */
import { useState, useEffect, useCallback } from 'react';
import { fetchPosts, fetchPostsByCategory, fetchPostsByTag, UIPost, fetchCategoriesFromFirestore } from '../services/firebase/firestore';
import { Category } from '../types';
import { FolderIcon, MessagesSquareIcon, TagIcon } from '../../components/icons';
import { getIconEmoji } from '../utils/icons';

/**
 * 게시물 목록을 관리하는 커스텀 훅
 * @param options 필터링 옵션 (카테고리, 태그)
 * @returns 게시물 관련 상태 및 함수들
 */
export const usePosts = (options?: { category?: string; tag?: string }) => {
  // 게시물 목록 상태
  const [posts, setPosts] = useState<UIPost[]>([]);
  // 로딩 상태
  const [loading, setLoading] = useState<boolean>(true);
  // 에러 상태
  const [error, setError] = useState<Error | null>(null);
  // 카테고리 목록 상태
  const [categories, setCategories] = useState<Category[]>([]);
  // 카테고리 로딩 상태
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);
  // 태그 목록 상태
  const [allTags, setAllTags] = useState<string[]>([]);

  // 1. 컴포넌트 마운트 시 최초 한 번만 실행: 카테고리와 전체 태그 로드
  useEffect(() => {
    const loadInitialData = async () => {
      setCategoriesLoading(true);
      setError(null);
      try {
        console.log("초기 데이터 로드 시작: 카테고리 및 전체 태그");
        
        // Firestore에서 카테고리 데이터 로드 및 UI에 맞게 변환
        const categoriesData = await fetchCategoriesFromFirestore();
        const uiCategories: Category[] = [
          { id: 'all', name: '모든 게시물', icon: <MessagesSquareIcon /> },
          ...categoriesData
            .filter(cat => cat.id !== 'all') // Firestore에서 가져온 데이터 중 id가 'all'인 경우 제외
            .map(cat => ({
              id: cat.id,
              name: cat.name,
              icon: cat.icon ? (
                <span className="text-lg">{getIconEmoji(cat.icon)}</span>
              ) : (
                cat.id === 'tech' ? <FolderIcon /> : 
                cat.id === 'general' ? <TagIcon /> : <FolderIcon />
              )
            }))
        ];
        setCategories(uiCategories);
        console.log("카테고리 로드 완료");

        // 전체 태그 데이터 로드 (모든 게시물에서 추출)
        const allPostsForTags = await fetchPosts();
        const tags = allPostsForTags.flatMap(post => post.tags || []);
        const uniqueTags = [...new Set(tags)];
        
        // 한글 로케일 기준으로 가나다순 정렬
        const sortedTags = uniqueTags.sort((a, b) => a.localeCompare(b, 'ko'));
        setAllTags(sortedTags);
        console.log("전체 태그 로드 완료:", sortedTags);

      } catch (err) {
        console.error('초기 데이터 로드 오류:', err);
        setError(err instanceof Error ? err : new Error('초기 데이터 로드 중 오류가 발생했습니다.'));
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadInitialData();
  }, []); // 의존성 배열이 비어있으므로, 최초 렌더링 시에만 실행됩니다.

  // 2. 옵션(카테고리, 태그) 변경 시 게시물 목록만 필터링하여 로드
  useEffect(() => {
    const loadFilteredPosts = async () => {
      // 초기 데이터(태그, 카테고리)가 아직 로드 중이면 게시물 로드를 시도하지 않음
      if (categoriesLoading) {
        console.log("초기 데이터 로딩 중... 게시물 로드를 기다립니다.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        let postsData: UIPost[];
        const category = options?.category;
        const tag = options?.tag;

        if (tag) {
          console.log(`'${tag}' 태그로 게시물 필터링 중...`);
          postsData = await fetchPostsByTag(tag);
        } else if (category && category !== 'all') {
          console.log(`'${category}' 카테고리로 게시물 필터링 중...`);
          postsData = await fetchPostsByCategory(category);
        } else {
          console.log("모든 게시물 로드 중...");
          postsData = await fetchPosts();
        }
        setPosts(postsData);
        console.log("게시물 로드 완료:", postsData.length, "개");
      } catch (err) {
        console.error('게시물 필터링/로드 오류:', err);
        setError(err instanceof Error ? err : new Error('게시물 로드 중 오류가 발생했습니다.'));
      } finally {
        setLoading(false);
      }
    };

    loadFilteredPosts();
  }, [options?.category, options?.tag, categoriesLoading]); // 카테고리/태그 또는 초기 로딩 완료 시 실행

  // 데이터 새로고침 함수
  const refresh = useCallback(async () => {
    // 현재 필터 옵션을 기준으로 게시물만 새로고침
    setLoading(true);
    setError(null);
    try {
      let postsData: UIPost[];
      const category = options?.category;
      const tag = options?.tag;

      console.log("게시물 데이터 새로고침 시작...");
      
      if (tag) {
        postsData = await fetchPostsByTag(tag);
      } else if (category && category !== 'all') {
        postsData = await fetchPostsByCategory(category);
      } else {
        postsData = await fetchPosts();
      }
      setPosts(postsData);
      console.log("게시물 데이터 새로고침 완료:", postsData.length, "개");
      return postsData; // Promise로 결과 반환
    } catch (err) {
      console.error('새로고침 중 오류:', err);
      setError(err instanceof Error ? err : new Error('데이터를 새로고침하는 중 오류가 발생했습니다.'));
      throw err; // 오류 전파
    } finally {
      setLoading(false);
    }
  }, [options?.category, options?.tag]);


  return {
    posts,
    loading,
    error,
    categories,
    categoriesLoading,
    allTags,
    refresh,
  };
}; 