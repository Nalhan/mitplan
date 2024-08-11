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
import { setActiveSheet, updateSheet, setRoom } from '../store/roomsSlice';
import { initializeSocket, joinRoom } from '../store/socketService';

interface RoomProps {
  room: NonNullable<RootState['room']>;
}

const Room: React.FC<RoomProps> = ({ room }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [sheetToRename, setSheetToRename] = useState<string | null>(null);
  const { darkMode } = useTheme();

  useEffect(() => {
    if (room && !room.activeSheetId && Object.keys(room.sheets).length > 0) {
      dispatch(setActiveSheet(Object.keys(room.sheets)[0]));
    }
  }, [room, dispatch]);

  const { sheets, activeSheetId } = room;

  const handleRenameSheet = (newName: string) => {
    if (sheetToRename) {
      dispatch(updateSheet({
        sheetId: sheetToRename,
        updates: { name: newName }
      }));
      setSheetToRename(null);
    }
    setIsRenameModalOpen(false);
  };

  return (
    <ContextMenuProvider>
      <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
        <div className="flex-grow overflow-auto p-4">
          <h1 className="text-4xl font-bold mb-1 text-gray-800 dark:text-gray-200">Mitplan</h1>
          <CopyToClipboard text={`${window.location.origin}/room/${room.id}` || ''} popupText="Link copied!">
            <h2 className="text-2xl font-bold mb-0 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-0 py-1 inline-block">
              Room: {room.id}
            </h2>
          </CopyToClipboard>
          <div className="mt-4">
            {activeSheetId && sheets[activeSheetId] && (
              <SheetComponent
                {...sheets[activeSheetId]}
                roomId={room.id}
                sheetId={activeSheetId}
              />
            )}
          </div>
        </div>
        <div className="bg-gray-200 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 p-2">
          <SheetNavigation
            roomId={room.id}
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
  const dispatch = useDispatch<AppDispatch>();
  const room = useSelector((state: RootState) => state.room);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roomId) {
      const socket = initializeSocket();
      
      joinRoom(roomId)
        .then((roomData) => {
          dispatch(setRoom(roomData));
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error joining room:', error);
          setLoading(false);
        });

      // return () => {
      //   socket.emit('leaveRoom', roomId);
      // };
    }
  }, [roomId, dispatch]);

  if (!roomId) {
    return <div className="p-4 text-red-600">Error: Room ID is missing</div>;
  }

  if (loading) {
    return <div className="p-4 text-gray-600">Loading room data...</div>;
  }

  return room ? <Room room={room} /> : <div className="p-4 text-gray-600">Room not found</div>;
};

export default RoomWrapper;