/**
 * React 18과 react-beautiful-dnd의 호환성 문제를 해결하기 위한 래퍼 컴포넌트
 * StrictMode 에서 발생하는 이중 렌더링 문제를 해결합니다.
 */
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, DroppableProps, DroppableProvided, DroppableStateSnapshot, DropResult } from 'react-beautiful-dnd';

type DragDropWrapperProps = {
  onDragEnd: (result: DropResult) => void;
  children: (
    provided: DroppableProvided, 
    snapshot: DroppableStateSnapshot
  ) => React.ReactElement;
  droppableId: string;
};

/**
 * React 18과 react-beautiful-dnd 라이브러리 호환성 문제를 해결하는 래퍼 컴포넌트
 * 첫 번째 렌더링을 지연시켜 라이브러리가 안정적으로 초기화되도록 합니다.
 */
export const DragDropWrapper: React.FC<DragDropWrapperProps> = ({ onDragEnd, children, droppableId }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  
  useEffect(() => {
    // React 18 StrictMode와의 호환성을 위해 첫 번째 렌더링 후 지연시간 적용
    const timeout = setTimeout(() => {
      setIsEnabled(true);
    }, 500);
    
    return () => clearTimeout(timeout);
  }, []);
  
  // 컴포넌트가 준비되지 않은 경우 로딩 표시
  if (!isEnabled) {
    return (
      <div className="flex justify-center items-center p-6 bg-gray-50 border border-gray-200 rounded">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mr-3"></div>
        <p>카테고리 준비 중...</p>
      </div>
    );
  }
  
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId={droppableId}>
        {(provided, snapshot) => children(provided, snapshot)}
      </Droppable>
    </DragDropContext>
  );
};

/**
 * React 18 StrictMode와 호환되는 Droppable 컴포넌트
 * 내부적으로 useEffect 훅을 사용하여 Droppable의 초기화 문제를 해결합니다.
 */
export const StrictModeDroppable = ({ children, ...props }: DroppableProps) => {
  const [enabled, setEnabled] = useState(false);
  
  useEffect(() => {
    const animation = requestAnimationFrame(() => {
      setEnabled(true);
    });
    
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  
  if (!enabled) {
    return null;
  }
  
  return <Droppable {...props}>{children}</Droppable>;
};

export default DragDropWrapper; 