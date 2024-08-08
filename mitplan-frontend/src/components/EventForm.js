import React, { useState } from 'react';

const EventForm = ({ onSubmit, columnCount }) => {
  const [eventName, setEventName] = useState('');
  const [eventTimestamp, setEventTimestamp] = useState(1);
  const [eventColumn, setEventColumn] = useState(1);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ eventName, eventTimestamp, eventColumn });
    setEventName('');
    setEventTimestamp(5);
    setEventColumn(1);
  };

  return (
    <form onSubmit={handleSubmit}>
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
      <input
        type="number"
        value={eventColumn}
        onChange={(e) => setEventColumn(Math.max(1, parseInt(e.target.value) || 1))}
        placeholder="Column"
        min="1"
        max={columnCount}
        required
      />
      <button type="submit">Create Event</button>
    </form>
  );
};

export default EventForm;
