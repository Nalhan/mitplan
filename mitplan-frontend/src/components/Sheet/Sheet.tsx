import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import VerticalTimeline from './VerticalTimeline';
import EncounterSelect from './EncounterSelect';
import { Sheet as SheetType } from '../../types';
import { deleteAssignmentEvents } from '../../store/mitplansSlice';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';

const SheetComponent: React.FC<SheetType & {
  mitplanId: string;
  sheetId: string;
}> = ({
  name,
  assignmentEvents,
  encounter,
  columnCount,
  mitplanId,
  sheetId,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  const handleClearEvents = () => {
    dispatch(deleteAssignmentEvents({ mitplanId, sheetId }));
  };

  // const handleSelectEncounter = (selectedEncounter: Encounter) => {
  //   dispatch(updateSheet({ mitplanId, sheetId, updates: { encounter: selectedEncounter } }));
  // };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col bg-white dark:bg-gray-900 text-gray-800 dark:text-white px-6">
        <div className="flex-shrink-0 flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{name}</h2>
          <div className="flex items-center space-x-4">
            <EncounterSelect mitplanId={mitplanId} />
            <button
              onClick={handleClearEvents}
              className="bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800 text-white px-4 py-1 rounded font-semibold transition duration-300 ease-in-out text-sm"
            >
              Clear Events
            </button>
          </div>
        </div>
        <div className="flex-grow flex overflow-hidden">
          <div className="flex-grow overflow-hidden pr-10">
            <VerticalTimeline 
              mitplanId={mitplanId}
              sheetId={sheetId}
            />
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default SheetComponent;