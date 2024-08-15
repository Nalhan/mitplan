import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import EncounterEvent from './EncounterEvent';
import { EncounterEventType } from '../types';

interface TimestampColumnProps {
  timelineLength: number;
  encounterEvents: EncounterEventType[];
  scrollTop: number;
  timeScale: number;
  onTimeScaleChange: (newTimeScale: number) => void;
}

const TimestampColumn: React.FC<TimestampColumnProps> = ({ 
  timelineLength, 
  encounterEvents, 
  scrollTop, 
  timeScale, 
  onTimeScaleChange
}) => {
  const { darkMode } = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startTimeScale, setStartTimeScale] = useState(timeScale);
  const handleMouseMoveRef = useRef<(e: MouseEvent) => void>();
  const handleMouseUpRef = useRef<(e: MouseEvent) => void>();

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setStartTimeScale(timeScale);
  }, [timeScale]);

  useEffect(() => {
    handleMouseMoveRef.current = (e: MouseEvent) => {
      if (isDragging) {
        const newY = e.clientY;
        const newTimeScale = Math.max(1, Math.min(startTimeScale * (1 + (newY - startY) / 100), 100));
        onTimeScaleChange(newTimeScale);
      }
    };

    handleMouseUpRef.current = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMoveRef.current);
    document.addEventListener('mouseup', handleMouseUpRef.current);

    return () => {
      document.removeEventListener('mousemove', handleMouseMoveRef.current!);
      document.removeEventListener('mouseup', handleMouseUpRef.current!);
    };
  }, [isDragging, startY, startTimeScale, onTimeScaleChange]);

  const isTimestampNearEvent = (timestamp: number) => {
    return encounterEvents.some(event => {
      const eventTime = event.timer_dynamic + (event.phase_start || 0);
      return Math.abs(eventTime - timestamp) < 2; // Hide timestamps within 2 seconds of an event
    });
  };

  const formatTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getVisibleTimestamps = () => {
    const timestampInterval = Math.max(5, Math.ceil(30 / timeScale)); // Adjust interval based on timeScale
    const timestamps = [];
    for (let i = 0; i <= timelineLength; i += timestampInterval) {
      if (!isTimestampNearEvent(i)) {
        timestamps.push(i);
      }
    }
    return timestamps;
  };
  return (
    <div className={`w-full h-full ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
      <div 
        className={`w-full h-full flex-shrink-0 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-200 border-gray-300'} border-r relative cursor-ns-resize select-none`} 
        onMouseDown={handleMouseDown}
      >
        {getVisibleTimestamps().map((timestamp) => (
          <div 
            key={timestamp} 
            className={`absolute left-0 right-0 flex items-center justify-end pr-4 h-5 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} select-none`}
            style={{ top: `${timestamp * timeScale}px` }}
          >
            <span className="font-mono px-1 rounded">{formatTimestamp(timestamp)}</span>
            <div className={`absolute right-0 w-3 h-px ${darkMode ? 'bg-gray-500' : 'bg-gray-400'}`}></div>
          </div>
        ))}
        <div className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none">
          {encounterEvents && encounterEvents.map((event) => (
            <EncounterEvent 
              key={event.id} 
              event={event} 
              timelineLength={timelineLength} 
              timeScale={timeScale}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimestampColumn;