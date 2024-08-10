import React from 'react';
import { useDragLayer } from 'react-dnd';

const CustomDragLayer: React.FC = () => {
  const { isDragging } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
  }));

  if (!isDragging) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 100,
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        cursor: 'grabbing',
      }}
    />
  );
};

export default CustomDragLayer;
