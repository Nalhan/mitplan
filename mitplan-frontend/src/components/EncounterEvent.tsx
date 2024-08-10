import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { EncounterEventType } from '../data/types';

interface EncounterEventProps {
  event: EncounterEventType;
  timelineLength: number;
  
}

const EncounterEvent: React.FC<EncounterEventProps> = ({ event, timelineLength }) => {
  const { darkMode } = useTheme();

  const topPosition = `${(event.timer_dynamic / timelineLength) * 100}%`;

  return (
    <div 
      className={`absolute left-0 right-0 flex items-center justify-start pl-2 h-6 ${
        darkMode ? 'bg-red-700 text-white' : 'bg-red-500 text-white'
      } text-xs font-semibold rounded-r-full shadow-md transition-colors duration-200 ease-in-out`}
      style={{ top: topPosition, transform: 'translateY(-50%)' }}
    >
      <span className="truncate" title={`${event.name} (${event.simple_name})`}>
        {event.simple_name}
      </span>
      <span className="ml-1 text-xxs opacity-75">
        {event.timer_dynamic.toFixed(1)}s
      </span>
      <div className={`absolute right-0 w-2 h-full ${darkMode ? 'bg-red-900' : 'bg-red-700'}`}></div>
    </div>
  );
};

export default EncounterEvent;
