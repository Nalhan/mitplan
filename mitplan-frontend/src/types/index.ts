// types/index.ts

import { ThunkAction } from 'redux-thunk';
import { Action } from '@reduxjs/toolkit';

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export interface RootState {
  rooms: { [roomId: string]: Room };
}

export interface Room {
  id: string;
  sheets: { [sheetId: string]: Sheet };
  roster: Roster;
  activeSheetId: string | null;
}

export interface Sheet {
  id: string;
  name: string;
  assignmentEvents: { [id: string]: AssignmentEventType };
  encounterEvents: EncounterEventType[];
  timelineLength: number;
  columnCount: number;
}

export interface Roster {
  // Define roster properties here
}

export interface AssignmentEventType {
  id: string;
  name: string;
  timestamp: number;
  columnId: number;
  color?: string;
  icon?: string;    // wow icon name, will be resolved to zam url later
  // other properties...
}

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