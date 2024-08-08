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
    <div ref={ref} style={{ position: 'relative', height: '100%', width: '100%' }}>
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
    <div style={{ display: 'flex', height: '100vh' }}>
      <TimestampColumn timelineLength={timelineLength} timestampWidth={timestampWidth} />
      <div style={{ display: 'flex', flexGrow: 1 }}>
        {columnEvents.map((events, index) => (
          <div key={index} style={{ flexGrow: 1, flexBasis: 0 }}>
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

const TimestampColumn = ({ timelineLength, timestampWidth }) => (
  <div style={{ 
    width: `${timestampWidth}px`, 
    flexShrink: 0, 
    borderRight: '1px solid #ccc', 
    position: 'relative' 
  }}>
    {Array.from({ length: Math.floor(timelineLength / 5) + 1 }, (_, i) => (
      <div 
        key={i * 5} 
        style={{ 
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${(i * 5 / timelineLength) * 100}%`,
          transform: 'translateY(-50%)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-end', 
          paddingRight: '5px',
          height: '20px',
        }}
      >
        {i * 5} sec
      </div>
    ))}
  </div>
);

export default VerticalTimeline;