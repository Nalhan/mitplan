import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import VerticalTimeline from './VerticalTimeline';
import CooldownPalette from './CooldownPalette';
import EventForm from './EventForm';
import { useTheme } from '../contexts/ThemeContext';

export interface Event {
  key: string;
  name: string;
  timestamp: number;
  columnId: number;
  duration?: number;
  color?: string;
  icon?: string;
}

export interface Sheet {
  id: string;
  name: string;
  events: Event[];
  timelineLength: number;
  columnCount: number;
}

const SheetComponent: React.FC<Sheet & {
  onCreateEvent: (event: Event) => void;
  onClearEvents: () => void;
  onUpdateEvent: (event: Event) => void;
  onDeleteEvent: (eventKey: string) => void;
}> = ({
  id,
  name,
  events,
  timelineLength,
  columnCount,
  onCreateEvent,
  onClearEvents,
  onUpdateEvent,
  onDeleteEvent,
}) => {
  const [localEvents, setLocalEvents] = useState<Event[]>(events);
  const { darkMode } = useTheme();

  useEffect(() => {
    setLocalEvents(events);
  }, [events]);

  const createEvent = (formData: { eventName: string, eventTimestamp: number, eventColumn: number }) => {
    const newEvent: Event = { 
      key: localEvents.length.toString(), 
      name: formData.eventName, 
      timestamp: parseFloat(formData.eventTimestamp.toString()),
      columnId: parseInt(formData.eventColumn.toString()) || 1
    };
    onCreateEvent(newEvent);
  };

  const moveEvent = (id: string, newTimestamp: number, columnId: number) => {
    const updatedEvents = localEvents.map(event => {
      if (event.key === id) {
        return { ...event, timestamp: parseFloat(newTimestamp.toFixed(2)), columnId };
      }
      return event;
    });

    setLocalEvents(updatedEvents);
  };

  const handleDragEnd = (id: string, newTimestamp: number, columnId: number) => {
    const updatedEvent = localEvents.find(event => event.key === id);
    if (updatedEvent) {
      const newEvent = { ...updatedEvent, timestamp: parseFloat(newTimestamp.toFixed(2)), columnId };
      onUpdateEvent(newEvent);
    }
  };

  const handleDrop = (item: any, columnId: number, timestamp: number) => {
    if (item.isNew) {
      const newEvent: Event = {
        key: localEvents.length.toString(),
        name: item.name,
        timestamp: parseFloat(timestamp.toFixed(2)),
        columnId: columnId,
        duration: item.duration,
        color: item.color,
        icon: item.icon,
      };
      onCreateEvent(newEvent);
    } else {
      const updatedEvent = localEvents.find(event => event.key === item.id);
      if (updatedEvent) {
        const newEvent = { ...updatedEvent, timestamp: parseFloat(timestamp.toFixed(2)), columnId };
        onUpdateEvent(newEvent);
      }
    }
  };
  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`container mx-auto py-8 px-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
        <h2 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{name}</h2>
        <div className="space-y-6">
          <EventForm onSubmit={createEvent} columnCount={columnCount} />
          <button
            onClick={onClearEvents}
            className={`${darkMode ? 'bg-red-700 hover:bg-red-800' : 'bg-red-500 hover:bg-red-600'} text-white px-6 py-2 rounded font-semibold transition duration-300 ease-in-out`}
          >
            Clear Events
          </button>
          <div className="flex relative select-none">
            <div className="flex-1 mr-64">
              <VerticalTimeline 
                events={localEvents} 
                moveEvent={moveEvent} 
                timelineLength={timelineLength}
                columnCount={columnCount}
                onDragEnd={handleDragEnd}
                onDrop={handleDrop}
                onDeleteEvent={onDeleteEvent}
              />
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-64">
              <CooldownPalette />
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default SheetComponent;