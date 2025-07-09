/**
 * PC통신 스타일 메뉴 컴포넌트
 * 텍스트 기반 메뉴 시스템을 구현합니다.
 */
import React from 'react';
import { pcColors } from '../../styles/colors';
import { SPECIAL } from '../../styles/asciiChars';
import TextBox from './TextBox';

// 메뉴 항목 타입 정의
export interface MenuItem {
  id: string;
  label: string;
  shortcut?: string; // 단축키 (예: 'F1', 'Alt+S')
  disabled?: boolean;
  onClick?: () => void;
}

interface PCMenuProps {
  title?: string;
  items: MenuItem[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  className?: string;
  borderStyle?: 'single' | 'double' | 'mixed' | 'none';
  showShortcuts?: boolean;
  width?: string | number;
}

/**
 * PC통신 스타일 메뉴 컴포넌트
 * 선택된 항목을 화살표로 표시하고, 단축키 표시 기능을 지원합니다.
 */
const PCMenu: React.FC<PCMenuProps> = ({
  title,
  items,
  selectedId,
  onSelect,
  className = '',
  borderStyle = 'single',
  showShortcuts = true,
  width = 'auto',
}) => {
  // 메뉴 항목 클릭 핸들러
  const handleItemClick = (item: MenuItem) => {
    if (item.disabled) return;
    
    if (item.onClick) {
      item.onClick();
    }
    
    if (onSelect) {
      onSelect(item.id);
    }
  };

  return (
    <TextBox 
      title={title}
      borderStyle={borderStyle}
      className={className}
      width={width}
      padding="0.5rem"
    >
      <div className="flex flex-col">
        {items.map((item) => {
          const isSelected = item.id === selectedId;
          
          return (
            <div 
              key={item.id}
              className={`
                py-1 px-2 cursor-pointer font-pc flex justify-between items-center
                ${isSelected ? 'bg-pc-selection-bg text-pc-selection-text' : ''}
                ${item.disabled ? 'text-pc-text-gray' : 'hover:text-pc-text-yellow'}
              `}
              onClick={() => handleItemClick(item)}
              style={{
                color: item.disabled 
                  ? pcColors.text.disabled 
                  : isSelected 
                    ? pcColors.selection.text 
                    : pcColors.text.primary,
                backgroundColor: isSelected ? pcColors.selection.background : 'transparent',
              }}
            >
              <div className="flex items-center">
                <span className="inline-block w-4 text-center">
                  {isSelected ? SPECIAL.arrow : ' '}
                </span>
                <span>{item.label}</span>
              </div>
              
              {showShortcuts && item.shortcut && (
                <span className="ml-8 text-pc-text-cyan" style={{ color: pcColors.text.secondary }}>
                  {item.shortcut}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </TextBox>
  );
};

export default PCMenu; 