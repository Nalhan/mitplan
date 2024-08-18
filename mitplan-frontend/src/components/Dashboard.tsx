import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface Mitplan {
  mitplanId: string;
  // Add other mitplan properties as needed
}

const Dashboard: React.FC = () => {
  const [mitplans, setMitplans] = useState<Mitplan[]>([]);
  const user = useSelector((state: RootState) => state.auth.user);

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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Welcome, {user?.username}!</h1>
      <h2 className="text-2xl font-semibold mb-4">Your Mitplans</h2>
      {mitplans.length > 0 ? (
        <ul className="space-y-4">
          {mitplans.map((mitplan) => (
            <li key={mitplan.mitplanId} className="bg-white shadow rounded-lg p-4">
              <Link to={`/mitplan/${mitplan.mitplanId}`} className="text-blue-600 hover:underline">
                Mitplan: {mitplan.mitplanId}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>You don't have any mitplans yet.</p>
      )}
      <Link to="/create-mitplan" className="mt-6 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        Create New Mitplan
      </Link>
    </div>
  );
};

export default Dashboard;