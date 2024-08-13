import React, { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDrop, useDragLayer } from 'react-dnd';
import { v4 as uuidv4 } from 'uuid';
import AssignmentEvent from './AssignmentEvent';
import EncounterEvent from './EncounterEvent';
import { useTheme } from '../contexts/ThemeContext';
import { useContextMenu } from './Shared/ContextMenu';
import { EncounterEventType, AssignmentEventType, RootState } from '../types';
import { updateSheet } from '../store/roomsSlice';

const ItemType = 'ASSIGNMENT_EVENT';

interface EventColumnProps {
  events: { [id: string]: AssignmentEventType };
  moveEvent: (id: string, newTimestamp: number, columnId: number) => void;
  timelineLength: number;
  onDragEnd: (id: string, newTimestamp: number, columnId: number) => void;
  onDrop: (item: any, columnId: number, newTimestamp: number) => void;
  columnId: number;
  roomId: string;
  sheetId: string;
}

const EventColumn: React.FC<EventColumnProps> = ({ events, timelineLength, onDragEnd, onDrop, columnId, roomId, sheetId }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { showContextMenu } = useContextMenu();

  const [, drop] = useDrop({
    accept: ItemType,
    drop: (item: AssignmentEventType, monitor) => {
      const draggedTimestamp = calculateTimestamp(monitor.getClientOffset()?.y);
      onDragEnd(item.id, draggedTimestamp, columnId);
    },
  });

  const calculateTimestamp = useCallback((clientY: number | undefined): number => {
    if (!clientY || !ref.current) return 0;
    const columnRect = ref.current.getBoundingClientRect();
    const relativeY = clientY - columnRect.top;
    return Math.max(0, Math.min((relativeY / columnRect.height) * timelineLength, timelineLength));
  }, [timelineLength]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const timestamp = calculateTimestamp(e.clientY);
    showContextMenu([
      {
        label: 'Add new event',
        action: () => onDrop({ isNew: true, name: 'New Event' }, columnId, timestamp)
      }
    ], e.clientX, e.clientY);
  }, [showContextMenu, calculateTimestamp, onDrop, columnId]);

  drop(ref);

  return (
    <div 
      ref={ref} 
      className="relative h-full w-full"
      onContextMenu={handleContextMenu}
    >
      {Object.values(events).map((event) => (
        <AssignmentEvent 
          key={event.id} 
          event={event} 
          timelineLength={timelineLength}
          roomId={roomId}
          sheetId={sheetId}
        />
      ))}
    </div>
  );
};

interface VerticalTimelineProps {
  roomId: string;
  sheetId: string;
}

const VerticalTimeline: React.FC<VerticalTimelineProps> = ({ roomId, sheetId }) => {
  const { darkMode } = useTheme();
  const dispatch = useDispatch();

  const sheet = useSelector((state: RootState) => state.rooms[roomId]?.sheets[sheetId]);
  const { assignmentEvents, encounterEvents, timelineLength, columnCount } = sheet || {};

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
    if (item.isNew) {
      const newEvent: AssignmentEventType = {
        id: uuidv4(),
        name: item.name,
        timestamp: newTimestamp,
        columnId: columnId,
      };
      updateSheetEvents({ [newEvent.id]: newEvent });
    } else {
      handleMoveEvent(item.id, newTimestamp, columnId);
    }
  }, [updateSheetEvents, handleMoveEvent]);

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

  const CustomDragLayer = () => {
    const { isDragging, item, currentOffset } = useDragLayer((monitor) => ({
      item: monitor.getItem(),
      currentOffset: monitor.getSourceClientOffset(),
      isDragging: monitor.isDragging(),
    }));

    if (!isDragging || !currentOffset) {
      return null;
    }

    const { y } = currentOffset;
    const timestamp = Math.max(0, Math.min(Math.round((y / window.innerHeight) * timelineLength), timelineLength));

    return (
      <div style={{
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 100,
        left: currentOffset.x,
        top: currentOffset.y,
      }}>
        <AssignmentEvent
          event={{ ...item, timestamp }}
          timelineLength={timelineLength}
          roomId={roomId}
          sheetId={sheetId}
          isDragging
        />
      </div>
    );
  };

  return (
    <>
      <div className={`flex h-screen ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg shadow-lg overflow-hidden`}>
        <TimestampColumn timelineLength={timelineLength || 0} encounterEvents={encounterEvents || []} />
        <div className={`flex flex-grow ${darkMode ? 'divide-gray-700' : 'divide-gray-200'} divide-x`}>
          {columnEvents.map((events, index) => (
            <div key={index} className="flex-grow flex-basis-0">
              <EventColumn 
                events={events} 
                moveEvent={handleMoveEvent}
                timelineLength={timelineLength || 0} 
                onDragEnd={handleMoveEvent}
                onDrop={handleDrop}
                columnId={index + 1}
                roomId={roomId}
                sheetId={sheetId}
              />
            </div>
          ))}
        </div>
      </div>
      <CustomDragLayer />
    </>
  );
};

interface TimestampColumnProps {
  timelineLength: number;
  encounterEvents: EncounterEventType[];
}

const TimestampColumn: React.FC<TimestampColumnProps> = ({ timelineLength, encounterEvents }) => {
  const { darkMode } = useTheme();
  return (
    <div className={`w-20 flex-shrink-0 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-200 border-gray-300'} border-r relative`}>
      {Array.from({ length: Math.floor(timelineLength / 5) + 1 }, (_, i) => (
        <div 
          key={i * 5} 
          className={`absolute left-0 right-0 flex items-center justify-end pr-2 h-5 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
          style={{ top: `${(i * 5 / timelineLength) * 100}%`, transform: 'translateY(-50%)' }}
        >
          {i * 5} sec
          <div className={`absolute right-0 w-2 h-px ${darkMode ? 'bg-gray-500' : 'bg-gray-400'}`}></div>
        </div>
      ))}
      {encounterEvents && encounterEvents.map((event) => (
        <EncounterEvent key={event.id} event={event} timelineLength={timelineLength} />
      ))}
    </div>
  );
};

export default VerticalTimeline;