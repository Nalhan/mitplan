// types/index.ts

import { ThunkAction } from 'redux-thunk';
import { Action } from '@reduxjs/toolkit';
import { Ability } from '../data/ability';
import { WowClass, WowSpec, /*classSpecs*/ } from '../data/classes';

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export interface RootState {
  mitplans: {
    mitplans: { [mitplanId: string]: Mitplan };
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
  };
  auth: {
    isAuthenticated: boolean;
    user: User | null;
    loading: boolean;
    error: string | null;
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface User {
  id: string;
  discordId: string;
  username: string;
  avatar: string;
  email: string;
}


export interface ServerSyncedMitplan {
  id: string;
  sheets: { [id: string]: ServerSyncedSheet };
  roster: Roster;
}

export interface ServerSyncedSheet {
  id: string;
  name: string;
  assignmentEvents: { [id: string]: AssignmentEventType };
  encounter: Encounter;
  encounterId: string;
  columnCount: number;
}

export interface ClientStoredSheet {
  timeScale: number;
}

export interface ClientStoredMitplan {
  activeSheetId: string | null;
}

export interface Sheet extends ServerSyncedSheet, ClientStoredSheet {}

export interface Mitplan extends ServerSyncedMitplan, ClientStoredMitplan {
  sheets: { [id: string]: Sheet };
}

export interface BaseEventType {
  id: string;
  name: string;
  timestamp: number;
  columnId: number;
  color?: string;
  icon?: string;
  assignee?: string;
  type?: string;
}

export interface CooldownEventType extends BaseEventType {
  type: 'cooldown';
  ability: Ability;
}

export interface TextEventType extends BaseEventType {
  type: 'text';
  content: string;
}

export type AssignmentEventType = BaseEventType | CooldownEventType | TextEventType;

export interface EncounterEventType {
    id: number;
    name: string;
    simple_name?: string;
    spellid?: number;
    duration?: number;
    timer_dynamic: number;
    phase_start?: number;
    phase_end?: number;
    cleu?: string;
    color?: string;
}


export type Encounter = {
  events: EncounterEventType[];
  name: string;
  id: string;
  fightLength: number;
};

export type Roster = {
  players: { [playerId: string]: Player };
};

export type RosterState = 'out' | 'in' | 'tentative' | 'bench' | 'unavailable';

export const ROSTER_STATES: RosterState[] = ['out', 'in', 'tentative', 'bench', 'unavailable'];

export type Player = {
  id: string;
  name: string;
  class: WowClass;
  spec: WowSpec;
  rosterStates: { [sheetId: string]: RosterState };
};