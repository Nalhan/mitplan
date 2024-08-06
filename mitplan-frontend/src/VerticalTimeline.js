import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

const ItemType = 'TIMELINE_EVENT';

const TimelineEvent = ({ event, index, moveEvent }) => {
  const ref = useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { index, timestamp: event.timestamp },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(ref);

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
      }}
    >
      {event.name} (Timestamp: {event.timestamp})
    </div>
  );
};

const TimeSlot = ({ timestamp, children, events, moveEvent }) => {
  const [{ isOver }, drop] = useDrop({
    accept: ItemType,
    drop: (item) => {
      if (item.timestamp !== timestamp) {
        moveEvent(item.index, events.length, timestamp);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '40px',
        backgroundColor: isOver ? '#f0f0f0' : 'transparent',
        border: '1px solid #ccc',
        marginBottom: '5px',
      }}
    >
      <span style={{ 
        minWidth: '50px',
        marginRight: '10px',
        marginLeft: '5px',
      }}>
        {timestamp} sec
      </span>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        height: '100%',
        flexGrow: 1,
      }}>
        {children}
      </div>
    </div>
  );
};

const VerticalTimeline = ({ events, moveEvent, timelineLength }) => {
  const timestamps = Array.from({ length: timelineLength }, (_, i) => i);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: '100%' }}>
      {timestamps.map((timestamp) => (
        <TimeSlot key={timestamp} timestamp={timestamp} events={events} moveEvent={moveEvent}>
          {events
            .filter(event => event.timestamp === timestamp)
            .map((event) => (
              <TimelineEvent key={event.key} index={events.indexOf(event)} event={event} moveEvent={moveEvent} />
            ))}
        </TimeSlot>
      ))}
    </div>
  );
};

export default VerticalTimeline;