import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import VerticalTimeline from './VerticalTimeline';
import EncounterSelect from './EncounterSelect';
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
      <div className={`container mx-auto py-8 px-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
        <h2 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{name}</h2>
        <div className="space-y-6">
          <EncounterSelect onSelectEncounter={handleSelectEncounter} />
          <button
            onClick={handleClearEvents}
            className={`${darkMode ? 'bg-red-700 hover:bg-red-800' : 'bg-red-500 hover:bg-red-600'} text-white px-6 py-2 rounded font-semibold transition duration-300 ease-in-out`}
          >
            Clear Events
          </button>
          <div className="flex relative">
            <div className="flex-1 mr-64">
              <VerticalTimeline 
                roomId={roomId}
                sheetId={sheetId}
              />
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-64">
              {/* <CooldownPalette /> */}
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default SheetComponent;