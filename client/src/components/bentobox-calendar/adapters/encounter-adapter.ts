/**
 * Encounter Adapter for Full Calendar Integration
 * 
 * Converts between BentoBox ScheduledEncounter and full-calendar CalendarEvent formats
 * Ensures data compatibility while preserving BentoBox-specific properties
 */

import { ScheduledEncounter } from '../types';
import { CalendarEvent } from '../../event-calendar/types';
import { mapToFireColor } from './color-adapter';

/**
 * Converts BentoBox ScheduledEncounter to full-calendar CalendarEvent format
 * Preserves all BentoBox-specific data in extendedProps
 */
export const toCalendarEvent = (encounter: ScheduledEncounter): CalendarEvent => {
  // Ensure dates are Date objects
  const start = encounter.start instanceof Date 
    ? encounter.start 
    : new Date(encounter.start);
  const end = encounter.end instanceof Date 
    ? encounter.end 
    : new Date(encounter.end);

  return {
    id: encounter.id,
    title: encounter.title || 'Untitled Encounter',
    start,
    end,
    allDay: false, // BentoBox encounters are never all-day
    color: mapToFireColor(encounter.color),
    // Preserve BentoBox-specific data in extended properties
    extendedProps: {
      templateId: encounter.templateId,
      templateVersion: encounter.templateVersion,
      status: encounter.status,
      isDuplicate: encounter.isDuplicate,
      parentId: encounter.parentId,
      childIds: encounter.childIds,
      overrides: encounter.overrides,
      description: encounter.description,
      location: encounter.location,
    },
  };
};

/**
 * Converts full-calendar CalendarEvent back to BentoBox ScheduledEncounter
 * Merges with original encounter to preserve template data
 */
export const toScheduledEncounter = (
  event: CalendarEvent,
  originalEncounter?: ScheduledEncounter
): ScheduledEncounter => {
  // Ensure dates are Date objects
  const start = event.start instanceof Date 
    ? event.start 
    : new Date(event.start);
  const end = event.end instanceof Date 
    ? event.end 
    : new Date(event.end);

  // If we have original encounter, merge with updates
  if (originalEncounter) {
    return {
      ...originalEncounter,
      id: event.id,
      title: event.title,
      start,
      end,
      color: mapToFireColor(event.color || originalEncounter.color),
      // Preserve extended props if they exist
      ...(event.extendedProps && {
        status: event.extendedProps.status || originalEncounter.status,
        overrides: event.extendedProps.overrides || originalEncounter.overrides,
        description: event.extendedProps.description || originalEncounter.description,
        location: event.extendedProps.location || originalEncounter.location,
      }),
    };
  }

  // Create new encounter from event (shouldn't happen in normal flow)
  return {
    id: event.id,
    templateId: event.extendedProps?.templateId || '',
    templateVersion: event.extendedProps?.templateVersion || 1,
    isDuplicate: event.extendedProps?.isDuplicate || false,
    start,
    end,
    title: event.title,
    description: event.extendedProps?.description,
    color: mapToFireColor(event.color || 'silver'),
    location: event.extendedProps?.location,
    status: event.extendedProps?.status || 'scheduled',
    parentId: event.extendedProps?.parentId,
    childIds: event.extendedProps?.childIds,
    overrides: event.extendedProps?.overrides,
  } as ScheduledEncounter;
};

/**
 * Converts array of ScheduledEncounters to CalendarEvents
 */
export const toCalendarEvents = (encounters: ScheduledEncounter[]): CalendarEvent[] => {
  return encounters.map(toCalendarEvent);
};

/**
 * Converts array of CalendarEvents back to ScheduledEncounters
 * Requires original encounters array for proper merging
 */
export const toScheduledEncounters = (
  events: CalendarEvent[],
  originalEncounters: ScheduledEncounter[]
): ScheduledEncounter[] => {
  return events.map(event => {
    const original = originalEncounters.find(e => e.id === event.id);
    return toScheduledEncounter(event, original);
  });
};




