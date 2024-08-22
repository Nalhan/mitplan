import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { createMitplan } from '../store/mitplansSlice';
import { isEmpty } from 'lodash';

interface Mitplan {
  mitplanId: string;
  // Add other mitplan properties as needed
}

const Dashboard: React.FC = () => {
  const [mitplans, setMitplans] = useState<Mitplan[]>([]);
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMitplans = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/mitplans`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setMitplans(data);
        } else {
          console.error('Failed to fetch mitplans');
        }
      } catch (error) {
        console.error('Error fetching mitplans:', error);
      }
    };

    fetchMitplans();
  }, []);

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
    <div className="container mx-auto px-4 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
      <h1 className="text-4xl font-bold mb-8 text-gray-800 dark:text-gray-100">Welcome, {user?.username}!</h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-200">
        <h2 className="text-2xl font-semibold mb-6 text-gray-700 dark:text-gray-200">Your Mitplans</h2>
        {!isEmpty(mitplans) ? (
          <ul className="space-y-4">
            {mitplans.map((mitplan) => (
              <li key={mitplan.mitplanId} className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 transition-all duration-200 hover:shadow-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                <Link to={`/mitplan/${mitplan.mitplanId}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-lg font-medium transition-colors duration-200">
                  Mitplan: {mitplan.mitplanId}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 text-lg">You don't have any mitplans yet.</p>
        )}
        <button 
          onClick={handleCreateMitplan}
          className="mt-8 inline-block bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors duration-200 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Create New Mitplan
        </button>
      </div>
    </div>
  );
};

export default Dashboard;