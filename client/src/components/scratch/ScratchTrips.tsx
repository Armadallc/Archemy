import React, { useRef } from "react";
import ReferenceTag from "./ReferenceTag";

interface ScratchTripsProps {
  showDimensions: boolean;
  showTags: boolean;
  referenceCounter: number;
  setReferenceCounter: React.Dispatch<React.SetStateAction<number>>;
}

export default function ScratchTrips({
  showTags,
}: ScratchTripsProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);

  const refs = {
    HEADER: "TRP-001",
    FILTERS: "TRP-002",
    TRIP_CARD: "TRP-003",
  };

  return (
    <div className="relative min-h-screen bg-white p-6 space-y-6">
      {/* Header Section - Height: 64px, Width: 1245px (full width), Layout: flex-row, Children: 2 */}
      <div
        ref={headerRef}
        data-scratch-ref={refs.HEADER}
        data-scratch-name="Header Section"
        className="relative border-2 border-blue-500 flex items-center justify-between h-[64px] w-full"
      >
        {showTags && <ReferenceTag id={refs.HEADER} name="Header Section" position="top-left" />}
        <div>
          <h1 className="text-3xl font-bold">Trips Management</h1>
          <p className="text-gray-600 mt-1 text-sm">20 trips for this program</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-gray-200 rounded text-sm">Export</div>
          <div className="px-3 py-1 bg-blue-600 text-white rounded text-sm">New Trip</div>
        </div>
      </div>

      {/* Filters Card - Height: 76px, Width: 1245px (full width) */}
      <div
        ref={calendarRef}
        data-scratch-ref={refs.FILTERS}
        data-scratch-name="Filters Card"
        className="relative border-2 border-green-500 rounded-lg border bg-card h-[76px] w-full"
      >
        {showTags && <ReferenceTag id={refs.FILTERS} name="Filters Card" position="top-left" />}
        <div className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-400 rounded"></div>
              <input
                type="text"
                placeholder="Search trips..."
                className="px-3 py-2 border border-gray-300 rounded-md text-sm w-48"
                readOnly
              />
            </div>
            <select className="px-3 py-2 border border-gray-300 rounded-md text-sm" title="Filter by trip status" aria-label="Filter by trip status">
              <option>All Status</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-md text-sm" title="Filter by date range" aria-label="Filter by date range">
              <option>All Dates</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trip Cards */}
      <div className="space-y-4">
        {/* First Trip Card - Height: 184px, Width: 1245px (full width) */}
        <div
          ref={detailsRef}
          data-scratch-ref={refs.TRIP_CARD}
          data-scratch-name="Trip Card (first)"
          className="relative border-2 border-purple-500 rounded-lg border bg-card shadow-sm h-[184px] hover:shadow-md transition-shadow w-full"
        >
          {showTags && <ReferenceTag id={refs.TRIP_CARD} name="Trip Card" position="top-left" />}
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">SCHEDULED</div>
                  <div className="px-2 py-1 border rounded text-xs">ONE WAY</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-base mb-1">Client Name</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-400 rounded"></div>
                        <span><strong>From:</strong> 123 Main Street</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-400 rounded"></div>
                        <span><strong>To:</strong> 456 Oak Avenue</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-400 rounded"></div>
                        <span><strong>Pickup:</strong> Nov 1, 10:00 AM</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    <div className="mb-1"><strong>Program:</strong> Program Name</div>
                    <div className="mb-1"><strong>Driver:</strong> Driver License</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional trip card for reference */}
        <div className="border-2 border-gray-300 rounded-lg border bg-card shadow-sm h-[184px] opacity-50 w-full">
          <div className="p-4">
            <div className="text-sm text-gray-400">Additional trip cards...</div>
          </div>
        </div>
      </div>
    </div>
  );
}

