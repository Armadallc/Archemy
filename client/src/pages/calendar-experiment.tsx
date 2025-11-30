import React, { useState, useMemo } from "react";
import { addDays, setHours, setMinutes, getDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { CalendarProvider, EventCalendar, type CalendarEvent, type EventColor } from "../components/event-calendar";
import { useTripsForCalendar } from "../hooks/useTripsForCalendar";
import { TripEventPopup } from "../components/event-calendar/TripEventPopup";
import { Trip } from "../lib/trip-calendar-mapping";

// Function to calculate days until next Sunday
const getDaysUntilNextSunday = (date: Date) => {
  const day = getDay(date); // 0 is Sunday, 6 is Saturday
  return day === 0 ? 0 : 7 - day; // If today is Sunday, return 0, otherwise calculate days until Sunday
};

// Store the current date to avoid repeated new Date() calls
const currentDate = new Date();

// Calculate the offset once to avoid repeated calculations
const daysUntilNextSunday = getDaysUntilNextSunday(currentDate);

// Sample events data with hardcoded times (fallback for testing)
const sampleEvents: CalendarEvent[] = [
  {
    id: "sample-1",
    title: "Sample Trip - John Doe",
    description: "123 Main St → 456 Oak Ave\n\nTest trip for calendar integration",
    start: setMinutes(
      setHours(addDays(currentDate, 1), 9),
      0,
    ),
    end: setMinutes(
      setHours(addDays(currentDate, 1), 10),
      0,
    ),
    color: "blue",
    location: "123 Main St, Denver, CO",
  },
  {
    id: "sample-2",
    title: "Sample Trip - Mary Smith",
    description: "789 Pine St → 321 Elm St\n\nRound trip transportation",
    start: setMinutes(
      setHours(addDays(currentDate, 2), 14),
      0,
    ),
    end: setMinutes(
      setHours(addDays(currentDate, 2), 15),
      30,
    ),
    color: "emerald",
    location: "789 Pine St, Denver, CO",
  },
  {
    id: "w1-1",
    title: "Strategy Workshop",
    description: "Annual strategy planning session",
    start: setMinutes(
      setHours(addDays(currentDate, -12 + daysUntilNextSunday), 8),
      30,
    ),
    end: setMinutes(
      setHours(addDays(currentDate, -12 + daysUntilNextSunday), 10),
      0,
    ),
    color: "violet",
    location: "Innovation Lab",
  },
  {
    id: "w1-2",
    title: "Client Presentation",
    description: "Present quarterly results",
    start: setMinutes(
      setHours(addDays(currentDate, -12 + daysUntilNextSunday), 13),
      0,
    ),
    end: setMinutes(
      setHours(addDays(currentDate, -12 + daysUntilNextSunday), 14),
      30,
    ),
    color: "emerald",
    location: "Client HQ",
  },
  {
    id: "w1-3",
    title: "Budget Review",
    description: "Review department budgets",
    start: setMinutes(
      setHours(addDays(currentDate, -11 + daysUntilNextSunday), 9),
      15,
    ),
    end: setMinutes(
      setHours(addDays(currentDate, -11 + daysUntilNextSunday), 11),
      0,
    ),
    color: "blue",
    location: "Finance Room",
  },
  {
    id: "w1-4",
    title: "Team Lunch",
    description: "Quarterly team lunch",
    start: setMinutes(
      setHours(addDays(currentDate, -11 + daysUntilNextSunday), 12),
      0,
    ),
    end: setMinutes(
      setHours(addDays(currentDate, -11 + daysUntilNextSunday), 13),
      30,
    ),
    color: "orange",
    location: "Bistro Garden",
  },
  {
    id: "w1-5",
    title: "Project Kickoff",
    description: "Launch new marketing campaign",
    start: setMinutes(
      setHours(addDays(currentDate, -10 + daysUntilNextSunday), 10),
      0,
    ),
    end: setMinutes(
      setHours(addDays(currentDate, -10 + daysUntilNextSunday), 12),
      0,
    ),
    color: "orange",
    location: "Marketing Suite",
  },
  {
    id: "w1-6",
    title: "Interview: UX Designer",
    description: "First round interview",
    start: setMinutes(
      setHours(addDays(currentDate, -10 + daysUntilNextSunday), 14),
      0,
    ),
    end: setMinutes(
      setHours(addDays(currentDate, -10 + daysUntilNextSunday), 15),
      0,
    ),
    color: "violet",
    location: "HR Office",
  },
  {
    id: "w1-7",
    title: "Company All-Hands",
    description: "Monthly company update",
    start: setMinutes(
      setHours(addDays(currentDate, -9 + daysUntilNextSunday), 9),
      0,
    ),
    end: setMinutes(
      setHours(addDays(currentDate, -9 + daysUntilNextSunday), 10),
      30,
    ),
    color: "emerald",
    location: "Main Auditorium",
  },
  {
    id: "w1-8",
    title: "Product Demo",
    description: "Demo new features to stakeholders",
    start: setMinutes(
      setHours(addDays(currentDate, -9 + daysUntilNextSunday), 13),
      45,
    ),
    end: setMinutes(
      setHours(addDays(currentDate, -9 + daysUntilNextSunday), 15),
      0,
    ),
    color: "blue",
    location: "Demo Room",
  },
  {
    id: "w1-9",
    title: "Family Time",
    description: "Morning routine with kids",
    start: setMinutes(
      setHours(addDays(currentDate, -8 + daysUntilNextSunday), 7),
      0,
    ),
    end: setMinutes(
      setHours(addDays(currentDate, -8 + daysUntilNextSunday), 7),
      30,
    ),
    color: "rose",
  },
  {
    id: "w1-10",
    title: "Family Time",
    description: "Breakfast with family",
    start: setMinutes(
      setHours(addDays(currentDate, -8 + daysUntilNextSunday), 10),
      0,
    ),
    end: setMinutes(
      setHours(addDays(currentDate, -8 + daysUntilNextSunday), 10),
      30,
    ),
    color: "rose",
  },
];

export default function CalendarExperiment() {
  const [events, setEvents] = useState<CalendarEvent[]>(sampleEvents);

  const handleEventAdd = (event: CalendarEvent) => {
    setEvents([...events, event]);
  };

  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    setEvents(
      events.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event,
      ),
    );
  };

  const handleEventDelete = (eventId: string) => {
    setEvents(events.filter((event) => event.id !== eventId));
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-3xl font-bold">Calendar Experiment</h1>
          <p className="text-muted-foreground mt-1">
            Testing new shadcn/ui calendar component with drag-and-drop functionality
          </p>
        </div>
      </div>

      {/* Calendar Component */}
      <div className="flex-1 overflow-hidden">
        <CalendarProvider>
          <EventCalendar
            events={events}
            onEventAdd={handleEventAdd}
            onEventUpdate={handleEventUpdate}
            onEventDelete={handleEventDelete}
            initialView="week"
          />
        </CalendarProvider>
      </div>
    </div>
  );
}
