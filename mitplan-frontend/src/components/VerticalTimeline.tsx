import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDrop, useDragLayer } from 'react-dnd';
import { v4 as uuidv4 } from 'uuid';
import AssignmentEvent from './AssignmentEvent';
import EncounterEvent from './EncounterEvent';
import { useTheme } from '../contexts/ThemeContext';
import { useContextMenu } from './Shared/ContextMenu';
import { EncounterEventType, AssignmentEventType, RootState, CooldownEventType } from '../types';
import { updateSheet, setTimeScale } from '../store/roomsSlice';
import EventColumn from './EventColumn';
import CustomDragLayer from './CustomDragLayer';
import TimestampColumn from './TimestampColumn';

interface VerticalTimelineProps {
  roomId: string;
  sheetId: string;
}

const VerticalTimeline: React.FC<VerticalTimelineProps> = ({ roomId, sheetId }) => {
  const { darkMode } = useTheme();
  const dispatch = useDispatch();
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const sheet = useSelector((state: RootState) => state.rooms[roomId]?.sheets[sheetId]);
  const { assignmentEvents, encounterEvents, timelineLength, columnCount, timeScale = 5 } = sheet || {};

  const updateSheetEvents = useCallback((updatedEvents: { [id: string]: AssignmentEventType }) => {
    const newEvents = { ...assignmentEvents, ...updatedEvents };
    dispatch(updateSheet({ roomId, sheetId, updates: { assignmentEvents: newEvents } }));
  }, [dispatch, roomId, sheetId, assignmentEvents]);

  const handleMoveEvent = useCallback((id: string, newTimestamp: number, columnId: number) => {
    if (assignmentEvents && id in assignmentEvents) {
      updateSheetEvents({ [id]: { ...assignmentEvents[id], timestamp: newTimestamp, columnId } });
    }
  }, [updateSheetEvents, assignmentEvents]);

  const handleDrop = useCallback((item: any, columnId: number, newTimestamp: number) => {
    const newEvent: AssignmentEventType = {
      id: item.isNew ? uuidv4() : item.id || uuidv4(),
      name: item.name,
      timestamp: newTimestamp,
      columnId: columnId,
      ...(item.color && { color: item.color }),
      ...(item.icon && { icon: item.icon }),
      ...(item.type && { type: item.type }),
      ...(item.ability && { ability: item.ability }),
    };
    updateSheetEvents({ [newEvent.id]: newEvent });
  }, [updateSheetEvents]);

  const columnEvents = Array.from({ length: columnCount || 2 }, (_, index) => 
    Object.fromEntries(
      Object.entries(assignmentEvents || {}).filter(([_, event]) => 
        event.columnId === index + 1 || (!event.columnId && index === 0)
      )
    )
  );

  useEffect(() => {
    const handleMouseUp = () => {
      document.body.style.cursor = '';
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
    setScrollLeft(e.currentTarget.scrollLeft);
  };

  const handleTimeScaleChange = useCallback((newTimeScale: number) => {
    dispatch(setTimeScale({ roomId, sheetId, timeScale: newTimeScale }));
  }, [dispatch, roomId, sheetId]);

  return (
    <>
      <div className={`flex h-screen ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg shadow-lg overflow-hidden select-none`}>
        <div className="flex-grow overflow-auto" onScroll={handleScroll} ref={containerRef}>
          <div className="flex" style={{ height: `${timelineLength * timeScale + 20}px`, minWidth: '100%', width: 'max-content' }}>
            <div className="flex-shrink-0" style={{ width: '120px', height: '100%' }}>
              <TimestampColumn 
                timelineLength={timelineLength || 0} 
                encounterEvents={encounterEvents || []} 
                scrollTop={scrollTop}
                timeScale={timeScale}
                onTimeScaleChange={handleTimeScaleChange}
              />
            </div>
            <div className={`flex flex-grow ${darkMode ? 'divide-gray-700' : 'divide-gray-200'} divide-x`}>
              {columnEvents.map((events, index) => (
                <div key={index} className="flex-grow">
                  <EventColumn 
                    events={events} 
                    timelineLength={timelineLength || 0} 
                    onDragEnd={handleMoveEvent}
                    onDrop={handleDrop}
                    columnId={index + 1}
                    roomId={roomId}
                    sheetId={sheetId}
                    scrollTop={scrollTop}
                    timeScale={timeScale}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <CustomDragLayer 
        timelineLength={timelineLength || 0}
        roomId={roomId}
        sheetId={sheetId}
        timeScale={timeScale}
        scrollTop={scrollTop}
      />
    </>
  );
};

export default VerticalTimeline;