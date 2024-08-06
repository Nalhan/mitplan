import React from 'react';
import { useDrop } from 'react-dnd';

const Timeline = ({ events, moveEvent }) => {
  const seconds = Array.from({ length: 61 }, (_, i) => i); // Create an array from 0 to 60

  const [{ isOver }, drop] = useDrop({
    accept: 'EVENT',
    drop: (item, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      const index = Math.round(delta.y / 30); // Assuming each second is 30px tall
      const newIndex = Math.min(Math.max(index, 0), 60); // Clamp to 0-60
      moveEvent(item.index, newIndex);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div ref={drop} style={{ borderRight: '1px solid #ccc', paddingRight: '10px' }}>
      {seconds.map((second) => (
        <div key={second} style={{ height: '30px', display: 'flex', alignItems: 'center' }}>
          {second}
          <div style={{ flexGrow: 1 }} />
          {events.filter(event => event.timestamp === second).map((event, index) => (
            <div key={event.key} style={{ background: 'lightblue', margin: '2px', padding: '2px' }}>
              {event.name}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Timeline;