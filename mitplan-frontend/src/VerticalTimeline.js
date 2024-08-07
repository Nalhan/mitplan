import React, { useRef, useCallback } from 'react';
import { useDrag, useDrop } from 'react-dnd';

const ItemType = 'TIMELINE_EVENT';

const TimelineEvent = ({ event, moveEvent, timelineLength }) => {
  const ref = useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { id: event.key, timestamp: event.timestamp || 0 },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(ref);

  const timestamp = event.timestamp || 0;

  return (
    <div 
      ref={ref}
      style={{ 
        padding: '5px', 
        border: '1px solid black', 
        margin: '2px',
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        backgroundColor: 'white',
        position: 'absolute',
        left: 0,
        right: 0,
        top: `${(timestamp / timelineLength) * 100}%`,
        transform: 'translateY(-50%)',
      }}
    >
      {event.name} (Timestamp: {timestamp.toFixed(2)})
    </div>
  );
};

const EventColumn = ({ events, moveEvent, timelineLength }) => {
  const ref = useRef(null);

  const [, drop] = useDrop({
    accept: ItemType,
    hover: (item, monitor) => {
      const columnRect = ref.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - columnRect.top;
      
      const draggedTimestamp = (hoverClientY / columnRect.height) * timelineLength;
      
      if (draggedTimestamp !== item.timestamp) {
        moveEvent(item.id, draggedTimestamp);
      }
    },
  });

  drop(ref);

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        height: '100%',
        width: '100%',
      }}
    >
      {events.map((event) => (
        <TimelineEvent 
          key={event.key} 
          event={event} 
          moveEvent={moveEvent}
          timelineLength={timelineLength}
        />
      ))}
    </div>
  );
};

const VerticalTimeline = ({ events, moveEvent, timelineLength, columnCount = 2 }) => {
  const handleMoveEvent = useCallback((id, newTimestamp, columnId) => {
    moveEvent(id, newTimestamp, columnId);
  }, [moveEvent]);

  // Split events into columns
  const columnEvents = Array.from({ length: columnCount }, (_, index) => 
    events.filter(event => event.columnId === index + 1 || (!event.columnId && index === 0))
  );

  const timestampWidth = 70; // Set a fixed width for the timestamp column

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
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
      <div style={{ display: 'flex', flexGrow: 1 }}>
        {columnEvents.map((events, index) => (
          <div key={index} style={{ flexGrow: 1, flexBasis: 0 }}>
            <EventColumn 
              events={events} 
              moveEvent={(id, newTimestamp) => handleMoveEvent(id, newTimestamp, index + 1)} 
              timelineLength={timelineLength} 
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VerticalTimeline;