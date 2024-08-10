import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { EncounterEventType } from '../data/types';
import { getContrastColor } from '../utils/colorUtils';

interface EncounterEventProps {
  event: EncounterEventType;
  timelineLength: number;
}

const EncounterEvent: React.FC<EncounterEventProps> = ({ event, timelineLength }) => {
  const { darkMode } = useTheme();

  const topPosition = `${(event.timer_dynamic / timelineLength) * 100}%`;
  const eventColor = event.color || (darkMode ? '#DC2626' : '#EF4444'); // Default to red if no color is provided
  const textColor = getContrastColor(eventColor);

  return (
    <div 
      className={`absolute left-0 right-0 flex items-center justify-start pl-2 h-6 text-xs font-semibold rounded-r-full shadow-md transition-colors duration-200 ease-in-out`}
      style={{ 
        top: topPosition, 
        transform: 'translateY(-50%)',
        backgroundColor: eventColor,
        color: textColor
      }}
    >
      <span className="truncate" title={`${event.name} (${event.simple_name})`}>
        {event.simple_name}
      </span>
      <span className="ml-1 text-xxs opacity-75">
        {event.timer_dynamic?.toFixed(1)}s
      </span>
      <div className={`absolute right-0 w-2 h-full`} style={{ backgroundColor: darkMode ? '#7F1D1D' : '#B91C1C' }}></div>
    </div>
  );
};

export default EncounterEvent;
