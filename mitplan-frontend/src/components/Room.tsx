import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import SheetComponent from './Sheet';
import SheetNavigation from './SheetNavigation';
import { ContextMenuProvider } from './Shared/ContextMenu';
import RenameSheetModal from './Shared/RenameSheetModal';
import CopyToClipboard from './Shared/CopyToClipboard';
import { useTheme } from '../contexts/ThemeContext';
import { setActiveSheet, updateSheet } from '../store/roomsSlice';
import { initializeSocket, joinRoom } from '../store/socketService';


const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const room = useSelector((state: RootState) => {
    // console.log('Current rooms state:', state.rooms);
    return state.rooms[roomId!];
  });
  // console.log('Room data:', room);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [sheetToRename, setSheetToRename] = useState<string | null>(null);
  const { darkMode } = useTheme();

  useEffect(() => {
    if (room && !room.activeSheetId && Object.keys(room.sheets).length > 0) {
      dispatch(setActiveSheet({ roomId: roomId!, sheetId: Object.keys(room.sheets)[0] }));
    }
  }, [room, dispatch, roomId]);

  if (!room) {
    return <div className="p-4 text-gray-600">Loading room data...</div>;
  }

  const { sheets, activeSheetId } = room;

  const handleRenameSheet = (newName: string) => {
    if (sheetToRename) {
      dispatch(updateSheet({
        roomId: roomId!,
        sheetId: sheetToRename,
        updates: { name: newName }
      }));
      setSheetToRename(null);
    }
    setIsRenameModalOpen(false);
  };
  return (
    <ContextMenuProvider>
      <div className={`flex flex-col h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
        <div className="flex-shrink-0 p-4">
          <h1 className={`text-4xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Mitplan</h1>
          <CopyToClipboard text={`${window.location.origin}/room/${roomId}` || ''} popupText="Link copied!">
            <h2 className={`text-2xl font-bold mb-0 ${darkMode ? 'text-white hover:bg-gray-800' : 'text-gray-800 hover:bg-gray-100'} rounded px-0 py-1 inline-block`}>
              Room: {roomId}
            </h2>
          </CopyToClipboard>
        </div>
        <div className="flex-grow overflow-hidden">
          {activeSheetId && sheets[activeSheetId] && (
            <SheetComponent
              {...sheets[activeSheetId]}
              roomId={roomId!}
              sheetId={activeSheetId}
            />
          )}
        </div>
        <div className={`flex-shrink-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-200 border-gray-300'} border-t p-0`}>
          <SheetNavigation
            roomId={roomId!}
            onRenameSheet={(sheetId) => {
              setSheetToRename(sheetId);
              setIsRenameModalOpen(true);
            }}
          />
        </div>
      </div>
      <RenameSheetModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        onRename={handleRenameSheet}
      />
    </ContextMenuProvider>
  );
};

const RoomWrapper: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const room = useSelector((state: RootState) => {
    // console.log('RoomWrapper - Current rooms state:', state.rooms);
    return state.rooms[roomId!];
  });
  // console.log('RoomWrapper - Room data:', room);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (roomId) {
      // console.log('Initializing socket...');
      initializeSocket((roomId, state) => {
        // console.log('Room state updated:', roomId, state);
        dispatch({ type: 'rooms/setRoom', payload: { roomId, state } });
      });
      
      // console.log('Joining room:', roomId);
      joinRoom(roomId)
        .then(() => {
          // console.log('Successfully joined room:', roomId);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error joining room:', error);
          setError(error.message || 'An error occurred while joining the room');
          setLoading(false);
        });
    }
  }, [roomId, dispatch]);

  if (!roomId) {
    return <div className="p-4 text-red-600">Error: Room ID is missing</div>;
  }

  if (loading || !room) {
    return <div className="p-4 text-gray-600">Loading room data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return <Room />;
};

export default RoomWrapper;