import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { allEncounters } from '../../data/encounters/encounters';
import { Encounter, RootState } from '../../types';
import { updateSheet } from '../../store/mitplansSlice';

interface EncounterSelectProps {
  mitplanId: string;
}

const EncounterSelect: React.FC<EncounterSelectProps> = ({ mitplanId }) => {
  const [selectedEncounter, setSelectedEncounter] = useState<string>('');
  const [encounterList, setEncounterList] = useState<Record<string, Encounter>>({});
  const dispatch = useDispatch();
  const activeMitplan = useSelector((state: RootState) => state.mitplans.mitplans[mitplanId]);

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
    if (encounter && activeMitplan) {
      const activeSheetId = activeMitplan.activeSheetId;
      if (activeSheetId) {
        console.log(`Updating encounter for mitplan ${mitplanId}, sheet ${activeSheetId}`);
        dispatch(updateSheet({
          mitplanId,
          sheetId: activeSheetId,
          updates: { encounterId: selectedEncounter }
        }));
        console.log(`Updated encounter to ${encounter.name} for mitplan ${mitplanId}, sheet ${activeSheetId}`); // Debug log
      } else {
        console.error('No active sheet found');
      }
    } else {
      console.error('No encounter selected or active mitplan not found');
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <select
        value={selectedEncounter}
        onChange={handleEncounterChange}
        className="border rounded-md p-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            ? 'bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
      >
        Apply
      </button>
    </div>
  );
};

export default EncounterSelect;