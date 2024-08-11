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
import { setActiveSheet, updateSheet, fetchRoomData, listenForStateUpdates } from '../store/roomsSlice';
import { initializeSocket } from '../store/socketService';

interface RoomProps {
  roomId: string;
}

const Room: React.FC<RoomProps> = ({ roomId }) => {
  const dispatch = useDispatch();
  const room = useSelector((state: RootState) => state.rooms[roomId]);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [sheetToRename, setSheetToRename] = useState<string | null>(null);
  const { darkMode } = useTheme();

  useEffect(() => {
    if (room && !room.activeSheetId && Object.keys(room.sheets).length > 0) {
      dispatch(setActiveSheet({ roomId, sheetId: Object.keys(room.sheets)[0] }));
    }
  }, [room, dispatch, roomId]);

  if (!room) {
    return <div className="p-4 text-gray-600">Loading room data...</div>;
  }

  const { sheets, activeSheetId } = room;

  const handleRenameSheet = (newName: string) => {
    if (sheetToRename) {
      dispatch(updateSheet({
        roomId,
        updates: { [sheetToRename]: { name: newName } }
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
          <CopyToClipboard text={`${window.location.origin}/room/${roomId}` || ''} popupText="Link copied!">
            <h2 className="text-2xl font-bold mb-0 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-0 py-1 inline-block">
              Room: {roomId}
            </h2>
          </CopyToClipboard>
          <div className="mt-4">
            {activeSheetId && sheets[activeSheetId] && (
              <SheetComponent
                {...sheets[activeSheetId]}
                roomId={roomId}
                sheetId={activeSheetId}
              />
            )}
          </div>
        </div>
        <div className="bg-gray-200 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 p-2">
          <SheetNavigation
            roomId={roomId}
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

  useEffect(() => {
    if (roomId) {
      console.log('trying to fetch room', roomId);
      const socket = initializeSocket();
      dispatch(fetchRoomData({ roomId, socket }));
      dispatch(listenForStateUpdates(socket));
    }
  }, [roomId, dispatch]);

  if (!roomId) {
    return <div className="p-4 text-red-600">Error: Room ID is missing</div>;
  }

  return <Room roomId={roomId} />;
};

export default RoomWrapper;