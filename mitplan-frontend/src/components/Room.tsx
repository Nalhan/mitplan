import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import SheetComponent from './Sheet';
import SheetNavigation from './SheetNavigation';
import { ContextMenuProvider } from './Shared/ContextMenu';
import RenameSheetModal from './Shared/RenameSheetModal';
import CopyToClipboard from './Shared/CopyToClipboard';
import { useTheme } from '../contexts/ThemeContext';

interface Event {
  key: string;
  name: string;
  timestamp: number;
  columnId: number;
  duration?: number;
  color?: string;
  icon?: string;
}

interface RoomParams {
  roomId: string;
}

const Room: React.FC = () => {
  const { roomId } = useParams<keyof RoomParams>();
  const navigate = useNavigate();
  const location = useLocation();
  const [sheets, setSheets] = useState<{ [sheetId: string]: { name: string, events: Event[], timelineLength: number, columnCount: number } }>({});
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [sheetToRename, setSheetToRename] = useState<string | null>(null);
  const { darkMode } = useTheme();

  const formatSheets = (sheets: { [sheetId: string]: { name: string, events: Event[], settings: { timelineLength: number, columnCount: number } } }): { [sheetId: string]: { name: string, events: Event[], timelineLength: number, columnCount: number } } => {
    return Object.entries(sheets).reduce((acc, [sheetId, sheet]) => ({
      ...acc,
      [sheetId]: { 
        name: sheet.name,
        events: sheet.events, 
        timelineLength: sheet.settings.timelineLength, 
        columnCount: sheet.settings.columnCount 
      }
    }), {});
  };

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_BACKEND_URL as string);
    
    newSocket.on('connect', () => {
      console.log('Connected to backend');
      newSocket.emit('joinRoom', roomId);
    });

    newSocket.on('initialState', (data: { sheets?: { [sheetId: string]: { name: string, events: Event[], settings: { timelineLength: number, columnCount: number } } } }) => {
      if (data.sheets) {
        const formattedSheets = formatSheets(data.sheets);
        setSheets(formattedSheets);
        
        const hashSheetId = location.hash.slice(1);
        if (hashSheetId && formattedSheets[hashSheetId]) {
          setActiveSheetId(hashSheetId);
        } else if (Object.keys(formattedSheets).length > 0) {
          setActiveSheetId(Object.keys(formattedSheets)[0]);
        }
      }
    });

    newSocket.on('stateUpdate', ((data: { sheets?: { [sheetId: string]: { name: string, events: Event[], settings: { timelineLength: number, columnCount: number } } } }) => {
      if (data.sheets) setSheets(formatSheets(data.sheets));
    }) as any);

    newSocket.on('error', (error: string) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, location.hash]);

  useEffect(() => {
    // Update URL hash when active sheet changes
    if (activeSheetId) {
      navigate(`#${activeSheetId}`, { replace: true });
    }
  }, [activeSheetId, navigate]);

  const createSheet = (sheetId: string) => {
    if (!socket) return;
    socket.emit('createSheet', roomId, sheetId);
  };

  const switchSheet = (sheetId: string) => {
    setActiveSheetId(sheetId);
  };

  const deleteSheet = (sheetId: string) => {
    if (!socket) return;
    socket.emit('deleteSheet', roomId, sheetId);
  };

  const createEvent = (newEvent: Event) => {
    if (!socket || !activeSheetId) return;
    socket.emit('createEvent', roomId, activeSheetId, newEvent);
  };

  const clearEvents = (sheetId: string) => {
    if (!socket) return;
    socket.emit('clearEvents', roomId, sheetId);
  };

  const updateEvent = (sheetId: string, updatedEvent: Event) => {
    console.log('Attempting to update event:', { sheetId, updatedEvent });
    if (!socket) {
      console.error('Socket is not connected');
      return;
    }
    if (!socket.connected) {
      console.error('Socket is not in connected state');
      return;
    }
    socket.emit('updateEvent', roomId, sheetId, updatedEvent, (error: any) => {
      if (error) {
        console.error('Error updating event:', error);
      } else {
        console.log('Event update emitted successfully');
      }
    });
  };

  const deleteEvent = (sheetId: string, eventKey: string) => {
    if (!socket) return;
    console.log(`Deleting event: sheetId=${sheetId}, eventKey=${eventKey}`);
    socket.emit('deleteEvent', roomId, sheetId, eventKey);
  };

  const renameSheet = (sheetId: string, newName: string) => {
    if (!socket) return;
    socket.emit('renameSheet', roomId, sheetId, newName);
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
          {activeSheetId && sheets[activeSheetId] && (
            <SheetComponent
              id={activeSheetId}
              name={sheets[activeSheetId].name}
              events={sheets[activeSheetId].events}
              timelineLength={sheets[activeSheetId].timelineLength}
              columnCount={sheets[activeSheetId].columnCount}
              onCreateEvent={createEvent}
              onClearEvents={() => clearEvents(activeSheetId)}
              onUpdateEvent={(updatedEvent) => {
                console.log('SheetComponent triggered onUpdateEvent:', updatedEvent);
                updateEvent(activeSheetId, updatedEvent);
              }}
              onDeleteEvent={(eventKey) => deleteEvent(activeSheetId, eventKey)}
            />
          )}
        </div>
        <div className="bg-gray-200 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 p-2">
          <SheetNavigation
            sheets={Object.entries(sheets).map(([id, sheet]) => ({ id, name: sheet.name }))}
            currentSheetId={activeSheetId ?? ''}
            onSheetChange={switchSheet}
            onCreateSheet={() => createSheet(`sheet-${Date.now()}`)}
            onRenameSheet={(sheetId) => {
              setSheetToRename(sheetId);
              setIsRenameModalOpen(true);
            }}
            onDeleteSheet={deleteSheet}
          />
        </div>
      </div>
      <RenameSheetModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        onRename={(newName: string) => {
          if (sheetToRename) {
            renameSheet(sheetToRename, newName);
            setSheetToRename(null);
          }
        }}
      />
    </ContextMenuProvider>
  );
};

export default Room;