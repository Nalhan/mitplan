import React, { useMemo } from 'react';
import { useDrag } from 'react-dnd';
import { v4 as uuidv4 } from 'uuid';
import { Ability } from '../../data/ability';
import { CooldownEventType, Player, RootState } from '../../types';
import { classSpecs } from '../../data/classes';
import { classColors } from '../../data/classes';
import { useTheme } from '../../hooks/ThemeContext';
import { useSelector } from 'react-redux';

interface CooldownItemProps {
  ability: Ability;
  player: Player;
  cooldownUses: { timestamp: number; endTimestamp: number }[];
  encounterLength: number;
  timeScale: number;
  scrollTop: number;
}

const CooldownItem: React.FC<CooldownItemProps> = ({ ability, player, cooldownUses, encounterLength, timeScale, scrollTop }) => {
  const { darkMode } = useTheme();
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'ASSIGNMENT_EVENT',
    item: (): CooldownEventType => ({
      id: uuidv4(),
      name: ability.name,
      timestamp: 0,
      columnId: 1,
      color: classColors[player.class],
      icon: ability.icon,
      type: 'cooldown',
      ability: ability,
      assignee: player.id,
    }),
    collect: (monitor) => ({ 
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const overlappingRegions = useMemo(() => {
    const regions: { start: number; end: number }[] = [];
    for (let i = 0; i < cooldownUses.length - 1; i++) {
      const current = cooldownUses[i];
      const next = cooldownUses[i + 1];
      if (current.endTimestamp > next.timestamp) {
        regions.push({
          start: next.timestamp,
          end: Math.min(current.endTimestamp, next.endTimestamp)
        });
      }
    }
    return regions;
  }, [cooldownUses]);

  return (
    <div className="flex flex-col items-center mr-2 pt-6">
      <div className="relative mb-1">
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 -rotate-45 origin-bottom-left text-xs font-semibold whitespace-nowrap overflow-hidden max-w-[80px] truncate">
          {player.name}
        </div>
        <div
          ref={drag}
          className={`w-8 h-8 rounded cursor-move flex justify-center items-center hover:ring-2 hover:ring-inset hover:ring-blue-500 ${isDragging ? 'opacity-50' : ''} ${darkMode ? 'shadow-md shadow-gray-700' : 'shadow-sm shadow-gray-300'}`}
          style={{ backgroundColor: classColors[player.class] }}
          title={`${player.name} - ${ability.name} (${ability.cooldown}s)`}
        >
          <img 
            src={`https://wow.zamimg.com/images/wow/icons/large/${ability.icon}.jpg`}
            alt={ability.name} 
            className="w-7 h-7 rounded"
          />
        </div>
      </div>
      <div 
        className="w-8 bg-gray-300 relative" 
        style={{ 
          height: `${encounterLength * timeScale}px`,
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            height: '100%',
            transform: `translateY(-${scrollTop}px)`,
          }}
        >
          {cooldownUses.map((use, index) => (
            <div 
              key={index}
              className="w-full bg-blue-500 absolute" 
              style={{ 
                top: `${use.timestamp * timeScale}px`,
                height: `${(use.endTimestamp - use.timestamp) * timeScale}px`,
                opacity: 0.7
              }}
            />
          ))}
          {overlappingRegions.map((region, index) => (
            <div
              key={`overlap-${index}`}
              className="w-full bg-red-500 absolute"
              style={{
                top: `${region.start * timeScale}px`,
                height: `${(region.end - region.start) * timeScale}px`,
                opacity: 0.7
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface CooldownPaletteProps {
  roomId: string;
  sheetId: string;
  encounterLength: number;
  timeScale: number;
  scrollTop: number;
}

const CooldownPalette: React.FC<CooldownPaletteProps> = ({ roomId, sheetId, encounterLength, timeScale, scrollTop }) => {
  const { darkMode } = useTheme();
  const roster = useSelector((state: RootState) => state.rooms[roomId]?.roster);
  const assignmentEvents = useSelector((state: RootState) => state.rooms[roomId]?.sheets[sheetId]?.assignmentEvents);

  const cooldownItems = useMemo(() => {
    const items: { 
      player: Player; 
      ability: Ability; 
      cooldownUses: { timestamp: number; endTimestamp: number }[] 
    }[] = [];

    Object.values(roster.players).forEach(player => {
      const spec = classSpecs[player.class][player.spec];
      spec.abilities
        .filter(ability => ability.cooldown > 0)
        .forEach(ability => {
          const cooldownEvents = Object.values(assignmentEvents)
            .filter((event): event is CooldownEventType => 
              event.type === 'cooldown' && 
              'ability' in event &&
              event.ability.id === ability.id && 
              event.assignee === player.id
            )
            .sort((a, b) => a.timestamp - b.timestamp);

          const cooldownUses = cooldownEvents.map(event => ({
            timestamp: event.timestamp,
            endTimestamp: Math.min(event.timestamp + ability.cooldown, encounterLength)
          }));

          items.push({
            player,
            ability,
            cooldownUses
          });
        });
    });

    // Log the cooldown uses for each ability
    items.forEach(item => {
      console.log(`Cooldown uses for ${item.player.name} - ${item.ability.name}:`, {
        cooldownDuration: item.ability.cooldown,
        uses: item.cooldownUses.map(use => ({
          start: use.timestamp,
          end: use.endTimestamp,
          duration: use.endTimestamp - use.timestamp
        }))
      });
    });

    return items;
  }, [roster, assignmentEvents, encounterLength]);

  // Log overall component props and data
  console.log('CooldownPalette - props and data:', {
    roomId,
    sheetId,
    encounterLength,
    timeScale,
    totalItems: cooldownItems.length,
    totalCooldownUses: cooldownItems.reduce((sum, item) => sum + item.cooldownUses.length, 0)
  });

  return (
    <div 
      className={`${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-900'} p-2 rounded-lg shadow-lg transition-colors duration-200 flex overflow-x-auto overflow-y-hidden`}
      style={{ 
        height: `${encounterLength * timeScale + 48}px`,
        minHeight: '100%'
      }}
    >
      {cooldownItems.map(({ player, ability, cooldownUses }) => (
        <CooldownItem 
          key={`${player.id}-${ability.id}`}
          player={player}
          ability={ability}
          cooldownUses={cooldownUses}
          encounterLength={encounterLength}
          timeScale={timeScale}
          scrollTop={scrollTop}
        />
      ))}
    </div>
  );
};

export default CooldownPalette;