import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useContextMenu } from './Shared/ContextMenu';
import { useTheme } from '../contexts/ThemeContext';
import { RootState } from '../types';
import { addSheet, deleteSheet, setActiveSheet } from '../store/roomsSlice';
import { v4 as uuidv4 } from 'uuid';

interface SheetNavigationProps {
  roomId: string;
  onRenameSheet: (sheetId: string) => void;
}

const SheetNavigation: React.FC<SheetNavigationProps> = ({
  roomId,
  onRenameSheet,
}) => {
  const { showContextMenu } = useContextMenu();
  const { darkMode } = useTheme();
  const dispatch = useDispatch();

  const room = useSelector((state: RootState) => state.room);
  const { sheets, activeSheetId } = room || {};

  const handleContextMenu = (event: React.MouseEvent, sheetId: string) => {
    event.preventDefault();
    const items = [
      { label: 'Rename', action: () => onRenameSheet(sheetId) },
      { label: 'Delete', action: () => dispatch(deleteSheet({ roomId, sheetId })) },
    ];
    showContextMenu(items, event.clientX, event.clientY);
  };

  const handleCreateSheet = () => {
    const newSheetId = uuidv4();
    dispatch(addSheet({
      roomId,
      sheet: {
        id: newSheetId,
        name: `New Sheet ${Object.keys(sheets || {}).length + 1}`,
        assignmentEvents: [],
        encounterEvents: [],
        timelineLength: 600,
        columnCount: 5,
      }
    }));
    dispatch(setActiveSheet({ roomId, sheetId: newSheetId }));
  };

  return (
    <div className={`flex items-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'} border-t p-1 overflow-x-auto`}>
      {sheets && Object.values(sheets).map((sheet) => (
        <button
          key={sheet.id}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg mr-1 transition-colors ${
            sheet.id === activeSheetId
              ? darkMode
                ? 'bg-gray-900 text-blue-400 border-t border-l border-r border-gray-700'
                : 'bg-white text-blue-600 border-t border-l border-r border-gray-300'
              : darkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => dispatch(setActiveSheet({ roomId, sheetId: sheet.id }))}
          onContextMenu={(e) => handleContextMenu(e, sheet.id)}
        >
          {sheet.name}
        </button>
      ))}
      <button
        className={`px-4 py-2 text-sm font-medium ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white rounded-t-lg ml-2 transition-colors`}
        onClick={handleCreateSheet}
      >
        +
      </button>
    </div>
  );
};

export default SheetNavigation;