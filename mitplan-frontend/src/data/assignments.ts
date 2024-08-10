export interface AssignmentEvent {
    id: string;
    type: 'assignment' | 'cooldown' | 'text';
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
  }
  
  export interface CooldownEvent extends AssignmentEvent {
    type: 'cooldown';
    cooldownDuration: number; // in minutes
  }
  
  export interface TextEvent extends AssignmentEvent {
    type: 'text';
    content: string;
  }
  