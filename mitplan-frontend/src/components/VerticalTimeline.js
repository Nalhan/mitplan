import React, { useRef, useCallback } from 'react';
import { useDrop } from 'react-dnd';
import TimelineEvent from './TimelineEvent';

const ItemType = 'TIMELINE_EVENT';

const EventColumn = ({ events, moveEvent, timelineLength, onDragEnd, onDrop, columnId, onDeleteEvent }) => {
  const ref = useRef(null);
  const [, drop] = useDrop({
    accept: ItemType,
    hover: (item, monitor) => {
      const draggedTimestamp = calculateTimestamp(monitor.getClientOffset()?.y);
      if (draggedTimestamp !== item.timestamp) {
        if (!item.isNew) {
          moveEvent(item.id, draggedTimestamp, columnId);
        }
      }
    },
    drop: (item, monitor) => {
      const draggedTimestamp = calculateTimestamp(monitor.getClientOffset()?.y);
      item.isNew ? onDrop(item, columnId, draggedTimestamp) : onDragEnd(item.id, draggedTimestamp, columnId);
    },
  });

  const calculateTimestamp = useCallback((clientY) => {
    if (!clientY || !ref.current) return 0;
    const columnRect = ref.current.getBoundingClientRect();
    const relativeY = clientY - columnRect.top;
    return Math.max(0, Math.min((relativeY / columnRect.height) * timelineLength, timelineLength));
  }, [timelineLength]);

  drop(ref);

  return (
    <div ref={ref} className="relative h-full w-full">
      {events.map((event) => (
        <TimelineEvent 
          key={event.key} 
          event={event} 
          timelineLength={timelineLength}
          onDelete={() => onDeleteEvent(event.key)}
        />
      ))}
    </div>
  );
};

const VerticalTimeline = ({ events, moveEvent, timelineLength, columnCount = 2, onDragEnd, onDrop, onDeleteEvent }) => {
  const handleMoveEvent = useCallback((id, newTimestamp, columnId) => {
    moveEvent(id, newTimestamp, columnId);
  }, [moveEvent]);

  const columnEvents = Array.from({ length: columnCount }, (_, index) => 
    events.filter(event => event.columnId === index + 1 || (!event.columnId && index === 0))
  );

  const timestampWidth = 70;

  return (
    <div className="flex h-screen bg-gray-100 rounded-lg shadow-lg overflow-hidden">
      <TimestampColumn timelineLength={timelineLength} />
      <div className="flex flex-grow divide-x divide-gray-200">
        {columnEvents.map((events, index) => (
          <div key={index} className="flex-grow flex-basis-0">
            <EventColumn 
              events={events} 
              moveEvent={(id, newTimestamp) => handleMoveEvent(id, newTimestamp, index + 1)} 
              timelineLength={timelineLength} 
              onDragEnd={(id, newTimestamp) => onDragEnd(id, newTimestamp, index + 1)}
              onDrop={(item, columnId, newTimestamp) => onDrop(item, columnId, newTimestamp)}
              columnId={index + 1}
              onDeleteEvent={onDeleteEvent}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

const TimestampColumn = ({ timelineLength }) => (
  <div className="w-20 flex-shrink-0 bg-gray-200 border-r border-gray-300 relative">
    {Array.from({ length: Math.floor(timelineLength / 5) + 1 }, (_, i) => (
      <div 
        key={i * 5} 
        className="absolute left-0 right-0 flex items-center justify-end pr-2 h-5 text-sm text-gray-600"
        style={{ top: `${(i * 5 / timelineLength) * 100}%`, transform: 'translateY(-50%)' }}
      >
        {i * 5} sec
        <div className="absolute right-0 w-2 h-px bg-gray-400"></div>
      </div>
    ))}
  </div>
);

export default VerticalTimeline;