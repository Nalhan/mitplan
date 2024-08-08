import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function RoomSelection() {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const createRoom = async () => {
    const response = await fetch('http://localhost:5000/api/rooms', { method: 'POST' });
    const data = await response.json();
    navigate(`/room/${data.roomId}`);
  };

  const joinRoom = () => {
    if (roomId) {
      navigate(`/room/${roomId.toLowerCase().replace(/\s+/g, '-')}`);
    }
  };

  return (
    <div>
      <h1>Mitplan</h1>
      <button onClick={createRoom}>Create New Room</button>
      <div>
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Enter Room Name (e.g., loud-extroverted-penguin)"
        />
        <button onClick={joinRoom}>Join Room</button>
      </div>
    </div>
  );
}

export default RoomSelection;