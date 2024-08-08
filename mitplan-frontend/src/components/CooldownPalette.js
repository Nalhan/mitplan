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
      isNew: true
    },
    collect: (monitor) => ({ 
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        padding: '10px',
        margin: '5px',
        backgroundColor: cooldown.color,
        color: 'white',
        borderRadius: '5px',
        textAlign: 'center',
      }}
    >
      {cooldown.name}
      <br />
      ({cooldown.duration}s)
    </div>
  );
};

const CooldownPalette = () => {
  if (!cooldowns || !Array.isArray(cooldowns)) {
    console.error('Invalid cooldowns data:', cooldowns);
    return <div>Error: Invalid cooldowns data</div>;
  }

  return (
    <div className="cooldown-palette" style={{ width: '150px', padding: '10px' }}>
      <h3>Cooldowns</h3>
      {cooldowns.map((cooldown) => (
        <CooldownItem key={cooldown.id} cooldown={cooldown} />
      ))}
    </div>
  );
};

export default CooldownPalette;