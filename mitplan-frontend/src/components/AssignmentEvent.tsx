import React, { useRef, useCallback } from 'react';
import { useDrag } from 'react-dnd';
import { FaTrash, FaClock } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { AssignmentEventType } from '../types';
import { deleteAssignmentEvents } from '../store/roomsSlice';

// TODO: figure out how to get rid of this
const ItemType = 'ASSIGNMENT_EVENT';

interface AssignmentEventProps {
  event: AssignmentEventType;
  timelineLength: number;
  roomId: string;
  sheetId: string;
  isDragging?: boolean;
}

const AssignmentEvent: React.FC<AssignmentEventProps> = ({ event, timelineLength, roomId, sheetId, isDragging = false }) => {
  const dispatch = useDispatch();
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging: isBeingDragged }, drag] = useDrag(() => ({
    type: ItemType,
    item: { ...event, type: ItemType },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  drag(ref);

  const top = `${(event.timestamp / timelineLength) * 100}%`;

  const getContrastColor = (bgColor: string): string => {
    const rgb = parseInt(bgColor.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma < 128 ? 'text-white' : 'text-gray-800';
  };

  const bgColor = event.color || '#3b82f6';
  const textColor = getContrastColor(bgColor);

  const handleDelete = useCallback(() => {
    dispatch(deleteAssignmentEvents({ roomId, sheetId, eventId: event.id }));
  }, [dispatch, roomId, sheetId, event.id]);

  return (
    <div
      ref={ref}
      className={`absolute left-2 right-2 p-2 rounded-md shadow-md cursor-grab ${
        isBeingDragged ? 'opacity-50' : ''
      }`}
      style={{
        top,
        transform: 'translateY(-50%)',
        backgroundColor: bgColor,
        display: isDragging ? 'none' : 'block',
      }}
    >
      <div className={`flex items-center justify-between ${textColor}`}>
        <div className="flex items-center space-x-2">
          {event.icon && (
            <img 
              src={`https://wow.zamimg.com/images/wow/icons/small/${event.icon}.jpg`}
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
        onClick={handleDelete}
        className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-colors duration-200"
      >
        <FaTrash className="text-xs" />
      </button>
    </div>
  );
};

export default AssignmentEvent;