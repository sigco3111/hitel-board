import React, { useState, useEffect, useCallback } from 'react';
import { 
  fetchCategories, 
  addCategory, 
  updateCategory, 
  deleteCategory, 
  reorderCategories,
  CategoryItem
} from '../../../services/admin/categories';
import { Draggable, DropResult } from 'react-beautiful-dnd';
import { DragDropWrapper } from './DragDropWrapper';
import IconSelector from './IconSelector';
import { getIconEmoji } from '../../../utils/icons';

/**
 * 카테고리 관리 컴포넌트
 * 카테고리의 CRUD 및 순서 변경 기능을 제공합니다.
 */
const CategoryManagement: React.FC = () => {
  // 카테고리 목록 상태
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  // 새 카테고리 이름 상태
  const [newCategoryName, setNewCategoryName] = useState('');
  // 새 카테고리 아이콘 상태
  const [newCategoryIcon, setNewCategoryIcon] = useState('');
  // 수정 모드 상태
  const [editingId, setEditingId] = useState<string | null>(null);
  // 수정할 이름 상태
  const [editingName, setEditingName] = useState('');
  // 수정할 아이콘 상태
  const [editingIcon, setEditingIcon] = useState('');
  // 로딩 상태
  const [isLoading, setIsLoading] = useState(true);
  // 에러 상태
  const [error, setError] = useState<string | null>(null);
  // 성공 메시지 상태
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // 삭제 확인 모달 상태
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  /**
   * 카테고리 목록 불러오기
   */
  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        const data = await fetchCategories();
        setCategories(data);
        setIsLoading(false);
        return; // 성공적으로 로드되면 함수 종료
      } catch (err) {
        console.error(`카테고리 목록 로드 실패 (시도 ${retryCount + 1}/${maxRetries}):`, err);
        retryCount++;
        
        // 마지막 시도가 아니면 사용자에게 재시도 중임을 알림
        if (retryCount < maxRetries) {
          setSuccessMessage(`카테고리 목록을 다시 불러오는 중입니다... (${retryCount}/${maxRetries})`);
          
          // 잠시 대기 후 재시도
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        } else {
          // 모든 시도 실패 시 에러 메시지 표시
          const errorMsg = err instanceof Error ? err.message : '알 수 없는 오류';
          setError(`카테고리 목록을 불러오는 데 실패했습니다: ${errorMsg}`);
          setIsLoading(false);
        }
      }
    }
  }, []);

  /**
   * 카테고리 추가 처리
   */
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      setError('카테고리 이름을 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // 로딩 상태 메시지 표시
      setSuccessMessage('카테고리를 추가하는 중입니다...');
      
      console.log(`카테고리 추가 요청: ${newCategoryName.trim()}, 아이콘: ${newCategoryIcon || '없음'}`);
      
      await addCategory({ 
        name: newCategoryName.trim(),
        icon: newCategoryIcon || undefined
      });
      
      console.log('카테고리 추가 API 호출 성공, 목록 다시 불러오는 중...');
      await loadCategories();
      setNewCategoryName('');
      setNewCategoryIcon('');
      showSuccessMessage('카테고리가 성공적으로 추가되었습니다.');
    } catch (err) {
      console.error('카테고리 추가 실패:', err);
      
      // Firebase 쿼터 초과 에러인 경우 특별 메시지 제공
      const errorMsg = err instanceof Error ? err.message : '알 수 없는 오류';
      
      if (errorMsg.includes('resource-exhausted') || errorMsg.includes('Quota exceeded')) {
        setError(
          '현재 Firebase 쿼터 제한으로 인해 카테고리를 추가할 수 없습니다. ' + 
          '잠시 후 다시 시도해주세요. (일일 쿼터 제한에 도달했을 수 있습니다)'
        );
      } else {
        setError(`카테고리 추가에 실패했습니다: ${errorMsg}`);
      }
      
      // 에러 발생 후 목록 다시 불러오기 시도
      console.log('에러 발생 후 카테고리 목록 다시 불러오는 중...');
      try {
        await loadCategories();
      } catch (loadErr) {
        console.error('에러 후 카테고리 목록 로드 실패:', loadErr);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 카테고리 수정 모드 진입
   */
  const startEditing = (category: CategoryItem) => {
    setEditingId(category.id);
    setEditingName(category.name);
    setEditingIcon(category.icon || '');
  };

  /**
   * 카테고리 수정 취소
   */
  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
    setEditingIcon('');
  };

  /**
   * 카테고리 이름 수정 처리
   */
  const handleUpdateCategory = async (categoryId: string) => {
    if (!editingName.trim()) {
      setError('카테고리 이름을 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await updateCategory(categoryId, editingName.trim(), editingIcon || undefined);
      await loadCategories();
      cancelEditing();
      showSuccessMessage('카테고리가 성공적으로 수정되었습니다.');
    } catch (err) {
      setError(`카테고리 수정에 실패했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 카테고리 삭제 확인
   */
  const confirmDelete = (categoryId: string) => {
    setDeleteConfirmId(categoryId);
  };

  /**
   * 카테고리 삭제 취소
   */
  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  /**
   * 카테고리 삭제 처리
   */
  const handleDeleteCategory = async (categoryId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await deleteCategory(categoryId);
      await loadCategories();
      setDeleteConfirmId(null);
      showSuccessMessage('카테고리가 성공적으로 삭제되었습니다.');
    } catch (err) {
      setError(`카테고리 삭제에 실패했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 성공 메시지 표시 및 자동 삭제
   */
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  /**
   * 드래그 앤 드롭으로 순서 변경 처리
   */
  const handleDragEnd = useCallback(async (result: DropResult) => {
    // 드래그가 목적지로 끝나지 않은 경우
    if (!result.destination) {
      return;
    }

    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    // 위치가 변경되지 않은 경우
    if (destIndex === sourceIndex) {
      return;
    }

    setIsLoading(true);

    try {
      // 새 순서의 카테고리 배열 생성
      const updatedCategories = Array.from(categories);
      const [removed] = updatedCategories.splice(sourceIndex, 1);
      updatedCategories.splice(destIndex, 0, removed);
      
      // UI 먼저 업데이트
      setCategories(updatedCategories);
      
      // API 호출하여 DB에 반영
      await reorderCategories(updatedCategories);
      showSuccessMessage('카테고리 순서가 성공적으로 변경되었습니다.');
    } catch (err) {
      // 실패 시 원래 상태로 복구하고 에러 표시
      const errorMsg = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(`카테고리 순서 변경에 실패했습니다: ${errorMsg}`);
      loadCategories(); // 원래 순서로 복구
    } finally {
      setIsLoading(false);
    }
  }, [categories, loadCategories]);

  // 컴포넌트 마운트 시 카테고리 목록 로드
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // 카테고리 테이블 렌더링 함수
  const renderCategoryTable = () => (
    <div className="bg-gray-50 rounded border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ID
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              아이콘
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              이름
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              작업
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {categories.map((category, index) => (
            <Draggable 
              key={category.id} 
              draggableId={category.id} 
              index={index}
              isDragDisabled={false}
            >
              {(provided) => (
                <tr
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {category.id}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === category.id ? (
                      <IconSelector 
                        selectedIcon={editingIcon} 
                        onSelectIcon={(icon) => setEditingIcon(icon)}
                      />
                    ) : (
                      <div className="text-xl">
                        {category.icon ? getIconEmoji(category.icon) : ''}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === category.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">
                        {category.name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingId === category.id ? (
                      <>
                        <button
                          onClick={() => handleUpdateCategory(category.id)}
                          className="text-indigo-600 hover:text-indigo-900 mr-2 disabled:opacity-50"
                          disabled={isLoading}
                        >
                          저장
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="text-gray-600 hover:text-gray-900 disabled:opacity-50"
                          disabled={isLoading}
                        >
                          취소
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditing(category)}
                          className="text-indigo-600 hover:text-indigo-900 mr-2 disabled:opacity-50"
                          disabled={isLoading}
                        >
                          수정
                        </button>
                        <button
                          onClick={() => confirmDelete(category.id)}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          disabled={isLoading}
                        >
                          삭제
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              )}
            </Draggable>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">카테고리 관리</h2>
      
      {/* 성공 메시지 표시 */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {successMessage}
        </div>
      )}
      
      {/* 에러 메시지 표시 */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
          <button 
            className="ml-2 underline"
            onClick={() => {
              setError(null);
              loadCategories();
            }}
          >
            다시 시도
          </button>
        </div>
      )}
      
      {/* 새 카테고리 추가 폼 */}
      <form onSubmit={handleAddCategory} className="mb-8">
        <div className="flex items-center">
          <IconSelector 
            selectedIcon={newCategoryIcon} 
            onSelectIcon={(icon) => setNewCategoryIcon(icon)}
          />
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="새 카테고리 이름"
            className="flex-1 p-2 border border-gray-300 rounded mx-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            className={`bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isLoading}
          >
            {isLoading ? '처리중...' : '저장'}
          </button>
        </div>
      </form>
      
      {/* 카테고리 목록 테이블 */}
      <h3 className="text-lg font-semibold mb-4 text-gray-800">카테고리 목록</h3>

      {/* 로딩 중 표시 */}
      {isLoading && !categories.length ? (
        <div className="flex justify-center items-center p-6 bg-gray-50 border border-gray-200 rounded">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mr-3"></div>
          <p>카테고리 로딩 중...</p>
        </div>
      ) : categories.length > 0 ? (
        <DragDropWrapper onDragEnd={handleDragEnd} droppableId="categories">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {renderCategoryTable()}
              {provided.placeholder}
            </div>
          )}
        </DragDropWrapper>
      ) : (
        <div className="p-6 text-center bg-gray-50 border border-gray-200 rounded">
          <p className="text-gray-500">등록된 카테고리가 없습니다.</p>
        </div>
      )}
      
      {/* 삭제 확인 모달 */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium mb-4">카테고리 삭제 확인</h3>
            <p className="mb-6 text-gray-600">
              이 카테고리를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                disabled={isLoading}
              >
                취소
              </button>
              <button
                onClick={() => handleDeleteCategory(deleteConfirmId)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 개발자용 디버그 정보 - 개발 환경에서만 표시 */}
      {import.meta.env.DEV && (
        <div className="mt-8 p-4 bg-gray-100 rounded text-xs text-gray-500">
          <details>
            <summary>디버그 정보</summary>
            <pre className="mt-2 whitespace-pre-wrap">
              {JSON.stringify({
                categoriesCount: categories.length,
                loading: isLoading,
              }, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement; 