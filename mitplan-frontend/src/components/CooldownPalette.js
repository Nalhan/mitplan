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
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        width: '50px',
        height: '50px',
        margin: '4px',
        backgroundColor: cooldown.color,
        borderRadius: '5px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      title={`${cooldown.name} (${cooldown.duration}s)`}
    >
      {imageError ? (
        <span>{cooldown.name[0]}</span>
      ) : (
        <img 
          src={cooldown.icon} 
          alt={cooldown.name} 
          style={{ width: '44px', height: '44px' }} 
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
};

const CooldownPalette = () => {
  if (!cooldowns || !Array.isArray(cooldowns)) {
    console.error('Invalid cooldowns data:', cooldowns);
    return <div>Error: Invalid cooldowns data</div>;
  }

  return (
    <div className="cooldown-palette" style={{ width: '200px', padding: '10px' }}>
      <h3>Cooldowns</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0px' }}>
        {cooldowns.map((cooldown) => (
          <CooldownItem key={cooldown.id} cooldown={cooldown} />
        ))}
      </div>
    </div>
  );
};

export default CooldownPalette;