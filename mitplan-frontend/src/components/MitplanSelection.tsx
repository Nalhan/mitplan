import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MitplanSelection: React.FC = () => {
  const [mitplanId, setMitplanId] = useState<string>('');
  const navigate = useNavigate();

  const handleJoinMitplan = (): void => {
    if (mitplanId) {
      navigate(`/mitplan/${mitplanId}`);
    }
  };

  const handleCreateMitplan = async (): Promise<void> => {
    try {
      const response = await axios.post<{ mitplanId: string }>(
        `${import.meta.env.VITE_BACKEND_URL}/api/mitplans`,
        {},
        { withCredentials: true }
      );
      const { mitplanId } = response.data;
      navigate(`/mitplan/${mitplanId}`);
    } catch (error) {
      console.error('Error creating mitplan:', error);
      // Handle error (e.g., show an error message to the user)
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-gray-900 text-black dark:text-white">
      <h1 className="text-6xl font-bold mb-12 text-center">Mitplan</h1>
      <div className="flex flex-col items-center">
        <h2 className="text-3xl font-semibold mb-8">Select or Create a Mitplan</h2>
        <input
          type="text"
          value={mitplanId}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMitplanId(e.target.value)}
          placeholder="Enter mitplan ID"
          className="border rounded px-4 py-2 mb-4 w-64 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-black dark:text-white"
        />
        <div className="flex space-x-4">
          <button
            onClick={handleJoinMitplan}
            className="px-6 py-2 rounded font-semibold bg-blue-500 dark:bg-blue-700 text-white"
          >
            Join Mitplan
          </button>
          <button
            onClick={handleCreateMitplan}
            className="px-6 py-2 rounded font-semibold bg-green-500 dark:bg-green-700 text-white"
          >
            Create Mitplan
          </button>
        </div>
      </div>
    </div>
  );
};

export default MitplanSelection;