import React, { useState, KeyboardEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addPlayerToRoster, removePlayersFromRoster, updatePlayer } from '../store/mitplansSlice';
import { RootState, Player, RosterState, ROSTER_STATES } from '../types';
import { WowClass, WowSpec, classSpecs } from '../data/classes';
import { ZamIcon } from './Shared/ZamIcon';
import { Popover } from '@headlessui/react';
import { useFloating, offset, flip, shift } from '@floating-ui/react-dom';

interface RosterManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  mitplanId: string;
}

const RosterManagementModal: React.FC<RosterManagementModalProps> = ({ isOpen, onClose, mitplanId }) => {
  const dispatch = useDispatch();
  const mitplan = useSelector((state: RootState) => state.mitplans.mitplans[mitplanId]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerClass, setNewPlayerClass] = useState<WowClass>('Warrior');
  const [newPlayerSpec, setNewPlayerSpec] = useState<WowSpec>('Arms');

  const handleClassChange = (newClass: WowClass) => {
    setNewPlayerClass(newClass);
    setNewPlayerSpec(Object.keys(classSpecs[newClass])[0] as WowSpec);
  };

  const handleAddPlayer = () => {
    if (newPlayerName) {
      dispatch(addPlayerToRoster({ mitplanId, name: newPlayerName, class: newPlayerClass, spec: newPlayerSpec }));
      setNewPlayerName('');
    }
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleAddPlayer();
    }
  };

  const handleRemovePlayer = (playerId: string) => {
    dispatch(removePlayersFromRoster({ mitplanId, playerIds: playerId }));
  };

  const getRosterStateStyle = (state: RosterState | undefined): string => {
    switch (state) {
      case 'in':
        return 'bg-green-500 text-white dark:bg-green-600';
      case 'tentative':
        return 'bg-yellow-500 text-white dark:bg-yellow-600';
      case 'bench':
        return 'bg-blue-500 text-white dark:bg-blue-600';
      case 'unavailable':
        return 'bg-red-500 text-white dark:bg-red-600';
      case 'out':
      default:
        return 'bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-300';
    }
  };

  const handleSetRosterState = (playerId: string, sheetId: string, state: RosterState) => {
    const player = mitplan.roster.players[playerId];
    dispatch(updatePlayer({ 
      mitplanId, 
      playerId, 
      updates: { 
        rosterStates: { 
          ...(player.rosterStates || {}), 
          [sheetId]: state 
        } 
      } 
    }));
  };

  const RosterStatePopover = ({ player, sheetId }: { player: Player; sheetId: string }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const { x, y, refs, strategy } = useFloating({
      placement: 'bottom',
      middleware: [offset(5), flip(), shift()],
    });

    return (
      <Popover className="relative inline-block text-left w-full h-full">
        <Popover.Button
          ref={refs.setReference}
          className={`w-full h-full px-2 py-1 text-xs rounded flex items-center justify-center ${getRosterStateStyle(player.rosterStates?.[sheetId])}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {player.rosterStates?.[sheetId] || 'Out'}
        </Popover.Button>

        {isOpen && (
          <Popover.Panel
            ref={refs.setFloating}
            style={{
              position: strategy,
              top: y ?? 0,
              left: x ?? 0,
              width: 'var(--reference-width)',
            }}
            className="z-10 bg-gray-100 dark:bg-gray-700 rounded-md ring-1 ring-black ring-opacity-5 focus:outline-none"
          >
            <div className="py-2 px-1">
              {ROSTER_STATES.map((state) => (
                <button
                  key={state}
                  className={`${getRosterStateStyle(state)} group flex w-full items-center justify-center px-3 py-2 text-sm rounded-md mb-1`}
                  onClick={() => {
                    handleSetRosterState(player.id, sheetId, state);
                    setIsOpen(false);
                  }}
                >
                  {state}
                </button>
              ))}
            </div>
          </Popover.Panel>
        )}
      </Popover>
    );
  };

  if (!isOpen) {
    return null;
  }

  if (!mitplan || !mitplan.roster) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-4/5 h-4/5">
          <h2 className="text-2xl font-bold mb-4 dark:text-white">Roster Management</h2>
          <p className="dark:text-gray-300">Loading roster data...</p>
          <button
            onClick={onClose}
            className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const playerCount = Object.keys(mitplan.roster.players || {}).length;

  const categorizedPlayers = Object.values(mitplan.roster.players || {}).reduce((acc, player: Player) => {
    const role = classSpecs[player.class][player.spec].role;
    const melee = classSpecs[player.class][player.spec].melee;
    
    if (role === 'Tank') {
      acc.tanks.push(player);
    } else if (role === 'Healer') {
      acc.healers.push(player);
    } else if (role === 'Damage') {
      if (melee) {
        acc.meleeDps.push(player);
      } else {
        acc.rangedDps.push(player);
      }
    }
    return acc;
  }, { tanks: [], healers: [], meleeDps: [], rangedDps: [] } as Record<string, Player[]>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-4/5 h-4/5 flex flex-col">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">Roster Management</h2>
        
        {/* Add new player form */}
        <div className="mb-4 flex space-x-2 items-center">
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Player Name"
            className="border rounded px-2 py-1 flex-grow max-w-[240px] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <ZamIcon
            icon={classSpecs[newPlayerClass][newPlayerSpec].icon}
            size={32}
            className="border border-black mr-2"
          />
          <select
            value={newPlayerClass}
            onChange={(e) => handleClassChange(e.target.value as WowClass)}
            className="border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {Object.keys(classSpecs).map((wowClass) => (
              <option key={wowClass} value={wowClass}>{wowClass}</option>
            ))}
          </select>
          <select
            value={newPlayerSpec}
            onChange={(e) => setNewPlayerSpec(e.target.value as WowSpec)}
            className="border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            {Object.keys(classSpecs[newPlayerClass]).map((spec) => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
          <button
            onClick={handleAddPlayer}
            className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            Add Player
          </button>
        </div>

        {playerCount === 0 ? (
            <p className="text-center text-gray-600 dark:text-gray-400 my-4">
            No players in the roster. Add a player to get started!
          </p>
        ) : (
          <div className="overflow-y-auto flex-grow">
            <div className="grid gap-2" style={{ gridTemplateColumns: `auto repeat(${Object.keys(mitplan.sheets).length}, minmax(80px, 1fr)) auto` }}>
              <div></div>
              {Object.keys(mitplan.sheets).map((sheetId) => (
                <div key={sheetId} className="text-center">
                  <span className="text-sm font-medium mb-1 dark:text-white">{mitplan.sheets[sheetId].name}</span>
                </div>
              ))}
              <div></div>
              {['tanks', 'healers', 'meleeDps', 'rangedDps'].map((category) => (
                <React.Fragment key={category}>
                  <h3 className="text-xl font-semibold mb-2 dark:text-white col-span-full">
                    {category === 'meleeDps' ? 'Melee' :
                     category === 'rangedDps' ? 'Ranged' :
                     category.charAt(0).toUpperCase() + category.slice(1)}
                  </h3>
                  {categorizedPlayers[category].map((player: Player) => (
                    <React.Fragment key={player.id}>
                      <div className="flex items-center justify-between bg-white dark:bg-gray-700 p-2 rounded shadow">
                        <div className="flex items-center">
                          <div className="border border-black mr-2 h-full flex items-center">
                            <ZamIcon
                              icon={classSpecs[player.class][player.spec].icon}
                              size={24}
                              className="flex-shrink-0"
                            />
                          </div>
                          <span className="font-semibold dark:text-white">{player.name}</span>
                        </div>
                        <span className="text-gray-600 dark:text-gray-300 ml-2 hidden sm:inline">
                          {player.class} - {player.spec}
                        </span>
                      </div>
                      {Object.keys(mitplan.sheets).map((sheetId) => (
                        <RosterStatePopover key={sheetId} player={player} sheetId={sheetId} />
                      ))}
                      <button
                        onClick={() => handleRemovePlayer(player.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default RosterManagementModal;