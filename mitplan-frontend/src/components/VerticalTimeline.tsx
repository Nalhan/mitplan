import React, { useRef, useCallback, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import AssignmentEvent from './AssignmentEvent';
import EncounterEvent from './EncounterEvent';
import { useTheme } from '../contexts/ThemeContext';
import { useContextMenu } from './Shared/ContextMenu';
import { EncounterEventType, AssignmentEventType } from '../types';
import { updateAssignmentEvents, deleteAssignmentEvents } from '../store/roomsSlice';
import { AppDispatch } from '../store';
import { useDispatch } from 'react-redux';

const ItemType = 'TIMELINE_EVENT';

interface EventColumnProps {
  events: AssignmentEventType[];
  moveEvent: (id: string, newTimestamp: number, columnId: number) => void;
  timelineLength: number;
  onDragEnd: (id: string, newTimestamp: number, columnId: number) => void;
  onDrop: (item: any, columnId: number, newTimestamp: number) => void;
  columnId: number;
  onDeleteEvent: (id: string) => void;
}

const EventColumn: React.FC<EventColumnProps> = ({ events, moveEvent, timelineLength, onDragEnd, onDrop, columnId, onDeleteEvent }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { showContextMenu } = useContextMenu();

  const [, drop] = useDrop({
    accept: ItemType,
    hover: (item: AssignmentEventType, monitor) => {
      const draggedTimestamp = calculateTimestamp(monitor.getClientOffset()?.y);
      if (draggedTimestamp !== item.timestamp) {
        item.timestamp = draggedTimestamp;
        item.columnId = columnId;
      }
    },
    drop: (item: AssignmentEventType, monitor) => {
      const draggedTimestamp = calculateTimestamp(monitor.getClientOffset()?.y);
      if ('isNew' in item && item.isNew) {
        onDrop(item, columnId, draggedTimestamp);
      } else {
        onDragEnd(item.id, draggedTimestamp, columnId);
      }
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
      {events.map((event) => (
        <AssignmentEvent 
          key={event.id} 
          event={event} 
          timelineLength={timelineLength}
          onDelete={() => onDeleteEvent(event.id)}
        />
      ))}
    </div>
  );
};

interface VerticalTimelineProps {
  roomId: string;
  sheetId: string;
  events: AssignmentEventType[];
  timelineLength: number;
  columnCount?: number;
  encounterEvents?: EncounterEventType[];
}

const VerticalTimeline: React.FC<VerticalTimelineProps> = ({ 
  roomId,
  sheetId,
  events, 
  timelineLength, 
  columnCount = 2, 
  encounterEvents = []
}) => {
  const { darkMode } = useTheme();
  const dispatch = useDispatch<AppDispatch>();

  const handleMoveEvent = useCallback((id: string, newTimestamp: number, columnId: number) => {
    dispatch(updateAssignmentEvents({
      roomId,
      sheetId,
      events: { [id]: { id, timestamp: newTimestamp, columnId } }
    }));
  }, [dispatch, roomId, sheetId]);

  const handleDragEnd = useCallback((id: string, newTimestamp: number, columnId: number) => {
    dispatch(updateAssignmentEvents({
      roomId,
      sheetId,
      events: { [id]: { id, timestamp: newTimestamp, columnId } }
    }));
  }, [dispatch, roomId, sheetId]);

  const handleDrop = useCallback((item: any, columnId: number, newTimestamp: number) => {
    if (item.isNew) {
      const newEvent: AssignmentEventType = {
        id: Date.now().toString(), // Generate a unique ID
        timestamp: newTimestamp,
        columnId: columnId,
        name: item.name
      };
      dispatch(updateAssignmentEvents({
        roomId,
        sheetId,
        events: { [newEvent.id]: newEvent }
      }));
    }
  }, [dispatch, roomId, sheetId]);

  const handleDeleteEvent = useCallback((key: string) => {
    dispatch(deleteAssignmentEvents({
      roomId,
      sheetId,
      eventId: key
    }));
  }, [dispatch, roomId, sheetId]);

  useEffect(() => {
    console.log('VerticalTimeline events updated:', events);
  }, [events]);

  const columnEvents = Array.from({ length: columnCount }, (_, index) => 
    events.filter(event => event.columnId === index + 1 || (!event.columnId && index === 0))
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

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-lg shadow-lg overflow-hidden`}>
      <TimestampColumn timelineLength={timelineLength} encounterEvents={encounterEvents} />
      <div className={`flex flex-grow ${darkMode ? 'divide-gray-700' : 'divide-gray-200'} divide-x`}>
        {columnEvents.map((events, index) => (
          <div key={index} className="flex-grow flex-basis-0">
            <EventColumn 
              events={events} 
              moveEvent={handleMoveEvent}
              timelineLength={timelineLength} 
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              columnId={index + 1}
              onDeleteEvent={handleDeleteEvent}
            />
          </div>
        ))}
      </div>
    </div>
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