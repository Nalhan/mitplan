import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

type ContextMenuItem = {
  label: string;
  action: () => void;
};

type ContextMenuContextType = {
  showContextMenu: (items: ContextMenuItem[], x: number, y: number) => void;
  hideContextMenu: () => void;
  contextMenuItems: ContextMenuItem[];
  contextMenuPosition: { x: number; y: number } | null;
};

const ContextMenuContext = createContext<ContextMenuContextType | undefined>(undefined);

export const ContextMenuProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [contextMenuItems, setContextMenuItems] = useState<ContextMenuItem[]>([]);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const { darkMode } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);

  const adjustMenuPosition = useCallback((x: number, y: number, menuWidth: number, menuHeight: number) => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    if (x + menuWidth > windowWidth) {
      adjustedX = windowWidth - menuWidth - 5; // Bump 5px into the page
    } else if (x < 5) {
      adjustedX = 5; // Bump 5px into the page
    }

    if (y + menuHeight > windowHeight) {
      adjustedY = windowHeight - menuHeight - 5; // Bump 5px into the page
    } else if (y < 5) {
      adjustedY = 5; // Bump 5px into the page
    }

    return { x: adjustedX, y: adjustedY };
  }, []);

  const showContextMenu = useCallback((items: ContextMenuItem[], x: number, y: number) => {
    setContextMenuItems(items);
    setContextMenuPosition({ x, y });
  }, []);

  const hideContextMenu = useCallback(() => {
    setContextMenuPosition(null);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        hideContextMenu();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [hideContextMenu]);

  useEffect(() => {
    if (contextMenuPosition && menuRef.current) {
      const { x, y } = adjustMenuPosition(
        contextMenuPosition.x,
        contextMenuPosition.y,
        menuRef.current.offsetWidth,
        menuRef.current.offsetHeight
      );
      if (x !== contextMenuPosition.x || y !== contextMenuPosition.y) {
        setContextMenuPosition({ x, y });
      }
    }
  }, [contextMenuPosition, adjustMenuPosition]);

  return (
    <ContextMenuContext.Provider value={{ showContextMenu, hideContextMenu, contextMenuItems, contextMenuPosition }}>
      {children}
      {contextMenuPosition && (
        <div
          ref={menuRef}
          id="context-menu"
          className={`fixed z-50 ${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-black border-gray-300'} border rounded-md shadow-md`}
          style={{
            top: contextMenuPosition.y,
            left: contextMenuPosition.x,
          }}
        >
          {contextMenuItems.map((item, index) => (
            <div
              key={index}
              onClick={() => {
                item.action();
                hideContextMenu();
              }}
              className={`px-4 py-2 cursor-pointer ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}
    </ContextMenuContext.Provider>
  );
};

export const useContextMenu = () => {
  const context = useContext(ContextMenuContext);
  if (context === undefined) {
    throw new Error('useContextMenu must be used within a ContextMenuProvider');
  }
  return context;
};