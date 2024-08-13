import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { allEncounters } from '../data/encounters/encounters';
import { useTheme } from '../contexts/ThemeContext';
import { Encounter, RootState } from '../types';
import { updateSheet } from '../store/roomsSlice';

interface EncounterSelectProps {
  onSelectEncounter: (events: Encounter['events']) => void;
  roomId: string;
}

const EncounterSelect: React.FC<EncounterSelectProps> = ({ onSelectEncounter, roomId }) => {
  const [selectedEncounter, setSelectedEncounter] = useState<string>('');
  const [encounterList, setEncounterList] = useState<Record<string, Encounter>>({});
  const { darkMode } = useTheme();
  const dispatch = useDispatch();
  const activeRoom = useSelector((state: RootState) => state.rooms[roomId]);

  useEffect(() => {
    const loadEncounters = async () => {
      try {
        const encounters = await allEncounters;
        setEncounterList(encounters);
        console.log('Loaded encounters:', encounters); // Debug print
      } catch (error) {
        console.error('Failed to load encounters:', error);
      }
    };

    loadEncounters();
  }, []);

  const handleEncounterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEncounter(event.target.value);
  };

  const handleApplyEncounter = () => {
    const encounter = encounterList[selectedEncounter];
    if (encounter && activeRoom) {
      onSelectEncounter(encounter.events);
      
      // Update the sheet's timeline length
      const activeSheetId = activeRoom.activeSheetId;
      if (activeSheetId) {
        console.log(`Attempting to update sheet: roomId=${roomId}, sheetId=${activeSheetId}, new timelineLength=${encounter.fightLength}`);
        dispatch(updateSheet({
          roomId,
          sheetId: activeSheetId,
          updates: { timelineLength: encounter.fightLength }
        }));
        console.log(`Updated timeline length to ${encounter.fightLength} for room ${roomId}, sheet ${activeSheetId}`); // Debug log
      } else {
        console.error('No active sheet found');
      }
    } else {
      console.error('No encounter selected or active room not found');
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <select
        value={selectedEncounter}
        onChange={handleEncounterChange}
        className={`border rounded-md p-2 ${
          darkMode
            ? 'bg-gray-700 text-white border-gray-600'
            : 'bg-white text-gray-800 border-gray-300'
        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
      >
        <option value="">Select an encounter</option>
        {Object.entries(encounterList).map(([id, encounter]) => (
          <option key={id} value={id}>
            {encounter.name}
          </option>
        ))}
      </select>
      <button
        onClick={handleApplyEncounter}
        disabled={!selectedEncounter}
        className={`px-4 py-2 rounded-md transition-colors duration-200 ${
          selectedEncounter
            ? darkMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
      >
        Apply
      </button>
    </div>
  );
};

export default EncounterSelect;