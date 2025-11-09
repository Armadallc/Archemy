import React, { useRef } from "react";
import ReferenceTag from "./ReferenceTag";

interface ScratchDashboardProps {
  showDimensions: boolean;
  showTags: boolean;
  referenceCounter: number;
  setReferenceCounter: React.Dispatch<React.SetStateAction<number>>;
}

export default function ScratchDashboard({
  showTags,
}: ScratchDashboardProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const statsCardsRef = useRef<HTMLDivElement>(null);
  const widgetGridRef = useRef<HTMLDivElement>(null);

  const refs = {
    HEADER: "DASH-001",
    SIDEBAR: "DASH-002",
    MAIN_CONTENT: "DASH-003",
    STATS_CARD: "DASH-008",
    WIDGET_GRID: "DASH-004",
    WIDGET_1: "DASH-005",
    WIDGET_2: "DASH-006",
    WIDGET_3: "DASH-007",
  };

  return (
    <div className="relative min-h-screen bg-gray-100">
      {/* Header */}
      <div
        ref={headerRef}
        data-scratch-ref={refs.HEADER}
        data-scratch-name="Header"
        className="relative border-2 border-blue-500 bg-white p-4 flex items-center justify-between"
      >
        {showTags && <ReferenceTag id={refs.HEADER} name="Header" position="top-left" />}
        <h1 className="text-xl-display font-medium">DASHBOARD</h1>
        <div className="flex gap-2">
          <div className="w-8 h-8 bg-gray-300 rounded"></div>
          <div className="w-8 h-8 bg-gray-300 rounded"></div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div
          ref={sidebarRef}
          data-scratch-ref={refs.SIDEBAR}
          data-scratch-name="Sidebar"
          className="relative border-2 border-purple-500 bg-white w-64 min-h-screen p-4"
        >
          {showTags && <ReferenceTag id={refs.SIDEBAR} name="Sidebar" position="top-left" />}
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Main Content Area */}
        <div
          ref={mainContentRef}
          data-scratch-ref={refs.MAIN_CONTENT}
          data-scratch-name="Main Content"
          className="relative flex-1 overflow-auto border-2 border-cyan-500 bg-gray-900 p-6"
        >
          {showTags && <ReferenceTag id={refs.MAIN_CONTENT} name="Main Content" position="top-left" />}

          {/* Stats Cards Row */}
          <div
            ref={statsCardsRef}
            data-scratch-ref={refs.STATS_CARD}
            data-scratch-name="Stats Cards"
            className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
          >
            {showTags && <ReferenceTag id={refs.STATS_CARD} name="Stats Cards" position="top-left" />}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg p-4 border-2 border-gray-300 h-24">
                <div className="text-sm text-gray-600">Stat {i}</div>
                <div className="text-2xl font-bold mt-2">0</div>
              </div>
            ))}
          </div>

          {/* Widget Grid - 4 columns, 3 rows */}
          <div
            ref={widgetGridRef}
            data-scratch-ref={refs.WIDGET_GRID}
            data-scratch-name="Widget Grid (4 cols, 3 rows)"
            className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {showTags && <ReferenceTag id={refs.WIDGET_GRID} name="Widget Grid (4 cols, 3 rows)" position="top-left" />}

            {/* Row 1: Live Operations - Full Width */}
            <div
              data-scratch-ref={refs.WIDGET_1}
              data-scratch-name="Live Operations"
              className="relative border-2 border-red-500 bg-white rounded-lg p-6 lg:col-span-4 h-[743px]"
            >
              {showTags && <ReferenceTag id={refs.WIDGET_1} name="Live Operations" position="top-right" />}
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Live Operations</h2>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-gray-100 rounded"></div>
                <div className="h-16 bg-gray-100 rounded"></div>
                <div className="h-16 bg-gray-100 rounded"></div>
                <div className="h-16 bg-gray-100 rounded"></div>
                <div className="h-16 bg-gray-100 rounded"></div>
              </div>
            </div>

            {/* Row 2: Fleet Status - Full Width */}
            <div
              data-scratch-ref="DASH-009"
              data-scratch-name="Fleet Status (row 2, full width)"
              className="relative border-2 border-yellow-500 bg-white rounded-lg p-6 lg:col-span-4 h-[515px]"
            >
              {showTags && <ReferenceTag id="DASH-009" name="Fleet Status (row 2, full width)" position="top-right" />}
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Fleet Status</h2>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="h-32 bg-gray-100 rounded"></div>
                <div className="h-32 bg-gray-100 rounded"></div>
                <div className="h-32 bg-gray-100 rounded"></div>
                <div className="h-32 bg-gray-100 rounded"></div>
              </div>
            </div>

            {/* Row 3: Revenue Widget - Spans 2 columns */}
            <div
              data-scratch-ref={refs.WIDGET_2}
              data-scratch-name="Revenue (row 3, spans 2 cols)"
              className="relative border-2 border-green-500 bg-white rounded-lg p-6 lg:col-span-2 h-[684px]"
            >
              {showTags && <ReferenceTag id={refs.WIDGET_2} name="Revenue (row 3, spans 2 cols)" position="top-right" />}
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Revenue</h2>
              </div>
              <div className="h-48 bg-gray-100 rounded"></div>
            </div>

            {/* Row 3: Performance Metrics Widget - Spans 2 columns */}
            <div
              data-scratch-ref={refs.WIDGET_3}
              data-scratch-name="Performance (row 3, spans 2 cols)"
              className="relative border-2 border-indigo-500 bg-white rounded-lg p-6 lg:col-span-2 h-[684px]"
            >
              {showTags && <ReferenceTag id={refs.WIDGET_3} name="Performance (row 3, spans 2 cols)" position="top-right" />}
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Performance Metrics</h2>
              </div>
              <div className="h-48 bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

