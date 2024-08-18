import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import SheetComponent from './Sheet/Sheet';
import SheetNavigation from './SheetNavigation';
import { ContextMenuProvider } from './Shared/ContextMenu';
import RenameSheetModal from './Shared/RenameSheetModal';
import CopyToClipboard from './Shared/CopyToClipboard';
import { setActiveSheet, updateSheet } from '../store/mitplansSlice';
import { initializeSocket, joinMitplan } from '../store/socketService';
import RosterManagementModal from './Roster';

const Mitplan: React.FC = () => {
  const { mitplanId } = useParams<{ mitplanId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const mitplan = useSelector((state: RootState) => {
    // console.log('Current mitplans state:', state.mitplans);
    return state.mitplans[mitplanId!];
  });
  // console.log('Mitplan data:', mitplan);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [sheetToRename, setSheetToRename] = useState<string | null>(null);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);

  useEffect(() => {
    if (mitplan && !mitplan.activeSheetId && Object.keys(mitplan.sheets).length > 0) {
      dispatch(setActiveSheet({ mitplanId: mitplanId!, sheetId: Object.keys(mitplan.sheets)[0] }));
    }
  }, [mitplan, dispatch, mitplanId]);

  if (!mitplan) {
    return <div className="p-4 text-gray-600 dark:text-gray-400">Loading mitplan data...</div>;
  }

  const { sheets, activeSheetId } = mitplan;

  const handleRenameSheet = (newName: string) => {
    if (sheetToRename) {
      dispatch(updateSheet({
        mitplanId: mitplanId!,
        sheetId: sheetToRename,
        updates: { name: newName }
      }));
      setSheetToRename(null);
    }
    setIsRenameModalOpen(false);
  };
  return (
    <ContextMenuProvider>
      <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
        <div className="flex-shrink-0 p-4 flex justify-between items-center">
          <div>
            {/* <h1 className="text-4xl font-bold mb-1 text-gray-800 dark:text-white"></h1> */}
            <CopyToClipboard text={`${window.location.origin}/mitplan/${mitplanId}` || ''} popupText="Link copied!">
              <h1 className="text-4xl font-bold mb-0 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-0 py-1 inline-block">
                Mitplan: {mitplanId}
              </h1>
            </CopyToClipboard>
          </div>
          <button
            onClick={() => setIsRosterModalOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            Manage Roster
          </button>
        </div>
        <div className="flex-grow overflow-hidden">
          {activeSheetId && sheets[activeSheetId] && (
            <SheetComponent
              {...sheets[activeSheetId]}
              mitplanId={mitplanId!}
              sheetId={activeSheetId}
            />
          )}
        </div>
        <div className="flex-shrink-0 bg-gray-200 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700 p-0">
          <SheetNavigation
            mitplanId={mitplanId!}
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
      <RosterManagementModal
        isOpen={isRosterModalOpen}
        onClose={() => setIsRosterModalOpen(false)}
        mitplanId={mitplanId!}
      />
    </ContextMenuProvider>
  );
};

const MitplanWrapper: React.FC = () => {
  const { mitplanId } = useParams<{ mitplanId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mitplan = useSelector((state: RootState) => {
    return state.mitplans[mitplanId!];
  });
  // console.log('MitplanWrapper - Mitplan data:', mitplan);
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (mitplanId) {
      // console.log('Initializing socket...');
      initializeSocket((mitplanId, state) => {
        // console.log('Mitplan state updated:', mitplanId, state);
        dispatch({ type: 'mitplans/setMitplan', payload: { mitplanId, state } });
      });
      
      // console.log('Joining mitplan:', mitplanId);
      joinMitplan(mitplanId)
        .then(() => {
          // console.log('Successfully joined mitplan:', mitplanId);
          setLoading(false);
        })
        .catch((error: Error) => {
          console.error('Error joining mitplan:', error);
          setError(error.message || 'An error occurred while joining the mitplan');
          setLoading(false);
        });
    }
  }, [mitplanId, dispatch]);

  if (!mitplanId) {
    return <div className="p-4 text-red-600 dark:text-red-400">Error: Mitplan ID is missing</div>;
  }

  if (loading || !mitplan) {
    return <div className="p-4 text-gray-600 dark:text-gray-400">Loading mitplan data...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600 dark:text-red-400">Error: {error}</div>;
  }

  return <Mitplan />;
};

export default MitplanWrapper;