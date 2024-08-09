import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import VerticalTimeline from './VerticalTimeline';
import CooldownPalette from './CooldownPalette';
import EventForm from './EventForm';

function Room() {
  const { roomId } = useParams();
  const [events, setEvents] = useState([]);
  const [timelineLength, setTimelineLength] = useState(null);
  const [columnCount, setColumnCount] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_BACKEND_URL);
    
    newSocket.on('connect', () => {
      console.log('Connected to backend');
      newSocket.emit('joinRoom', roomId);
    });

    newSocket.on('initialState', (data) => {
      if (data.events) setEvents(data.events);
      if (data.settings) {
        setTimelineLength(data.settings.timelineLength);
        setColumnCount(data.settings.columnCount);
      }
    });

    newSocket.on('stateUpdate', (data) => {
      if (data.events) setEvents(data.events);
      if (data.settings) {
        setTimelineLength(data.settings.timelineLength);
        setColumnCount(data.settings.columnCount);
      }
    });

    newSocket.on('error', (error) => {
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

  const createEvent = (formData) => {
    if (!socket) {
      console.error('Socket connection not established');
      return;
    }
    const newEvent = { 
      key: events.length, 
      name: formData.eventName, 
      timestamp: parseFloat(formData.eventTimestamp),
      columnId: parseInt(formData.eventColumn) || 1
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

  const moveEvent = (id, newTimestamp, columnId) => {
    if (!Array.isArray(events)) {
      console.error('Events is not an array:', events);
      return;
    }
    const updatedEvents = events.map(event => {
      if (event.key === id) {
        return { ...event, timestamp: parseFloat(newTimestamp.toFixed(2)), columnId };
      }
      return event;
    });

    setEvents(updatedEvents);
  };

  const handleDragEnd = (id, newTimestamp, columnId) => {
    const updatedEvents = events.map(event => {
      if (event.key === id) {
        return { ...event, timestamp: parseFloat(newTimestamp.toFixed(2)), columnId };
      }
      return event;
    });

    setEvents(updatedEvents);
    saveEventsToBackend(updatedEvents);
  };

  const saveEventsToBackend = (updatedEvents) => {
    if (!socket) {
      console.error('Socket connection not established');
      return;
    }
    socket.emit('updateEvents', roomId, updatedEvents);
  };

  const handleDrop = (item, columnId, timestamp) => {
    if (item.isNew) {
      const newEvent = {
        key: events.length,
        name: item.name,
        timestamp: parseFloat(timestamp.toFixed(2)),
        columnId: columnId,
        duration: item.duration,
        color: item.color,
        icon: item.icon, // Make sure to include the icon
      };
      socket.emit('createEvent', roomId, newEvent);
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

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="Room">
        <h1>Mitplan - Room {roomId}</h1>
        {timelineLength !== null && columnCount !== null ? (
          <>
            <div>
              <input
                type="number"
                value={timelineLength}
                onChange={(e) => setTimelineLength(Math.max(1, parseInt(e.target.value) || 1))}
                placeholder="Timeline Length"
                min="1"
              />
              <input
                type="number"
                value={columnCount}
                onChange={(e) => setColumnCount(Math.max(1, parseInt(e.target.value) || 1))}
                placeholder="Number of Columns"
                min="1"
              />
            </div>
            <EventForm onSubmit={createEvent} columnCount={columnCount} />
            <button onClick={clearEvents}>Clear Events</button>
            <div className="content-wrapper" style={{ display: 'flex', position: 'relative' }}>
              <div className="timeline-container" style={{ flex: 1 }}>
                <VerticalTimeline 
                  events={events} 
                  moveEvent={moveEvent} 
                  timelineLength={timelineLength}
                  columnCount={columnCount}
                  onDragEnd={handleDragEnd}
                  onDrop={handleDrop}
                />
              </div>
              <div className="cooldown-palette-container" style={{ position: 'absolute', right: 0, top: 0, bottom: 0 }}>
                <CooldownPalette />
              </div>
            </div>
          </>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </DndProvider>
  );
}

export default Room;