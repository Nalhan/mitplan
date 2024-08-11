// TODO: deprecate this file
// import { useState, useEffect } from 'react';
// import { useParams, useNavigate, useLocation } from 'react-router-dom';
// import io, { Socket } from 'socket.io-client';
// import { EncounterEventType } from '../types/encounterTypes';

// interface Event {
//   key: string;
//   name: string;
//   timestamp: number;
//   columnId: number;
//   duration?: number;
//   color?: string;
//   icon?: string;
// }

// interface Sheet {
//   name: string;
//   events: Event[];
//   timelineLength: number;
//   columnCount: number;
//   encounterEvents: EncounterEventType[];
// }

// interface RoomParams {
//   roomId?: string;
// }

// interface RoomState {
//   sheets: { [sheetId: string]: Sheet };
// }

// export const useRoomState = () => {
//   const { roomId } = useParams<keyof RoomParams>();
//   const [sheets, setSheets] = useState<{ [sheetId: string]: Sheet }>({});
//   const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [socket, setSocket] = useState<Socket | null>(null);

//   const formatSheets = (sheets: { [sheetId: string]: { name: string, events: Event[], encounterEvents: EncounterEventType[], settings: { timelineLength: number, columnCount: number } } }): { [sheetId: string]: Sheet } => {
//     return Object.entries(sheets).reduce((acc, [sheetId, sheet]) => ({
//       ...acc,
//       [sheetId]: { 
//         name: sheet.name,
//         events: sheet.events,
//         encounterEvents: sheet.encounterEvents,
//         timelineLength: sheet.settings.timelineLength, 
//         columnCount: sheet.settings.columnCount 
//       }
//     }), {});
//   };

//   useEffect(() => {
//     const newSocket = io(import.meta.env.VITE_BACKEND_URL as string);
    
//     newSocket.on('connect', () => {
//       console.log('Connected to backend');
//       newSocket.emit('joinRoom', roomId);
//     });

//     newSocket.on('initialState', (data: { sheets?: { [sheetId: string]: { name: string, events: Event[], encounterEvents: EncounterEventType[], settings: { timelineLength: number, columnCount: number } } } }) => {
//       if (data.sheets) {
//         const formattedSheets = formatSheets(data.sheets);
//         setSheets(formattedSheets);
        
//         const hashSheetId = location.hash.slice(1);
//         if (hashSheetId && formattedSheets[hashSheetId]) {
//           setActiveSheetId(hashSheetId);
//         } else if (Object.keys(formattedSheets).length > 0) {
//           setActiveSheetId(Object.keys(formattedSheets)[0]);
//         }
//       }
//     });

//     newSocket.on('stateUpdate', ((data: { sheets?: { [sheetId: string]: { name: string, events: Event[], encounterEvents: EncounterEventType[], settings: { timelineLength: number, columnCount: number } } } }) => {
//       if (data.sheets) {
//         setSheets(formatSheets(data.sheets));
//         console.log('State updated:', data.sheets);
//       }
//     }) as any);

//     newSocket.on('error', (error: string) => {
//       console.error('Socket error:', error);
//     });

//     setSocket(newSocket);

//     return () => {
//       newSocket.disconnect();
//     };
//   }, [roomId, location.hash]);

//   useEffect(() => {
//     if (activeSheetId) {
//       navigate(`#${activeSheetId}`, { replace: true });
//     }
//   }, [activeSheetId, navigate]);

//   const createSheet = (sheetId: string) => {
//     if (!socket) return;
//     socket.emit('createSheet', roomId, sheetId);
//   };

//   const switchSheet = (sheetId: string) => {
//     setActiveSheetId(sheetId);
//   };

//   const deleteSheet = (sheetId: string) => {
//     if (!socket) return;
//     socket.emit('deleteSheet', roomId, sheetId);
//   };

//   const createEvent = (newEvent: Event) => {
//     if (!socket || !activeSheetId) return;
//     socket.emit('createEvent', roomId, activeSheetId, newEvent);
//   };

//   const clearEvents = (sheetId: string) => {
//     if (!socket) return;
//     socket.emit('clearEvents', roomId, sheetId);
//   };

//   const updateEvent = (sheetId: string, updatedEvent: Event) => {
//     if (!socket) return;
//     socket.emit('updateEvent', roomId, sheetId, updatedEvent, (error: any) => {
//       if (error) {
//         console.error('Error updating event:', error);
//       } else {
//         console.log('Event update emitted successfully');
//       }
//     });
//   };
  
//   const updateEncounterEvents = (sheetId: string, encounterEvents: EncounterEventType[]) => {
//     if (!socket) return;
//     socket.emit('updateEncounterEvents', roomId, sheetId, encounterEvents);
//   };

//   const deleteEvent = (sheetId: string, eventKey: string) => {
//     if (!socket) return;
//     console.log(`Deleting event: sheetId=${sheetId}, eventKey=${eventKey}`);
//     socket.emit('deleteEvent', roomId, sheetId, eventKey);
//   };

//   const renameSheet = (sheetId: string, newName: string) => {
//     if (!socket) return;
//     socket.emit('renameSheet', roomId, sheetId, newName);
//   };

//   return {
//     roomId,
//     sheets,
//     activeSheetId,
//     createSheet,
//     switchSheet,
//     deleteSheet,
//     createEvent,
//     clearEvents,
//     updateEvent,
//     updateEncounterEvents,
//     deleteEvent,
//     renameSheet,
//   };
// };