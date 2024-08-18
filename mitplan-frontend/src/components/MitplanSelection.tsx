import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { createMitplan } from '../store/mitplansSlice';

const MitplanSelection: React.FC = () => {
  const [mitplanId, setMitplanId] = useState<string>('');
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const error = useSelector((state: RootState) => state.mitplans.error);

  const handleJoinMitplan = (): void => {
    if (mitplanId) {
      navigate(`/mitplan/${mitplanId}`);
    }
  };

  const handleCreateMitplan = async (): Promise<void> => {
    try {
      const resultAction = await dispatch(createMitplan());
      if (createMitplan.fulfilled.match(resultAction)) {
        navigate(`/mitplan/${resultAction.payload.mitplanId}`);
      }
    } catch (err) {
      console.error('Failed to create mitplan:', err);
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
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default MitplanSelection;