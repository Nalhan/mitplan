import React from 'react';
import { useDrag } from 'react-dnd';

const CooldownItem = ({ cooldown }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'COOLDOWN',
    item: { ...cooldown },
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
        padding: '5px',
        margin: '5px',
        backgroundColor: cooldown.color,
        color: 'white',
        borderRadius: '5px',
      }}
    >
      {cooldown.name} ({cooldown.duration}s)
    </div>
  );
};

const CooldownPalette = ({ cooldowns }) => {
  return (
    <div className="cooldown-palette">
      <h3>Cooldown Palette</h3>
      {cooldowns.map((cooldown) => (
        <CooldownItem key={cooldown.id} cooldown={cooldown} />
      ))}
    </div>
  );
};

export default CooldownPalette;
