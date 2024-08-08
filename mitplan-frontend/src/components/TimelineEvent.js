import React, { useRef, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { getContrastColor } from '../utils/colorUtils';

const ItemType = 'TIMELINE_EVENT';

const TimelineEvent = ({ event, timelineLength, onDelete }) => {
  const ref = useRef(null);
  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemType,
    item: { id: event.key, timestamp: event.timestamp || 0 },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  drag(ref);

  const timestamp = event.timestamp || 0;
  const topPosition = `${(timestamp / timelineLength) * 100}%`;

  const backgroundColor = event.color || '#f0f0f0';
  const textColor = event.color ? getContrastColor(event.color) : '#333';

  return (
    <div 
      ref={ref}
      style={{ 
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        margin: '4px',
        cursor: 'move',
        backgroundColor: backgroundColor,
        color: textColor,
        position: 'absolute',
        left: '10px',
        right: '10px',
        top: topPosition,
        transform: 'translateY(-50%)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        opacity: isDragging ? 0.6 : 1,
      }}
    >
      <span style={{ fontWeight: 'bold' }}>{event.name}</span>
      <span style={{ fontSize: '0.8em' }}>({timestamp.toFixed(2)}s)</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(event.key);
        }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px',
          color: textColor,
          marginLeft: '10px',
          padding: '2px 6px',
          borderRadius: '50%',
        }}
      >
        ×
      </button>
    </div>
  );
};

export default TimelineEvent;