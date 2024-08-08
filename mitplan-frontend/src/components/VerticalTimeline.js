import React, { useRef, useCallback, useState } from 'react';
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

const EventColumn = ({ events, moveEvent, timelineLength, onDragEnd, onDrop, columnId }) => {
  const ref = useRef(null);
  const [draggedItem, setDraggedItem] = useState(null);

  const calculateTimestamp = useCallback((clientY) => {
    const columnRect = ref.current.getBoundingClientRect();
    const relativeY = clientY - columnRect.top;
    const calculatedTimestamp = (relativeY / columnRect.height) * timelineLength;
    return Math.max(0, Math.min(calculatedTimestamp, timelineLength));
  }, [timelineLength]);

  const [, drop] = useDrop({
    accept: ItemType,
    hover: (item, monitor) => {
      const clientOffset = monitor.getClientOffset();
      if (clientOffset) {
        const draggedTimestamp = calculateTimestamp(clientOffset.y);
        
        if (draggedTimestamp !== item.timestamp) {
          setDraggedItem({ ...item, timestamp: draggedTimestamp });
          if (!item.isNew) {
            moveEvent(item.id, draggedTimestamp, columnId);
          }
        }
      }
    },
    drop: (item, monitor) => {
      const clientOffset = monitor.getClientOffset();
      if (clientOffset) {
        const draggedTimestamp = calculateTimestamp(clientOffset.y);

        if (item.isNew) {
          onDrop(item, columnId, draggedTimestamp);
        } else {
          onDragEnd(item.id, draggedTimestamp, columnId);
        }
      }
      setDraggedItem(null);
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

const VerticalTimeline = ({ events, moveEvent, timelineLength, columnCount = 2, onDragEnd, onDrop }) => {
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
              onDragEnd={(id, newTimestamp) => onDragEnd(id, newTimestamp, index + 1)}
              onDrop={(item, columnId, newTimestamp) => onDrop(item, columnId, newTimestamp)}
              columnId={index + 1}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VerticalTimeline;