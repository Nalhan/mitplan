import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const RoomSelection: React.FC = () => {
  const [roomId, setRoomId] = useState<string>('');
  const navigate = useNavigate();

  const handleJoinRoom = (): void => {
    if (roomId) {
      navigate(`/room/${roomId}`);
    }
  };

  const handleCreateRoom = async (): Promise<void> => {
    try {
      const response = await axios.post<{ roomId: string }>(`/api/rooms`);
      const { roomId } = response.data;
      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error('Error creating room:', error);
      // Handle error (e.g., show an error message to the user)
    }
  };
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-gray-900 text-black dark:text-white">
      <h1 className="text-6xl font-bold mb-12 text-center">Mitplan</h1>
      <div className="flex flex-col items-center">
        <h2 className="text-3xl font-semibold mb-8">Select or Create a Room</h2>
        <input
          type="text"
          value={roomId}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomId(e.target.value)}
          placeholder="Enter room ID"
          className="border rounded px-4 py-2 mb-4 w-64 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-black dark:text-white"
        />
        <div className="flex space-x-4">
          <button
            onClick={handleJoinRoom}
            className="px-6 py-2 rounded font-semibold bg-blue-500 dark:bg-blue-700 text-white"
          >
            Join Room
          </button>
          <button
            onClick={handleCreateRoom}
            className="px-6 py-2 rounded font-semibold bg-green-500 dark:bg-green-700 text-white"
          >
            Create Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomSelection;