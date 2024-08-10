import React, { useState } from 'react';
import SheetComponent from './Sheet';
import SheetNavigation from './SheetNavigation';
import { ContextMenuProvider } from './Shared/ContextMenu';
import RenameSheetModal from './Shared/RenameSheetModal';
import CopyToClipboard from './Shared/CopyToClipboard';
import { useTheme } from '../contexts/ThemeContext';
import { useRoomState } from '../state/RoomState';

const Room: React.FC = () => {
  const {
    roomId,
    sheets,
    activeSheetId,
    createSheet,
    switchSheet,
    deleteSheet,
    createEvent,
    clearEvents,
    updateEvent,
    updateEncounterEvents,
    deleteEvent,
    renameSheet,
  } = useRoomState();

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [sheetToRename, setSheetToRename] = useState<string | null>(null);
  const { darkMode } = useTheme();

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
                id={activeSheetId}
                name={sheets[activeSheetId].name}
                events={sheets[activeSheetId].events}
                timelineLength={sheets[activeSheetId].timelineLength}
                columnCount={sheets[activeSheetId].columnCount}
                encounterEvents={sheets[activeSheetId].encounterEvents}
                onCreateEvent={createEvent}
                onClearEvents={() => clearEvents(activeSheetId)}
                onUpdateEvent={(updatedEvent) => {
                  console.log('SheetComponent triggered onUpdateEvent:', updatedEvent);
                  updateEvent(activeSheetId, updatedEvent);
                }}
                onDeleteEvent={(eventKey) => deleteEvent(activeSheetId, eventKey)}
                onUpdateEncounterEvents={(encounterEvents) => updateEncounterEvents(activeSheetId, encounterEvents)}
              />
            )}
          </div>
        </div>
        <div className="bg-gray-200 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 p-2">
          <SheetNavigation
            sheets={Object.entries(sheets as Record<string, { name: string }>).map(([id, sheet]) => ({ id, name: sheet.name }))}
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