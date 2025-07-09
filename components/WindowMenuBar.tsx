import React, { useState, useEffect, useRef } from 'react';
import type { Menu, MenuItem as MenuItemType } from '../types';
import { pcColors } from '../src/styles/colors';
import { SPECIAL } from '../src/styles/asciiChars';

const SubMenu: React.FC<{ items: MenuItemType[]; closeAllMenus: () => void }> = ({ items, closeAllMenus }) => {
  return (
    <div className="absolute left-full -top-1 mt-0 w-48 z-20"
         style={{ 
           backgroundColor: pcColors.background.primary,
           border: `1px solid ${pcColors.border.primary}`
         }}>
      {items.map((item, index) => (
        <MenuItem key={index} item={item} closeAllMenus={closeAllMenus} />
      ))}
    </div>
  );
};

const MenuItem: React.FC<{ item: MenuItemType; closeAllMenus: () => void }> = ({ item, closeAllMenus }) => {
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);

  if ('label' in item) {
    const hasSubMenu = !!(item.items && item.items.length > 0);

    const handleItemClick = () => {
      if (item.disabled) return;
      if (item.action) {
        item.action();
      }
      if (!hasSubMenu) {
        closeAllMenus();
      }
    };

    return (
      <div
        className="relative"
        onMouseEnter={() => hasSubMenu && !item.disabled && setIsSubMenuOpen(true)}
        onMouseLeave={() => hasSubMenu && !item.disabled && setIsSubMenuOpen(false)}
      >
        <button
          onClick={handleItemClick}
          disabled={item.disabled}
          className="w-full text-left px-3 py-1 font-pc flex justify-between items-center"
          style={{
            color: item.disabled ? pcColors.text.disabled : pcColors.text.primary,
            backgroundColor: 'transparent',
          }}
        >
          <span>{item.label}</span>
          {hasSubMenu && <span className="text-xs">{SPECIAL.arrow}</span>}
        </button>
        {isSubMenuOpen && hasSubMenu && !item.disabled && item.items && (
          <SubMenu items={item.items} closeAllMenus={closeAllMenus} />
        )}
      </div>
    );
  }

  return <div className="h-px my-1 mx-2" style={{ backgroundColor: pcColors.border.primary }} />;
};

const MenuDropdown: React.FC<{ menu: Menu; closeAllMenus: () => void }> = ({ menu, closeAllMenus }) => {
  return (
    <div 
      className="absolute left-0 mt-0 w-56 z-10"
      style={{ 
        backgroundColor: pcColors.background.primary,
        border: `1px solid ${pcColors.border.primary}`
      }}
    >
      {menu.items.map((item, index) => (
        <MenuItem key={index} item={item} closeAllMenus={closeAllMenus} />
      ))}
    </div>
  );
};

interface WindowMenuBarProps {
  menus: Menu[];
}

const WindowMenuBar: React.FC<WindowMenuBarProps> = ({ menus }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMenuToggle = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  }

  return (
    <div 
      ref={menuBarRef} 
      data-menu-bar 
      className="relative flex items-center h-8 border-b flex-shrink-0 font-pc"
      style={{ 
        borderColor: pcColors.border.primary,
        backgroundColor: pcColors.background.primary
      }}
    >
      {menus.map((menu) => (
        <div key={menu.name} className="relative">
          <button 
            onClick={() => handleMenuToggle(menu.name)}
            className="px-3 py-0.5"
            style={{ 
              backgroundColor: activeMenu === menu.name ? pcColors.selection.background : 'transparent',
              color: activeMenu === menu.name ? pcColors.selection.text : pcColors.text.primary,
            }}
          >
            {menu.name}
          </button>
          {activeMenu === menu.name && (
            <MenuDropdown menu={menu} closeAllMenus={() => setActiveMenu(null)} />
          )}
        </div>
      ))}
    </div>
  );
};

export default WindowMenuBar;