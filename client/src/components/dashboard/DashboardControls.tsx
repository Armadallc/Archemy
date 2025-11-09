import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  RefreshCw, 
  Pause, 
  Play, 
  Settings, 
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '../ui/dropdown-menu';

interface DashboardControlsProps {
  isRefreshing?: boolean;
  lastUpdated?: Date;
  refreshInterval?: number;
  onRefresh?: () => void;
  onToggleAutoRefresh?: (enabled: boolean) => void;
  onSetRefreshInterval?: (interval: number) => void;
  isConnected?: boolean;
}

export default function DashboardControls({
  isRefreshing = false,
  lastUpdated = new Date(),
  refreshInterval = 5000,
  onRefresh,
  onToggleAutoRefresh,
  onSetRefreshInterval,
  isConnected = true
}: DashboardControlsProps) {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedInterval, setSelectedInterval] = useState(refreshInterval);

  const handleToggleAutoRefresh = () => {
    const newState = !autoRefresh;
    setAutoRefresh(newState);
    onToggleAutoRefresh?.(newState);
  };

  const handleSetInterval = (interval: number) => {
    setSelectedInterval(interval);
    onSetRefreshInterval?.(interval);
  };

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const intervalOptions = [
    { value: 2000, label: '2 seconds' },
    { value: 5000, label: '5 seconds' },
    { value: 10000, label: '10 seconds' },
    { value: 30000, label: '30 seconds' },
    { value: 60000, label: '1 minute' }
  ];

  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Left side - Status indicators */}
      <div className="flex items-center space-x-4">
        {/* Connection status */}
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Auto refresh status */}
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </span>
        </div>

        {/* Last updated */}
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Updated {formatLastUpdated(lastUpdated)}
          </span>
        </div>
      </div>

      {/* Right side - Controls */}
      <div className="flex items-center space-x-2">
        {/* Manual refresh button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>

        {/* Auto refresh toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleToggleAutoRefresh}
          className="flex items-center space-x-2"
        >
          {autoRefresh ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          <span>{autoRefresh ? 'Pause' : 'Resume'}</span>
        </Button>

        {/* Settings dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Refresh Settings
              </p>
            </div>
            <DropdownMenuSeparator />
            
            <div className="px-3 py-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Refresh Interval
              </p>
              {intervalOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => handleSetInterval(option.value)}
                  className="flex items-center justify-between"
                >
                  <span>{option.label}</span>
                  {selectedInterval === option.value && (
                    <Badge variant="secondary" className="text-xs">
                      Current
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </div>
            
            <DropdownMenuSeparator />
            
            <div className="px-3 py-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Real-time updates help keep data current
              </p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}







