import React, { useState, FormEvent, ChangeEvent } from 'react';

interface EventFormProps {
  onSubmit: (formData: { eventName: string; eventTimestamp: number; eventColumn: number }) => void;
  columnCount: number;
}

const EventForm: React.FC<EventFormProps> = ({ onSubmit, columnCount }) => {
  const [eventName, setEventName] = useState<string>('');
  const [eventTimestamp, setEventTimestamp] = useState<number>(1);
  const [eventColumn, setEventColumn] = useState<number>(1);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
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
        onChange={(e: ChangeEvent<HTMLInputElement>) => setEventName(e.target.value)}
        placeholder="Event Name"
        required
      />
      <input
        type="number"
        value={eventTimestamp}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setEventTimestamp(Number(e.target.value))}
        placeholder="5"
        required
      />
      <input
        type="number"
        value={eventColumn}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setEventColumn(Math.max(1, parseInt(e.target.value) || 1))}
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