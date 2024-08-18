import React, { useMemo } from 'react';
import { useDrag } from 'react-dnd';
import { v4 as uuidv4 } from 'uuid';
import { Ability } from '../../data/ability';
import { CooldownEventType, Player, RootState } from '../../types';
import { classSpecs, classColors } from '../../data/classes';
import { useTheme } from '../../hooks/ThemeContext';
import { useSelector } from 'react-redux';
import { Tooltip } from 'flowbite-react';

interface CooldownIconProps {
  ability: Ability;
  player: Player;
  cooldownUses: { timestamp: number; endTimestamp: number }[];
  encounterLength: number;
  timeScale: number;
  scrollTop: number;
  topBufferHeight: number;
}

interface CooldownBarProps {
  cooldownUses: { timestamp: number; endTimestamp: number }[];
  encounterLength: number;
  timeScale: number;
  overlappingRegions: { start: number; end: number }[];
  topBufferHeight: number;
}

interface CooldownPaletteProps {
  mitplanId: string;
  sheetId: string;
  encounterLength: number;
  timeScale: number;
  scrollTop: number;
  topBufferHeight: number;
}

const CooldownIcon: React.FC<CooldownIconProps> = ({ player, ability, cooldownUses, encounterLength, timeScale, scrollTop, topBufferHeight }) => {
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

  return (
    <div className="flex flex-col items-center mr-2 relative w-8">
      <div 
        className={`sticky z-10 flex flex-col items-center w-8 top-0 p-1 ${
          darkMode 
            ? 'bg-gray-800' 
            : 'bg-gray-100'
        }`}
        style={{
          paddingTop: `${topBufferHeight}px`
        }}
      >
        <Tooltip
          content={`${ability.name} (${ability.cooldown}s)`}
          placement="top"
          trigger="hover"
          animation="duration-300"
          style={darkMode ? "dark" : "light"}
        >
          <div
            ref={drag}
            className={`w-8 h-8 mt-10 rounded cursor-move flex justify-center items-center hover:ring-2 hover:ring-inset hover:ring-blue-500 ${isDragging ? 'opacity-50' : ''} ${darkMode ? 'shadow-md shadow-gray-700' : 'shadow-sm shadow-gray-300'}`}
            style={{ 
              backgroundColor: classColors[player.class],
            }}
          >
            <img 
              src={`https://wow.zamimg.com/images/wow/icons/large/${ability.icon}.jpg`}
              alt={ability.name} 
              className="w-7 h-7 rounded"
            />
          </div>
        </Tooltip>
      </div>
      <div 
        className="absolute text-left text-m font-bold truncate origin-top-left z-20"
        style={{ 
          width: '78px',
          color: classColors[player.class],
          transform: 'rotate(-45deg) translateX(-50%)',
          left: '32px',
          top: `${topBufferHeight - 4}px`,
          textShadow: darkMode 
            ? '0px 0px 3px #000000, 0px 0px 3px #000000' 
            : '0px 0px 3px #ffffff, 0px 0px 3px #ffffff',
        }}
      >
        {player.name}
      </div>
    </div>
  );
};

const CooldownBar: React.FC<CooldownBarProps> = ({ cooldownUses, encounterLength, timeScale, overlappingRegions, topBufferHeight }) => {
  return (
    <div 
      className="w-8 rounded-sm bg-gray-300 relative" 
      style={{ 
        height: `${encounterLength * timeScale}px`,
        marginTop: `${topBufferHeight}px`,
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
  );
};

const CooldownPalette: React.FC<CooldownPaletteProps> = ({ mitplanId, sheetId, encounterLength, timeScale, scrollTop, topBufferHeight }) => {
  const { darkMode } = useTheme();
  const roster = useSelector((state: RootState) => state.mitplans.mitplans[mitplanId]?.roster);
  const assignmentEvents = useSelector((state: RootState) => state.mitplans.mitplans[mitplanId]?.sheets[sheetId]?.assignmentEvents);

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
    mitplanId,
    sheetId,
    encounterLength,
    timeScale,
    totalItems: cooldownItems.length,
    totalCooldownUses: cooldownItems.reduce((sum, item) => sum + item.cooldownUses.length, 0)
  });

  return (
    <div 
      className={`${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-900'} p-2 transition-colors duration-200 flex flex-col relative`}
      style={{ 
        height: `${encounterLength * timeScale + topBufferHeight + 48}px`,
        minHeight: '100%',
      }}
    >
      <div className="flex flex-col">
        <div className="flex sticky top-0 z-10 items-end" style={{ height: `${topBufferHeight}px`, paddingLeft: '10px' }}>
          {cooldownItems.map(({ player, ability, cooldownUses }) => (
            <CooldownIcon 
              key={`icon-${player.id}-${ability.id}`}
              player={player}
              ability={ability}
              cooldownUses={cooldownUses}
              encounterLength={encounterLength}
              timeScale={timeScale}
              scrollTop={scrollTop}
              topBufferHeight={topBufferHeight}
            />
          ))}
        </div>
        <div className="flex" style={{ paddingLeft: '10px' }}>
          {cooldownItems.map(({ player, ability, cooldownUses }) => (
            <div key={`bar-${player.id}-${ability.id}`} className="mr-2" style={{ width: '32px' }}>
              <CooldownBar
                cooldownUses={cooldownUses}
                encounterLength={encounterLength}
                timeScale={timeScale}
                overlappingRegions={[]}
                topBufferHeight={0}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CooldownPalette;