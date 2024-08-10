import React, { useState } from 'react';
import { RashokEvents } from '../data/encounters/aberrus/Rashok';

interface Encounter {
  name: string;
  events: typeof RashokEvents;
}

const encounters: Encounter[] = [
  { name: 'Rashok', events: RashokEvents },
  // Add more encounters here as they become available
];

interface EncounterSelectProps {
  onSelectEncounter: (events: typeof RashokEvents) => void;
}

const EncounterSelect: React.FC<EncounterSelectProps> = ({ onSelectEncounter }) => {
  const [selectedEncounter, setSelectedEncounter] = useState<string>('');

  const handleEncounterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEncounter(event.target.value);
  };

  const handleApplyEncounter = () => {
    const encounter = encounters.find(e => e.name === selectedEncounter);
    if (encounter) {
      onSelectEncounter(encounter.events);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <select
        value={selectedEncounter}
        onChange={handleEncounterChange}
        className="border border-gray-300 rounded-md p-2"
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
        className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:bg-gray-300"
      >
        Apply
      </button>
    </div>
  );
};

export default EncounterSelect;