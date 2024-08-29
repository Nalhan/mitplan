import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../types';
import { updateSheet } from '../../store/mitplansSlice';

interface PrepullToggleProps {
  mitplanId: string;
}

const PrepullToggle: React.FC<PrepullToggleProps> = ({ mitplanId }) => {
  const dispatch = useDispatch();
  const activeMitplan = useSelector((state: RootState) => state.mitplans.mitplans[mitplanId]);
  const activeSheetId = activeMitplan?.activeSheetId;
  const isPrepullEnabled = activeSheetId ? activeMitplan.sheets[activeSheetId].isPrepullEnabled : false;

  const handleTogglePrepull = () => {
    if (activeSheetId) {
      dispatch(updateSheet({
        mitplanId,
        sheetId: activeSheetId,
        updates: { isPrepullEnabled: !isPrepullEnabled }
      }));
    }
  };

  return (
    <button
      onClick={handleTogglePrepull}
      className={`px-4 py-2 rounded-md transition-colors duration-200 ${
        isPrepullEnabled
          ? 'bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 text-white'
          : 'bg-gray-500 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-700 text-white'
      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
    >
      {isPrepullEnabled ? 'Prepull On' : 'Prepull Off'}
    </button>
  );
};

export default PrepullToggle;
