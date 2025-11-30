import React, { useRef } from "react";
import ReferenceTag from "./ReferenceTag";

interface ScratchDriversProps {
  showDimensions: boolean;
  showTags: boolean;
  referenceCounter: number;
  setReferenceCounter: React.Dispatch<React.SetStateAction<number>>;
}

export default function ScratchDrivers({
  showTags,
}: ScratchDriversProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const headerRowRef = useRef<HTMLDivElement>(null);

  const refs = {
    HEADER: "DRV-001",
    FILTERS: "DRV-002",
    LIST_HEADER: "DRV-003",
    LIST: "DRV-004",
  };

  return (
    <div className="relative min-h-screen bg-white p-6">
      {/* Header */}
      <div
        ref={headerRef}
        data-scratch-ref={refs.HEADER}
        data-scratch-name="Page Header"
        className="relative border-2 border-blue-500 mb-6 pb-4 flex items-center"
      >
        {showTags && <ReferenceTag id={refs.HEADER} name="Page Header" position="top-left" />}
        <h1 className="text-3xl font-bold">DRIVER MANAGEMENT</h1>
      </div>

      {/* Filters */}
      <div
        ref={filtersRef}
        data-scratch-ref={refs.FILTERS}
        data-scratch-name="Filters"
        className="relative border-2 border-green-500 mb-4 p-4 bg-gray-50 rounded"
      >
        {showTags && <ReferenceTag id={refs.FILTERS} name="Filters" position="top-left" />}
        <div className="flex gap-4">
          <div className="flex-1 h-10 bg-white border border-gray-300 rounded px-4">
            Search drivers...
          </div>
          <div className="w-32 h-10 bg-white border border-gray-300 rounded px-4">
            Status
          </div>
          <div className="w-32 h-10 bg-white border border-gray-300 rounded px-4">
            Vehicle
          </div>
        </div>
      </div>

      {/* Drivers List Header */}
      <div
        ref={headerRowRef}
        data-scratch-ref={refs.LIST_HEADER}
        data-scratch-name="Drivers List Header"
        className="relative border-2 border-yellow-500 mb-2 rounded-lg overflow-hidden"
      >
        {showTags && <ReferenceTag id={refs.LIST_HEADER} name="Drivers List Header" position="top-left" />}
        <div className="grid grid-cols-6 gap-0 bg-gray-200 border-b-2 border-gray-300 p-3">
          <div className="border-r border-gray-300 pr-2 text-left text-brutalist-small uppercase">DRIVER</div>
          <div className="border-r border-gray-300 pr-2 text-left text-brutalist-small uppercase">AVAILABILITY</div>
          <div className="border-r border-gray-300 pr-2 text-left text-brutalist-small uppercase">PHONE</div>
          <div className="border-r border-gray-300 pr-2 text-left text-brutalist-small uppercase">EMAIL</div>
          <div className="border-r border-gray-300 pr-2 text-left text-brutalist-small uppercase">EMERGENCY CONTACT</div>
          <div className="pr-2 text-left text-brutalist-small uppercase">MANAGE</div>
        </div>
      </div>

      {/* Scrollable Driver List */}
      <div
        ref={listRef}
        data-scratch-ref={refs.LIST}
        data-scratch-name="Driver List"
        className="relative border-2 border-purple-500 rounded-lg overflow-hidden"
      >
        {showTags && <ReferenceTag id={refs.LIST} name="Driver List" position="top-left" />}
        
        {/* Scrollable Container */}
        <div className="max-h-[600px] overflow-y-auto">
          <div className="divide-y divide-gray-200">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="border border-gray-200 hover:bg-gray-50 transition-colors">
                {/* Driver Card */}
                <div className="grid grid-cols-6 gap-0 p-3 items-center">
                  {/* Driver (Avatar + Name + Status Badge) */}
                  <div className="border-r border-gray-200 pr-2 flex items-start gap-3">
                    <div className="flex flex-col gap-2">
                      <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                      <span className={`px-2 py-1 rounded text-xs w-fit ${
                        i % 2 === 0 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {i % 2 === 0 ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-semibold text-sm">Driver {i}</span>
                    </div>
                  </div>
                  
                  {/* Availability */}
                  <div className="border-r border-gray-200 pr-2 flex items-center">
                    <span className="text-sm text-left">{i % 2 === 0 ? "Yes" : "No"}</span>
                  </div>
                  
                  {/* Phone */}
                  <div className="border-r border-gray-200 pr-2 flex items-center">
                    <span className="text-sm text-gray-600 text-left">555-010{i}</span>
                  </div>
                  
                  {/* Email */}
                  <div className="border-r border-gray-200 pr-2 flex items-center">
                    <span className="text-sm text-gray-600 text-left">driver{i}@example.com</span>
                  </div>
                  
                  {/* Emergency Contact & Phone */}
                  <div className="border-r border-gray-200 pr-2 flex flex-col gap-1 items-start">
                    <span className="text-sm">Contact {i}</span>
                    <span className="text-xs text-gray-600">555-020{i}</span>
                  </div>
                  
                  {/* Manage Button */}
                  {/* NOTE: Opens expanded driver card (like create driver dialog) with full profile management:
                      - Edit/Delete driver
                      - Change status (active/inactive, available/unavailable)
                      - Duty status
                      - Schedule
                      - Future: Trip stats, Rating, Performance analytics
                      - Future: Credential tracking/expiry
                      - Future: Languages spoken
                      - Future: Personal vehicle, License plate
                      - Future: Driver's license expiration
                      - Future: Notes */}
                  <div className="pr-2 flex items-center">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors">
                      Manage
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

