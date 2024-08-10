import React from 'react';
import { useDrag } from 'react-dnd';
import cooldowns from '../data/cooldowns.yaml';

const CooldownItem = ({ cooldown }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TIMELINE_EVENT',
    item: { 
      id: `new_${cooldown.id}`,
      name: cooldown.name,
      duration: cooldown.duration,
      color: cooldown.color,
      icon: cooldown.icon,
      isNew: true
    },
    collect: (monitor) => ({ 
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const [imageError, setImageError] = React.useState(false);

  return (
    <div
      ref={drag}
      className={`w-12 h-12 m-1 rounded cursor-move flex justify-center items-center ${isDragging ? 'opacity-50' : ''}`}
      style={{ backgroundColor: cooldown.color }}
      title={`${cooldown.name} (${cooldown.duration}s)`}
    >
      {imageError ? (
        <span className="text-white font-bold">{cooldown.name[0]}</span>
      ) : (
        <img 
          src={cooldown.icon} 
          alt={cooldown.name} 
          className="w-11 h-11"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
};

const CooldownPalette = () => {
  return (
    <div className="bg-gray-100 p-4 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Cooldowns</h2>
      <div className="flex flex-wrap justify-center">
        {cooldowns.map((cooldown) => (
          <CooldownItem key={cooldown.id} cooldown={cooldown} />
        ))}
      </div>
    </div>
  );
};

export default CooldownPalette;