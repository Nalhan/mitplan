import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { EncounterEventType } from '../types';
import { getContrastColor } from '../utils/colorUtils';

interface EncounterEventProps {
  event: EncounterEventType;
  timelineLength: number;
  timeScale: number;
}

const EncounterEvent: React.FC<EncounterEventProps> = ({ event, timelineLength, timeScale }) => {
  const { darkMode } = useTheme();

  const topPosition = `${((event.timer_dynamic + (event.phase_start || 0)) / timelineLength) * timelineLength * timeScale}px`;
  const eventColor = event.color || (darkMode ? '#DC2626' : '#EF4444'); // Default to red if no color is provided
  const textColor = getContrastColor(eventColor);

  const height = event.duration
    ? `${(event.duration / timelineLength) * timelineLength * timeScale}px`
    : '24px'; // Default height if no duration is provided

  const timestamp = event.timer_dynamic + (event.phase_start || 0);
  const formattedTimestamp = timestamp >= 60
    ? `${Math.floor(timestamp / 60)}:${(timestamp % 60).toFixed(0).padStart(2, '0')}`
    : `${timestamp.toFixed(1)}s`;
  const formattedDuration = event.duration
    ? event.duration >= 60
      ? `${Math.floor(event.duration / 60)}:${(event.duration % 60).toFixed(0).padStart(2, '0')}`
      : `${event.duration.toFixed(1)}s`
    : null;

  const isLarge = parseInt(height) > 48; // Consider events taller than 48px as "large"

  const endTimestamp = event.duration ? timestamp + event.duration : null;
  const formattedEndTimestamp = endTimestamp
    ? endTimestamp >= 60
      ? `${Math.floor(endTimestamp / 60)}:${(endTimestamp % 60).toFixed(0).padStart(2, '0')}`
      : `${endTimestamp.toFixed(1)}s`
    : null;

  return (
    <div 
      className={`absolute left-0 right-2 flex flex-col px-2 text-xs select-none overflow-hidden`}
      style={{ 
        top: topPosition, 
        height: height,
        backgroundColor: eventColor,
        color: textColor,
        zIndex: 10,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        borderRadius: '2px',
        justifyContent: isLarge ? 'space-between' : 'center',
        paddingTop: isLarge ? '4px' : '0',
        paddingBottom: isLarge ? '4px' : '0',
      }}
    >
      <div className={`flex justify-between items-center w-full ${isLarge ? 'mb-1' : ''}`}>
        <span className="font-bold truncate mr-1">{event.name}</span>
        <span className="text-opacity-80 whitespace-nowrap text-right">
          {formattedTimestamp}
          {formattedDuration && ` (${formattedDuration})`}
        </span>
      </div>
      {isLarge && formattedEndTimestamp && (
        <div className="text-opacity-80 whitespace-nowrap self-end">
          {formattedEndTimestamp}
        </div>
      )}
    </div>
  );
};

export default EncounterEvent;