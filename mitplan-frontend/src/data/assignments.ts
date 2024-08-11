/* will use later when we rework TimelinmeEvent to MitplanEvent */


export interface AssignmentEventType {
    id: string;
    type: 'assignment' | 'cooldown' | 'text';
    title: string;
    description?: string;
    assignee?: string;
  }
  
  export interface CooldownEventType extends AssignmentEventType {
    type: 'cooldown';
    cooldownDuration: number; // in minutes
  }
  
  export interface TextEventType extends AssignmentEventType {
    type: 'text';
    content: string;
  }
  