import React, { useRef, useCallback } from 'react';
import { useDrag, DragPreviewImage } from 'react-dnd';
import { FaTrash, FaClock } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { AssignmentEventType, CooldownEventType, TextEventType } from '../types';
import { deleteAssignmentEvents } from '../store/roomsSlice';
import { useTheme } from '../contexts/ThemeContext';

// TODO: figure out how to get rid of this
const ItemType = 'ASSIGNMENT_EVENT';

interface AssignmentEventProps {
  event: AssignmentEventType;
  timelineLength: number;
  roomId: string;
  sheetId: string;
  isDragging?: boolean;
  timeScale: number;
  scrollTop: number;
}

const AssignmentEvent: React.FC<AssignmentEventProps> = ({ event, timelineLength, roomId, sheetId, isDragging = false, timeScale, scrollTop }) => {
  const dispatch = useDispatch();
  const ref = useRef<HTMLDivElement>(null);
  const { darkMode } = useTheme();
  const [{ isDragging: isBeingDragged }, drag, preview] = useDrag(() => ({
    type: ItemType,
    item: { ...event, type: ItemType },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  drag(ref);

  const isCooldownEvent = (event: AssignmentEventType): event is CooldownEventType => 
    'ability' in event;

  const top = `${event.timestamp * timeScale}px`;
  const durationHeight = isCooldownEvent(event) ? `${event.ability.duration * timeScale}px` : '0';

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

  const formatTimestamp = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <DragPreviewImage connect={preview} src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
      <div
        className={`absolute left-2 right-1/2 bg-opacity-5 backdrop-filter backdrop-blur-xl`}
        style={{
          top: top,
          height: durationHeight,
          backgroundColor: bgColor,
          display: isDragging ? 'none' : 'block',
          borderRadius: '4px',
          //boxShadow: `0 0 10px ${bgColor}40`,
        }}
      />
      <div
        ref={ref}
        className={`absolute left-2 right-2 p-2 rounded-md cursor-grab hover:ring-2 hover:ring-blue-500  ${
          isBeingDragged ? '' : ''
        } ${darkMode ? 'shadow-sm shadow-gray-700' : 'shadow-sm shadow-gray-700'} group`}
        style={{
          top: top,
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
            <span className="font-bold truncate text-sm bg-opacity-20 px-1 py-0.5 rounded">{event.name}</span>
          </div>
          <div className="flex items-center space-x-1">
            <FaClock className="text-xs" />
            <span className="text-xs">{formatTimestamp(event.timestamp)}</span>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 duration-200 opacity-0 group-hover:opacity-100 transition-opacity ease-in-out"
        >
          <FaTrash className="text-xs" />
        </button>
        {event.type === 'text' && (
          <div className="mt-1 text-xs">
            {(event as TextEventType).content}
          </div>
        )}
      </div>
    </>
  );
};

export default AssignmentEvent;