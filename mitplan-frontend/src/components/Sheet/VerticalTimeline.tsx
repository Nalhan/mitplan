import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { AssignmentEventType, RootState } from '../../types';
import { updateSheet, setTimeScale } from '../../store/roomsSlice';
import EventColumn from './EventColumn';
import CustomDragLayer from './CustomDragLayer';
import TimestampColumn from './TimestampColumn';
import CooldownPalette from './CooldownPalette';

interface VerticalTimelineProps {
  roomId: string;
  sheetId: string;
}

const VerticalTimeline: React.FC<VerticalTimelineProps> = ({ roomId, sheetId }) => {
  const dispatch = useDispatch();
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const sheet = useSelector((state: RootState) => state.rooms[roomId]?.sheets[sheetId]);
  const { assignmentEvents, encounter, columnCount, timeScale = 5 } = sheet || {};

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
      ...(item.assignee && { assignee: item.assignee }), // Add this line
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
  };

  const handleTimeScaleChange = useCallback((newTimeScale: number) => {
    dispatch(setTimeScale({ roomId, sheetId, timeScale: newTimeScale }));
  }, [dispatch, roomId, sheetId]);

  const columnWidth = 200; // Fixed width for each column
  const topBufferSeconds = 15; // 15 seconds of buffer at the top
  const topBufferHeight = topBufferSeconds * timeScale;

  return (
    <>
      <div className="flex h-full bg-gray-100 dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden select-none">
        <div className="flex-grow overflow-auto" onScroll={handleScroll} ref={containerRef}>
          <div className="flex" style={{ 
            minHeight: `${(encounter.fightLength + topBufferSeconds) * timeScale + 20}px`, 
            minWidth: '100%', 
            width: 'max-content' 
          }}>
            <div className="flex-shrink-0" style={{ width: '150px', height: '100%' }}>
              <TimestampColumn 
                timelineLength={encounter.fightLength}
                encounterEvents={encounter.events} 
                scrollTop={scrollTop}
                timeScale={timeScale}
                onTimeScaleChange={handleTimeScaleChange}
                topBufferHeight={topBufferHeight}
              />
            </div>
            <div className="flex divide-gray-200 dark:divide-gray-700 divide-x">
              {columnEvents.map((events, index) => (
                <div key={index} style={{ width: `${columnWidth}px`, flexShrink: 0 }}>
                  <EventColumn 
                    events={events} 
                    timelineLength={encounter.fightLength}
                    onDragEnd={handleMoveEvent}
                    onDrop={handleDrop}
                    columnId={index + 1}
                    roomId={roomId}
                    sheetId={sheetId}
                    scrollTop={scrollTop}
                    timeScale={timeScale}
                    topBufferHeight={topBufferHeight}
                  />
                </div>
              ))}
            </div>
            <CooldownPalette 
              roomId={roomId}
              sheetId={sheetId}
              encounterLength={encounter.fightLength}
              timeScale={timeScale}
              scrollTop={scrollTop}
              topBufferHeight={topBufferHeight}
            />
          </div>
        </div>
      </div>
      <CustomDragLayer 
        timelineLength={encounter.fightLength}
        roomId={roomId}
        sheetId={sheetId}
        timeScale={timeScale}
        scrollTop={scrollTop}
        topBufferHeight={topBufferHeight}
      />
    </>
  );
};

export default VerticalTimeline;