import React, { useRef } from "react";
import ReferenceTag from "./ReferenceTag";

interface ScratchClientsProps {
  showDimensions: boolean;
  showTags: boolean;
  referenceCounter: number;
  setReferenceCounter: React.Dispatch<React.SetStateAction<number>>;
}

export default function ScratchClients({
  showTags,
}: ScratchClientsProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const tableHeaderRef = useRef<HTMLDivElement>(null);
  const tableBodyRef = useRef<HTMLDivElement>(null);

  const refs = {
    HEADER: "CLI-001",
    SEARCH_BAR: "CLI-002",
    TABLE: "CLI-003",
    TABLE_HEADER: "CLI-004",
    TABLE_BODY: "CLI-005",
  };

  return (
    <div className="relative min-h-screen bg-white p-6">
      {/* Header */}
      <div
        ref={headerRef}
        data-scratch-ref={refs.HEADER}
        data-scratch-name="Page Header"
        className="relative border-2 border-blue-500 mb-6 pb-4"
      >
        {showTags && <ReferenceTag id={refs.HEADER} name="Page Header" position="top-left" />}
        <h1 className="text-3xl font-bold">CLIENT MANAGEMENT</h1>
        <p className="text-gray-600">Manage and organize clients</p>
      </div>

      {/* Search Bar */}
      <div
        ref={searchBarRef}
        data-scratch-ref={refs.SEARCH_BAR}
        data-scratch-name="Search & Filters"
        className="relative border-2 border-green-500 mb-4 p-4 bg-gray-50 rounded"
      >
        {showTags && <ReferenceTag id={refs.SEARCH_BAR} name="Search Bar" position="top-left" />}
        <div className="flex gap-4">
          <div className="flex-1 h-10 bg-white border border-gray-300 rounded px-4">
            Search clients...
          </div>
          <div className="w-40 h-10 bg-white border border-gray-300 rounded px-4">
            Filter
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        ref={tableRef}
        data-scratch-ref={refs.TABLE}
        data-scratch-name="Clients Table"
        className="relative border-2 border-purple-500 rounded-lg overflow-hidden"
      >
        {showTags && <ReferenceTag id={refs.TABLE} name="Table" position="top-left" />}

        {/* Table Header */}
        <div
          ref={tableHeaderRef}
          data-scratch-ref={refs.TABLE_HEADER}
          data-scratch-name="Table Header"
          className="relative border-2 border-yellow-500 bg-gray-50 p-4 grid grid-cols-6 gap-4 font-semibold"
        >
          {showTags && <ReferenceTag id={refs.TABLE_HEADER} name="Table Header" position="top-left" />}
          <div>Client</div>
          <div>Contact</div>
          <div>Program</div>
          <div>Location</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {/* Table Body */}
        <div
          ref={tableBodyRef}
          data-scratch-ref={refs.TABLE_BODY}
          data-scratch-name="Table Body"
          className="relative border-2 border-cyan-500"
        >
          {showTags && <ReferenceTag id={refs.TABLE_BODY} name="Table Body" position="top-left" />}
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="grid grid-cols-6 gap-4 p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                <div>
                  <div className="font-medium">Client {i}</div>
                  <div className="text-sm text-gray-500">ID: {i.toString().padStart(8, '0')}</div>
                </div>
              </div>
              <div className="text-sm">
                <div>555-010{i}</div>
                <div className="text-gray-500">client{i}@example.com</div>
              </div>
              <div className="text-sm">Program {i}</div>
              <div className="text-sm">Location {i}</div>
              <div>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Active</span>
              </div>
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

