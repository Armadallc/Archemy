// Trip-specific event popup for calendar integration
import React, { useEffect, useMemo, useRef, useState } from "react";
import { format, isSameDay } from "date-fns";
import { XIcon, Edit, Trash2, MapPin, User, Clock, Car } from "lucide-react";
import { CalendarEvent } from "./types";
import { Trip, getTripStatusText, getTripColor } from "../../lib/trip-calendar-mapping";

interface TripEventPopupProps {
  date: Date;
  events: CalendarEvent[];
  trips: Trip[];
  position: { top: number; left: number };
  onClose: () => void;
  onEventSelect: (event: CalendarEvent) => void;
  onTripEdit?: (trip: Trip) => void;
  onTripDelete?: (trip: Trip) => void;
}

export function TripEventPopup({
  date,
  events,
  trips,
  position,
  onClose,
  onEventSelect,
  onTripEdit,
  onTripDelete,
}: TripEventPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Handle click outside to close popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Handle escape key to close popup
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [onClose]);

  const handleEventClick = (event: CalendarEvent) => {
    onEventSelect(event);
    onClose();
  };

  const handleTripEdit = (trip: Trip) => {
    if (onTripEdit) {
      onTripEdit(trip);
    }
    onClose();
  };

  const handleTripDelete = (trip: Trip) => {
    if (onTripDelete) {
      onTripDelete(trip);
    }
    setShowDeleteConfirm(null);
    onClose();
  };

  // Adjust position to ensure popup stays within viewport
  const adjustedPosition = useMemo(() => {
    const positionCopy = { ...position };

    if (popupRef.current) {
      const rect = popupRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Adjust horizontally if needed
      if (positionCopy.left + rect.width > viewportWidth) {
        positionCopy.left = Math.max(0, viewportWidth - rect.width);
      }

      // Adjust vertically if needed
      if (positionCopy.top + rect.height > viewportHeight) {
        positionCopy.top = Math.max(0, viewportHeight - rect.height);
      }
    }

    return positionCopy;
  }, [position]);

  // Get trip for each event
  const getTripForEvent = (event: CalendarEvent): Trip | undefined => {
    return trips.find(trip => trip.id === event.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div
      ref={popupRef}
      className="bg-background absolute z-50 max-h-96 w-96 overflow-auto rounded-md border shadow-lg"
      style={{
        top: `${adjustedPosition.top}px`,
        left: `${adjustedPosition.left}px`,
      }}
    >
      <div className="bg-background sticky top-0 flex items-center justify-between border-b p-3">
        <h3 className="font-medium">{format(date, "d MMMM yyyy")}</h3>
        <button
          onClick={onClose}
          className="hover:bg-muted rounded-full p-1"
          aria-label="Close"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2 p-3">
        {events.length === 0 ? (
          <div className="text-muted-foreground py-2 text-sm">No trips scheduled</div>
        ) : (
          events.map((event) => {
            const trip = getTripForEvent(event);
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            const isFirstDay = isSameDay(date, eventStart);
            const isLastDay = isSameDay(date, eventEnd);

            return (
              <div
                key={event.id}
                className="cursor-pointer border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={() => handleEventClick(event)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-sm">{event.title}</h4>
                      {trip && (
                        <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(trip.status)}`}>
                          {getTripStatusText(trip.status)}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{format(eventStart, 'h:mm a')} - {format(eventEnd, 'h:mm a')}</span>
                      </div>
                      
                      {trip && (
                        <>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{trip.pickup_address}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{trip.dropoff_address}</span>
                          </div>
                          {trip.client && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{trip.client.first_name} {trip.client.last_name}</span>
                            </div>
                          )}
                          {trip.passenger_count > 1 && (
                            <div className="flex items-center gap-1">
                              <Car className="h-3 w-3" />
                              <span>{trip.passenger_count} passengers</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  {trip && (
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTripEdit(trip);
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                        title="Edit trip"
                      >
                        <Edit className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(trip.id);
                        }}
                        className="p-1 hover:bg-red-200 dark:hover:bg-red-700 rounded text-red-600"
                        title="Delete trip"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Delete confirmation */}
                {showDeleteConfirm === trip?.id && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                    <p className="text-xs text-red-800 dark:text-red-200 mb-2">
                      Are you sure you want to delete this trip?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTripDelete(trip);
                        }}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(null);
                        }}
                        className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}







