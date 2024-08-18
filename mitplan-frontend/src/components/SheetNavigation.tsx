import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useContextMenu } from './Shared/ContextMenu';
import { RootState } from '../types';
import { addSheet, deleteSheet, setActiveSheet } from '../store/mitplansSlice';
import { v4 as uuidv4 } from 'uuid';
import { allEncounters } from '../data/encounters/encounters';

interface SheetNavigationProps {
  mitplanId: string;
  onRenameSheet: (sheetId: string) => void;
}

const SheetNavigation: React.FC<SheetNavigationProps> = ({
  mitplanId,
  onRenameSheet,
}) => {
  const { showContextMenu } = useContextMenu();
  const dispatch = useDispatch();

  const mitplan = useSelector((state: RootState) => state.mitplans.mitplans[mitplanId]);
  const { sheets, activeSheetId } = mitplan || {};

  const handleContextMenu = (event: React.MouseEvent, sheetId: string) => {
    event.preventDefault();
    const items = [
      { label: 'Rename', action: () => onRenameSheet(sheetId) },
      { label: 'Delete', action: () => dispatch(deleteSheet({ mitplanId, sheetId })) },
    ];
    showContextMenu(items, event.clientX, event.clientY);
  };

  const handleCreateSheet = () => {
    const newSheetId = uuidv4();
    const defaultEncounterId = Object.keys(allEncounters)[0];
    const defaultEncounter = allEncounters[defaultEncounterId];

    dispatch(addSheet({
      mitplanId,
      sheet: {
        id: newSheetId,
        name: `New Sheet ${Object.keys(sheets || {}).length + 1}`,
        assignmentEvents: {},
        encounter: defaultEncounter,
        columnCount: 5,
        timeScale: 1,
      }
    }));
    dispatch(setActiveSheet({ mitplanId, sheetId: newSheetId }));
  };

  if (!sheets) {
    return null;
  }

  return (
    <div className="flex items-center bg-gray-100 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 p-1 overflow-x-auto">
      {Object.values(sheets).map((sheet) => (
        <button
          key={sheet.id}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg mr-1 transition-colors ${
            sheet.id === activeSheetId
              ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 border-t border-l border-r border-gray-300 dark:border-gray-700'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          onClick={() => dispatch(setActiveSheet({ mitplanId, sheetId: sheet.id }))}
          onContextMenu={(e) => handleContextMenu(e, sheet.id)}
        >
          {sheet.name}
        </button>
      ))}
      <button
        className="px-4 py-2 text-sm font-medium bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-t-lg ml-2 transition-colors"
        onClick={handleCreateSheet}
      >
        +
      </button>
    </div>
  );
};

export default SheetNavigation;