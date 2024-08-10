import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function RoomSelection() {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  const handleJoinRoom = () => {
    if (roomId) {
      navigate(`/room/${roomId}`);
    }
  };

  const handleCreateRoom = async () => {
    try {
      const response = await axios.post(`/api/rooms`);
      const { roomId } = response.data;
      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error('Error creating room:', error);
      // Handle error (e.g., show an error message to the user)
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold mb-8">Select or Create a Room</h1>
      <input
        type="text"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
        placeholder="Enter room ID"
        className="border border-gray-300 rounded px-4 py-2 mb-4 w-64"
      />
      <div className="flex space-x-4">
        <button
          onClick={handleJoinRoom}
          className="bg-blue-500 text-white px-6 py-2 rounded font-semibold"
        >
          Join Room
        </button>
        <button
          onClick={handleCreateRoom}
          className="bg-green-500 text-white px-6 py-2 rounded font-semibold"
        >
          Create Room
        </button>
      </div>
    </div>
  );
}

export default RoomSelection;