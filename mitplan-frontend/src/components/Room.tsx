import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import VerticalTimeline from './VerticalTimeline';
import CooldownPalette from './CooldownPalette';
import EventForm from './EventForm';

interface Event {
  key: string;
  name: string;
  timestamp: number;
  columnId: number;
  duration?: number;
  color?: string;
  icon?: string;
}

interface RoomParams {
  roomId: string;
}

const Room: React.FC = () => {
  const { roomId } = useParams<keyof RoomParams>();
  const [events, setEvents] = useState<Event[]>([]);
  const [timelineLength, setTimelineLength] = useState<number | null>(null);
  const [columnCount, setColumnCount] = useState<number | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_BACKEND_URL as string);
    
    newSocket.on('connect', () => {
      console.log('Connected to backend');
      newSocket.emit('joinRoom', roomId);
    });

    newSocket.on('initialState', (data: { events?: Event[], settings?: { timelineLength: number, columnCount: number } }) => {
      if (data.events) setEvents(data.events);
      if (data.settings) {
        setTimelineLength(data.settings.timelineLength);
        setColumnCount(data.settings.columnCount);
      }
    });

    newSocket.on('stateUpdate', (data: { events?: Event[], settings?: { timelineLength: number, columnCount: number } }) => {
      if (data.events) setEvents(data.events);
      if (data.settings) {
        setTimelineLength(data.settings.timelineLength);
        setColumnCount(data.settings.columnCount);
      }
    });

    newSocket.on('error', (error: string) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    if (socket && timelineLength !== null && columnCount !== null) {
      socket.emit('updateSettings', roomId, { timelineLength, columnCount });
    }
  }, [timelineLength, columnCount, socket, roomId]);

  const createEvent = (formData: { eventName: string, eventTimestamp: number, eventColumn: number }) => {
    if (!socket) {
      console.error('Socket connection not established');
      return;
    }
    const newEvent: Event = { 
      key: events.length.toString(), 
      name: formData.eventName, 
      timestamp: parseFloat(formData.eventTimestamp.toString()),
      columnId: parseInt(formData.eventColumn.toString()) || 1
    };
    socket.emit('createEvent', roomId, newEvent);
  };

  const clearEvents = () => {
    if (!socket) {
      console.error('Socket connection not established');
      return;
    }
    socket.emit('clearEvents', roomId);
  };

  const moveEvent = (id: string, newTimestamp: number, columnId: number) => {
    const updatedEvents = events.map(event => {
      if (event.key === id) {
        return { ...event, timestamp: parseFloat(newTimestamp.toFixed(2)), columnId };
      }
      return event;
    });

    setEvents(updatedEvents);
  };

  const handleDragEnd = (id: string, newTimestamp: number, columnId: number) => {
    const updatedEvents = events.map(event => {
      if (event.key === id) {
        return { ...event, timestamp: parseFloat(newTimestamp.toFixed(2)), columnId };
      }
      return event;
    });

    setEvents(updatedEvents);
    saveEventsToBackend(updatedEvents);
  };

  const saveEventsToBackend = (updatedEvents: Event[]) => {
    if (!socket) {
      console.error('Socket connection not established');
      return;
    }
    socket.emit('updateEvents', roomId, updatedEvents);
  };

  const handleDrop = (item: any, columnId: number, timestamp: number) => {
    if (item.isNew) {
      const newEvent: Event = {
        key: events.length.toString(),
        name: item.name,
        timestamp: parseFloat(timestamp.toFixed(2)),
        columnId: columnId,
        duration: item.duration,
        color: item.color,
        icon: item.icon,
      };
      socket?.emit('createEvent', roomId, newEvent);
    } else {
      const updatedEvents = events.map(event => {
        if (event.key === item.id) {
          return { ...event, timestamp: parseFloat(timestamp.toFixed(2)), columnId };
        }
        return event;
      });
      setEvents(updatedEvents);
      saveEventsToBackend(updatedEvents);
    }
  };

  const onDeleteEvent = (eventKey: string) => {
    if (!socket) {
      console.error('Socket connection not established');
      return;
    }
    const updatedEvents = events.filter(event => event.key !== eventKey);
    setEvents(updatedEvents);
    socket.emit('deleteEvent', roomId, eventKey);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold mb-6 text-gray-800">Mitplan - Room {roomId}</h1>
        {timelineLength !== null && columnCount !== null ? (
          <div className="space-y-6">
            <div className="flex space-x-4">
              <input
                type="number"
                value={timelineLength}
                onChange={(e) => setTimelineLength(Math.max(1, parseInt(e.target.value) || 1))}
                placeholder="Timeline Length"
                min="1"
                className="border border-gray-300 rounded px-4 py-2 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                value={columnCount}
                onChange={(e) => setColumnCount(Math.max(1, parseInt(e.target.value) || 1))}
                placeholder="Number of Columns"
                min="1"
                className="border border-gray-300 rounded px-4 py-2 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <EventForm onSubmit={createEvent} columnCount={columnCount} />
            <button
              onClick={clearEvents}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded font-semibold transition duration-300 ease-in-out"
            >
              Clear Events
            </button>
            <div className="flex relative">
              <div className="flex-1 mr-64">
                <VerticalTimeline 
                  events={events} 
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
        ) : (
          <p className="text-lg text-gray-600">Loading...</p>
        )}
      </div>
    </DndProvider>
  );
};

export default Room;