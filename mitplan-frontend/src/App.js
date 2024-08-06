import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import VerticalTimeline from './VerticalTimeline';
import CooldownPalette from './CooldownPalette';
import cooldowns from './data/cooldowns.yaml';

function App() {
  const [events, setEvents] = useState([]);
  const [eventName, setEventName] = useState('');
  const [eventTimestamp, setEventTimestamp] = useState(1);
  const [timelineLength, setTimelineLength] = useState(121);

  const fetchEventsFromBackend = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const createEvent = async (e) => {
    e.preventDefault();
    const newEvent = { key: events.length, name: eventName, timestamp: eventTimestamp }; // Assign unique key
    try {
      const response = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([newEvent]), // Send as an array
      });
      if (!response.ok) {
        throw new Error('Failed to create event');
      }
      setEvents((prevEvents) => [...prevEvents, newEvent]); // Update state
      setEventName(''); // Clear input
      setEventTimestamp(5); // Reset timestamp
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const clearEvents = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/events', {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to clear events');
      }
      setEvents([]); // Clear local state
      console.log('Events cleared successfully');
    } catch (error) {
      console.error('Error clearing events:', error);
    }
  };

  const moveEvent = (fromIndex, toIndex, newTimestamp) => {
    const updatedEvents = [...events];
    const [movedEvent] = updatedEvents.splice(fromIndex, 1);
    movedEvent.timestamp = newTimestamp;

    // Find the correct position to insert the event based on its new timestamp
    const insertIndex = updatedEvents.findIndex(event => event.timestamp > newTimestamp);
    if (insertIndex === -1) {
      updatedEvents.push(movedEvent);
    } else {
      updatedEvents.splice(insertIndex, 0, movedEvent);
    }

    setEvents(updatedEvents);
    saveEventsToBackend(updatedEvents);
  };

  const saveEventsToBackend = async (updatedEvents) => {
    try {
      const response = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEvents),
      });
      if (!response.ok) {
        throw new Error('Failed to save events');
      }
      console.log('Events saved successfully');
    } catch (error) {
      console.error('Error saving events:', error);
    }
  };

  useEffect(() => {
    fetchEventsFromBackend();
    const socket = io('http://localhost:5000');
    socket.on('connect', () => {
      console.log('Connected to backend');
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="App">
        <h1>Mitplan</h1>
        <div>
          <input
            type="number"
            value={timelineLength}
            onChange={(e) => setTimelineLength(Math.max(1, parseInt(e.target.value) || 1))}
            placeholder="Timeline Length"
            min="1"
          />
        </div>
        <form onSubmit={createEvent}>
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="Event Name"
            required
          />
          <input
            type="number"
            value={eventTimestamp}
            onChange={(e) => setEventTimestamp(Number(e.target.value))}
            placeholder="5"
            required
          />
          <button type="submit">Create Event</button>
        </form>
        <button onClick={clearEvents}>Clear Events</button>
        <div className="content">
          <CooldownPalette cooldowns={cooldowns} />
          <VerticalTimeline events={events} moveEvent={moveEvent} timelineLength={timelineLength} />
        </div>
      </div>
    </DndProvider>
  );
}

export default App;