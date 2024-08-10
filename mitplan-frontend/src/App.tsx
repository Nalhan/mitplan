import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import RoomSelection from './components/RoomSelection';
import Room from './components/Room';

const App: React.FC = () => {
  return (
    <Router>
      <div className="App bg-gray-100 min-h-screen">
        <Routes>
          <Route path="/" element={<RoomSelection />} />
          <Route path="/room/:roomId" element={<Room />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;