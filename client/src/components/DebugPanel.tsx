import React, { useState, useEffect } from 'react';
import { clickTracker } from '../lib/clickTracker';

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ isOpen, onClose }) => {
  const [events, setEvents] = useState(clickTracker.getEvents());
  const [stats, setStats] = useState(clickTracker.getStats());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const refreshData = () => {
      setEvents(clickTracker.getEvents());
      setStats(clickTracker.getStats());
    };

    if (autoRefresh) {
      const interval = setInterval(refreshData, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen, autoRefresh]);

  if (!isOpen) return null;

  const recentEvents = events.slice(-20).reverse();
  const errors = clickTracker.getErrors();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">🖱️ Click & Error Tracker</h2>
          <div className="flex items-center space-x-2">
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              Auto-refresh
            </label>
            <button
              onClick={() => {
                setEvents(clickTracker.getEvents());
                setStats(clickTracker.getStats());
              }}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                clickTracker.clearEvents();
                setEvents([]);
                setStats(clickTracker.getStats());
              }}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
            {/* Stats Panel */}
            <div className="p-4 border-r">
              <h3 className="font-semibold mb-3">📊 Statistics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Clicks:</span>
                  <span className="font-mono">{stats.totalClicks}</span>
                </div>
                <div className="flex justify-between">
                  <span>Errors:</span>
                  <span className="font-mono text-red-600">{stats.errors}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pages:</span>
                  <span className="font-mono">{stats.pages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Element Types:</span>
                  <span className="font-mono">{stats.elementTypes.length}</span>
                </div>
                {stats.lastEvent && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-xs text-gray-600">Last Event:</div>
                    <div className="font-mono text-xs">
                      {stats.lastEvent.elementType}: {stats.lastEvent.element}
                    </div>
                  </div>
                )}
              </div>

              {/* Error Summary */}
              {errors.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-semibold text-red-600 mb-2">🚨 Recent Errors</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {errors.slice(-5).reverse().map((error, index) => (
                      <div key={index} className="text-xs bg-red-50 p-2 rounded">
                        <div className="font-mono">{error.error}</div>
                        <div className="text-gray-500">{error.timestamp}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Events Panel */}
            <div className="p-4">
              <h3 className="font-semibold mb-3">🖱️ Recent Events</h3>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {recentEvents.length === 0 ? (
                  <div className="text-gray-500 text-sm">No events yet. Start clicking!</div>
                ) : (
                  recentEvents.map((event, index) => (
                    <div
                      key={index}
                      className={`text-xs p-2 rounded ${
                        event.error
                          ? 'bg-red-50 border-l-4 border-red-400'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-mono">
                            {event.elementType}: {event.element}
                          </div>
                          {event.elementText && (
                            <div className="text-gray-600 truncate">
                              "{event.elementText}"
                            </div>
                          )}
                          {event.error && (
                            <div className="text-red-600 font-mono text-xs mt-1">
                              {event.error}
                            </div>
                          )}
                        </div>
                        <div className="text-gray-400 text-xs ml-2">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Export/Import */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const data = clickTracker.exportEvents();
                navigator.clipboard.writeText(data);
                alert('Events copied to clipboard!');
              }}
              className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
            >
              Copy to Clipboard
            </button>
            <button
              onClick={() => {
                const data = clickTracker.exportEvents();
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `click-tracking-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Download JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;


