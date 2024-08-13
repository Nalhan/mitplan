import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import VerticalTimeline from './VerticalTimeline';
import EncounterSelect from './EncounterSelect';
import CooldownPalette from './CooldownPalette';
import { useTheme } from '../contexts/ThemeContext';
import { Sheet as SheetType, EncounterEventType } from '../types';
import { deleteAssignmentEvents, updateEncounterEvents } from '../store/roomsSlice';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';

const SheetComponent: React.FC<SheetType & {
  roomId: string;
  sheetId: string;
}> = ({
  name,
  assignmentEvents,
  encounterEvents,
  timelineLength,
  columnCount,
  roomId,
  sheetId,
}) => {
  const { darkMode } = useTheme();
  const dispatch = useDispatch<AppDispatch>();

  const handleClearEvents = () => {
    dispatch(deleteAssignmentEvents({ roomId, sheetId}));
  };

  const handleSelectEncounter = (selectedEvents: EncounterEventType[]) => {
    dispatch(updateEncounterEvents({ roomId, sheetId, events: selectedEvents }));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`h-full flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'} px-6`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{name}</h2>
          <div className="flex items-center space-x-4">
            <EncounterSelect onSelectEncounter={handleSelectEncounter} />
            <button
              onClick={handleClearEvents}
              className={`${darkMode ? 'bg-red-700 hover:bg-red-800' : 'bg-red-500 hover:bg-red-600'} text-white px-4 py-1 rounded font-semibold transition duration-300 ease-in-out text-sm`}
            >
              Clear Events
            </button>
          </div>
        </div>
        <div className="flex-grow flex overflow-hidden">
          <div className="flex-grow overflow-hidden pr-10">
            <VerticalTimeline 
              roomId={roomId}
              sheetId={sheetId}
            />
          </div>
          <div className="w-36 flex-shrink-0">
            <CooldownPalette />
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default SheetComponent;