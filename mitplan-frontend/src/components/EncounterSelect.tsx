import React, { useState } from 'react';
import { RashokEvents } from '../data/encounters/aberrus/Rashok';
import { useTheme } from '../contexts/ThemeContext';

interface Encounter {
  name: string;
  events: typeof RashokEvents;
}

const encounters: Encounter[] = [
  { name: 'Rashok', events: RashokEvents },
  // Add more encounters here as they become available
];

interface EncounterSelectProps {
  onSelectEncounter: (events: typeof RashokEvents, timelineLength: number) => void;
}

const EncounterSelect: React.FC<EncounterSelectProps> = ({ onSelectEncounter }) => {
  const [selectedEncounter, setSelectedEncounter] = useState<string>('');
  const { darkMode } = useTheme();

  const handleEncounterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEncounter(event.target.value);
  };

  const calculateTimelineLength = (events: typeof RashokEvents): number => {
    const lastEvent = events[events.length - 1];
    return lastEvent.timer_dynamic + (lastEvent.phase_start || 0);
  };

  const handleApplyEncounter = () => {
    const encounter = encounters.find(e => e.name === selectedEncounter);
    if (encounter) {
      const timelineLength = calculateTimelineLength(encounter.events);
      onSelectEncounter(encounter.events, timelineLength);
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
        {encounters.map((encounter) => (
          <option key={encounter.name} value={encounter.name}>
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