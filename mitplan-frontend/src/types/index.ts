// types/index.ts

import { ThunkAction } from 'redux-thunk';
import { Action } from '@reduxjs/toolkit';
import { Ability } from '../data/ability';
import { WowClass, WowSpec, classSpecs } from '../data/classes';

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export interface RootState {
  rooms: { [roomId: string]: Room };
}

export interface ServerSyncedRoom {
  id: string;
  sheets: { [id: string]: ServerSyncedSheet };
  roster: Roster;
}

export interface ServerSyncedSheet {
  id: string;
  name: string;
  assignmentEvents: { [id: string]: AssignmentEventType };
  encounter: Encounter;
  columnCount: number;
}

export interface ClientStoredSheet {
  timeScale: number;
}

export interface ClientStoredRoom {
  activeSheetId: string | null;
}

export interface Sheet extends ServerSyncedSheet, ClientStoredSheet {}

export interface Room extends ServerSyncedRoom, ClientStoredRoom {
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

export type Player = {
  id: string;
  name: string;
  class: WowClass;
  spec: WowSpec;
  assignedSheets: string[];
};