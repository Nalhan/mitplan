import React from 'react';
import { useContextMenu } from './Shared/ContextMenu';
import { useTheme } from '../contexts/ThemeContext';

interface SheetNavigationProps {
  sheets: { id: string; name: string }[];
  currentSheetId: string;
  onSheetChange: (sheetId: string) => void;
  onCreateSheet: () => void;
  onRenameSheet: (sheetId: string) => void;
  onDeleteSheet: (sheetId: string) => void;
}

const SheetNavigation = ({
  sheets,
  currentSheetId,
  onSheetChange,
  onCreateSheet,
  onRenameSheet,
  onDeleteSheet,
}: SheetNavigationProps) => {
  const { showContextMenu } = useContextMenu();
  const { darkMode } = useTheme();

  const handleContextMenu = (event: React.MouseEvent, sheetId: string) => {
    event.preventDefault();
    const items = [
      { label: 'Rename', action: () => onRenameSheet(sheetId) },
      { label: 'Delete', action: () => onDeleteSheet(sheetId) },
    ];
    showContextMenu(items, event.clientX, event.clientY);
  };

  return (
    <div className={`flex items-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'} border-t p-1 overflow-x-auto`}>
      {sheets.map((sheet) => (
        <button
          key={sheet.id}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg mr-1 transition-colors ${
            sheet.id === currentSheetId
              ? darkMode
                ? 'bg-gray-900 text-blue-400 border-t border-l border-r border-gray-700'
                : 'bg-white text-blue-600 border-t border-l border-r border-gray-300'
              : darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => onSheetChange(sheet.id)}
          onContextMenu={(e) => handleContextMenu(e, sheet.id)}
        >
          {sheet.name}
        </button>
      ))}
      <button
        className={`px-4 py-2 text-sm font-medium ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white rounded-t-lg ml-2 transition-colors`}
        onClick={onCreateSheet}
      >
        +
      </button>
    </div>
  );
};

export default SheetNavigation;