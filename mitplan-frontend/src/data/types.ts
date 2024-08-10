export interface EncounterEventType {
    id: number;
    name: string;
    simple_name?: string;
    spellid?: number;
    timer_dynamic: number;
    phase_start?: number;
    phase_end?: number;
    cleu?: string;
    color?: string;
}


export type Encounter = EncounterEventType[];
