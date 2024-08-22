import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDrop, useDragLayer } from 'react-dnd';
import AssignmentEvent from './AssignmentEvent';
import { useContextMenu } from '../Shared/ContextMenu';
import { AssignmentEventType, CooldownEventType } from '../../types';

const ItemType = 'ASSIGNMENT_EVENT';

interface EventColumnProps {
  events: { [id: string]: AssignmentEventType };
  timelineLength: number;
  onDragEnd: (id: string, newTimestamp: number, columnId: number) => void;
  onDrop: (item: any, columnId: number, newTimestamp: number) => void;
  columnId: number;
  mitplanId: string;
  sheetId: string;
  scrollTop: number;
  timeScale: number;
  topBufferHeight: number;
}

const EventColumn: React.FC<EventColumnProps> = ({ 
  events, 
  timelineLength, 
  onDragEnd, 
  onDrop, 
  columnId, 
  mitplanId, 
  sheetId, 
  scrollTop,
  timeScale,
  topBufferHeight
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { showContextMenu } = useContextMenu();
  const [localEvents, setLocalEvents] = useState(events);
  const [draggedItem, setDraggedItem] = useState<AssignmentEventType | CooldownEventType | null>(null);

  const calculateTimestamp = useCallback((clientY: number | undefined): number => {
    if (!clientY || !ref.current) return 0;
    const columnRect = ref.current.getBoundingClientRect();
    const relativeY = clientY - columnRect.top - topBufferHeight;
    const timestamp = (relativeY) / timeScale;
    return Math.max(0, Math.min(timestamp, timelineLength));
  }, [timelineLength, timeScale, topBufferHeight]);

  const [, drop] = useDrop({
    accept: [ItemType, 'ASSIGNMENT_EVENT'],
    hover: (item: AssignmentEventType | CooldownEventType, monitor) => {
      if (!draggedItem) {
        setDraggedItem(item);
      }
      const draggedTimestamp = calculateTimestamp(monitor.getClientOffset()?.y);
      if (item.type !== 'cooldown' && 'id' in item) {
        setLocalEvents(prev => {
          if (prev[item.id]) {
            return {
              ...prev,
              [item.id]: { ...prev[item.id], timestamp: draggedTimestamp, columnId }
            };
          }
          return prev;
        });
      }
    },
    drop: (item: AssignmentEventType | CooldownEventType, monitor) => {
      const draggedTimestamp = calculateTimestamp(monitor.getClientOffset()?.y);
      if (item.type === 'cooldown') {
        onDrop(item, columnId, draggedTimestamp);
      } else {
        onDragEnd(item.id, draggedTimestamp, columnId);
      }

      if (monitor.didDrop()) {
        console.log('Item was dropped');
      } else {
        console.log('Drag ended without a drop');
      }
      setDraggedItem(null);
    },
  });

  const { isDragging } = useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
  }));

  useEffect(() => {
    if (!isDragging && draggedItem) {
      console.log('Drag ended for item:', draggedItem);
      
      if (draggedItem.type === 'cooldown') {
        console.log('Cooldown drag ended without drop');
      } else if ('id' in draggedItem && events[draggedItem.id]) {
        setLocalEvents(prevEvents => ({
          ...prevEvents,
          [draggedItem.id]: events[draggedItem.id]
        }));
        console.log('Assignment event reset to original position');
      }

      setDraggedItem(null);
    }
  }, [isDragging, draggedItem, events]);

  useEffect(() => {
    if (events) {
      setLocalEvents(events);
    }
  }, [events]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const timestamp = calculateTimestamp(e.clientY);
    showContextMenu([
      {
        label: 'Add new event',
        action: () => onDrop({ isNew: true, name: 'New Event' }, columnId, timestamp)
      }
    ], e.clientX, e.clientY);
  }, [showContextMenu, calculateTimestamp, onDrop, columnId]);

  drop(ref);

  return (
    <div 
      ref={ref} 
      className="relative w-full select-none"
      style={{ 
        height: `${timelineLength * timeScale + topBufferHeight}px`,
        paddingTop: `${topBufferHeight}px`,
        overflow: 'hidden'
      }}
      onContextMenu={handleContextMenu}
    >
      
      {Object.values(localEvents || {}).map((event) => 
        event && 'id' in event ? (
          <AssignmentEvent 
            key={event.id} 
            event={event} 
            timelineLength={timelineLength}
            roomId={roomId}
            sheetId={sheetId}
            timeScale={timeScale}
            scrollTop={scrollTop}
            topBufferHeight={topBufferHeight}
          />
        ) : null
      )}
    </div>
  );
};

export default EventColumn;