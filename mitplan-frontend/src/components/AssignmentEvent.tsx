import React, { useRef, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { FaTrash, FaClock } from 'react-icons/fa';
import { AssignmentEventType } from '../types';

const ItemType = 'ASSIGNMENT_EVENT';

interface AssignmentEventProps {
  event: AssignmentEventType;
  timelineLength: number;
  onDelete: () => void;
}

const AssignmentEvent: React.FC<AssignmentEventProps> = ({ event, timelineLength, onDelete }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: ItemType,
    item: { id: event.id, timestamp: event.timestamp, columnId: event.columnId },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  useEffect(() => {
    // Create a blank image for the drag preview
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
    preview(img);
  }, [preview]);

  drag(ref);

  const top = `${(event.timestamp / timelineLength) * 100}%`;

  const getContrastColor = (bgColor: string): string => {
    // Simple function to determine if text should be black or white based on background color
    const rgb = parseInt(bgColor.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma < 128 ? 'text-white' : 'text-gray-800';
  };

  const bgColor = event.color || '#3b82f6'; // default to blue-500 if no color specified
  const textColor = getContrastColor(bgColor);

  return (
    <div
      ref={ref}
      className={`absolute left-2 right-2 p-2 rounded-md shadow-md cursor-grab ${
        isDragging ? 'opacity-50' : ''
      }`}
      style={{
        top,
        transform: 'translateY(-50%)',
        backgroundColor: bgColor,
      }}
    >
      <div className={`flex items-center justify-between ${textColor}`}>
        <div className="flex items-center space-x-2">
          {event.icon && (
            <img 
              src={event.icon} 
              alt={event.name} 
              className="w-6 h-6 rounded-full"
            />
          )}
          <span className="font-medium truncate text-sm">{event.name}</span>
        </div>
        <div className="flex items-center space-x-1">
          <FaClock className="text-xs" />
          <span className="text-xs">{event.timestamp}s</span>
        </div>
      </div>
      <button
        onClick={onDelete}
        className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-colors duration-200"
      >
        <FaTrash className="text-xs" />
      </button>
    </div>
  );
};

export default AssignmentEvent;