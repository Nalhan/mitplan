import React from 'react';
import { useDragLayer } from 'react-dnd';
import AssignmentEvent from './AssignmentEvent';

interface CustomDragLayerProps {
  timelineLength: number;
  roomId: string;
  sheetId: string;
  timeScale: number;
  scrollTop: number;
}

const CustomDragLayer: React.FC<CustomDragLayerProps> = ({ 
  timelineLength, 
  roomId, 
  sheetId, 
  timeScale, 
  scrollTop 
}) => {
  const { isDragging, item, currentOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  if (!isDragging || !currentOffset) {
    return null;
  }

  const { y } = currentOffset;
  const timestamp = Math.max(0, Math.min(Math.round(((y + scrollTop - 20) / (timelineLength * timeScale)) * timelineLength), timelineLength));

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
        timeScale={timeScale}
        scrollTop={scrollTop}
      />
    </div>
  );
};

export default CustomDragLayer;
