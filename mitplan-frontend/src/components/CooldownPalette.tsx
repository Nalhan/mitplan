import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { v4 as uuidv4 } from 'uuid';
import { Ability } from '../data/ability';
import { CooldownEventType } from '../types';
import { classSpecs, WowClass, ClassSpec, classColors } from '../data/classes';
import { useTheme } from '../contexts/ThemeContext';

interface CooldownItemProps {
  ability: Ability;
  classColor: string;
}

const CooldownItem: React.FC<CooldownItemProps> = ({ ability, classColor }) => {
  const { darkMode } = useTheme();
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'ASSIGNMENT_EVENT',
    item: (): CooldownEventType => ({
      id: uuidv4(),
      name: ability.name,
      timestamp: 0,
      columnId: 1,
      color: classColor,
      icon: ability.icon,
      type: 'cooldown',
      ability: ability,
    }),
    collect: (monitor) => ({ 
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const [imageError, setImageError] = useState(false);

  return (
    <div
      ref={drag}
      className={`w-12 h-12 m-1 rounded cursor-move flex justify-center items-center ${isDragging ? 'opacity-50' : ''} ${darkMode ? 'shadow-md shadow-gray-700' : 'shadow-sm shadow-gray-300'}`}
      style={{ backgroundColor: classColor }}
      title={`${ability.name} (${ability.cooldown}s)`}
    >
      {imageError ? (
        <span className="text-white font-bold">{ability.name[0]}</span>
      ) : (
        <img 
          src={`https://wow.zamimg.com/images/wow/icons/large/${ability.icon}.jpg`}
          alt={ability.name} 
          className="w-11 h-11 rounded"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
};

const CooldownPalette: React.FC = () => {
  const { darkMode } = useTheme();
  const cooldownAbilities: Ability[] = [];

  Object.entries(classSpecs).forEach(([className, specs]) => {
    Object.entries(specs).forEach(([specName, specDetails]) => {
      specDetails.abilities
        .filter(ability => ability.cooldown > 0)
        .forEach(ability => {
          cooldownAbilities.push({
            ...ability,
            associatedClass: className as WowClass,
            associatedSpec: specName as ClassSpec
          });
        });
    });
  });

  return (
    <div className={`${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-gray-100 text-gray-900'} p-4 rounded-lg shadow-lg transition-colors duration-200`}>
      <h2 className="text-xl font-bold mb-4">Cooldowns</h2>
      <div className="flex flex-wrap justify-center">
        {cooldownAbilities.map((ability) => (
          <CooldownItem 
            key={ability.id} 
            ability={ability} 
            classColor={classColors[ability.associatedClass!]}
          />
        ))}
      </div>
    </div>
  );
};

export default CooldownPalette;