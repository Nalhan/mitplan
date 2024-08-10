import React, { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import VerticalTimeline from './VerticalTimeline';
import CooldownPalette from './CooldownPalette';
import EventForm from './EventForm';
import EncounterSelect from './EncounterSelect';
import { useTheme } from '../contexts/ThemeContext';
import { EncounterEventType } from '../data/types';

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
  encounterEvents: EncounterEventType[];
  timelineLength: number;
  columnCount: number;
}

const SheetComponent: React.FC<Sheet & {
  onCreateEvent: (event: Event) => void;
  onClearEvents: () => void;
  onUpdateEvent: (event: Event) => void;
  onDeleteEvent: (eventKey: string) => void;
  onUpdateEncounterEvents: (encounterEvents: EncounterEventType[]) => void;
}> = ({
  id,
  name,
  events,
  encounterEvents,
  timelineLength,
  columnCount,
  onCreateEvent,
  onClearEvents,
  onUpdateEvent,
  onDeleteEvent,
  onUpdateEncounterEvents,
}) => {
  const { darkMode } = useTheme();

  const createEvent = (formData: { eventName: string, eventTimestamp: number, eventColumn: number }) => {
    const newEvent: Event = { 
      key: Date.now().toString(),
      name: formData.eventName, 
      timestamp: parseFloat(formData.eventTimestamp.toString()),
      columnId: parseInt(formData.eventColumn.toString()) || 1
    };
    onCreateEvent(newEvent);
  };

  const moveEvent = (id: string, newTimestamp: number, columnId: number) => {
    const updatedEvent = events.find(event => event.key === id);
    if (updatedEvent) {
      const newEvent = { ...updatedEvent, timestamp: parseFloat(newTimestamp.toFixed(2)), columnId };
      onUpdateEvent(newEvent);
    }
  };

  const handleDragEnd = (id: string, newTimestamp: number, columnId: number) => {
    moveEvent(id, newTimestamp, columnId);
  };

  const handleDrop = (item: any, columnId: number, timestamp: number) => {
    if (item.isNew) {
      const newEvent: Event = {
        key: Date.now().toString(),
        name: item.name,
        timestamp: parseFloat(timestamp.toFixed(2)),
        columnId: columnId,
        duration: item.duration,
        color: item.color,
        icon: item.icon,
      };
      onCreateEvent(newEvent);
    } else {
      moveEvent(item.id, timestamp, columnId);
    }
  };

  const handleSelectEncounter = (selectedEvents: EncounterEventType[]) => {
    onUpdateEncounterEvents(selectedEvents);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`container mx-auto py-8 px-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
        <h2 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{name}</h2>
        <div className="space-y-6">
          <EncounterSelect onSelectEncounter={handleSelectEncounter} />
          <EventForm onSubmit={createEvent} columnCount={columnCount} />
          <button
            onClick={onClearEvents}
            className={`${darkMode ? 'bg-red-700 hover:bg-red-800' : 'bg-red-500 hover:bg-red-600'} text-white px-6 py-2 rounded font-semibold transition duration-300 ease-in-out`}
          >
            Clear Events
          </button>
          <div className="flex relative">
            <div className="flex-1 mr-64">
              <VerticalTimeline 
                events={events} 
                encounterEvents={encounterEvents}
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