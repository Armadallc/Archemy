import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Activity, Zap, Clock, Database, Wifi } from 'lucide-react';
import { useOptimizedQueries } from '../../hooks/useOptimizedQueries';

interface PerformanceMonitorProps {
  isVisible?: boolean;
  onToggle?: () => void;
}

export default function PerformanceMonitor({ 
  isVisible = false, 
  onToggle 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    queryCount: 0,
    cacheSize: 0,
    memoryUsage: 0,
    lastUpdate: new Date()
  });

  const { getQueryMetrics, clearUnusedCache } = useOptimizedQueries();

  useEffect(() => {
    if (!isVisible) return;

    const updateMetrics = () => {
      const queryMetrics = getQueryMetrics();
      const memoryInfo = (performance as any).memory;
      
      setMetrics({
        renderTime: performance.now(),
        queryCount: queryMetrics.totalQueries,
        cacheSize: queryMetrics.cacheSize,
        memoryUsage: memoryInfo ? Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) : 0,
        lastUpdate: new Date()
      });
    };

    // Update metrics immediately
    updateMetrics();

    // Update every 5 seconds
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, [isVisible, getQueryMetrics]);

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50"
      >
        <Activity className="h-4 w-4 mr-2" />
        Performance
      </Button>
    );
  }

  const getPerformanceStatus = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return { status: 'good', color: 'green' };
    if (value <= thresholds.warning) return { status: 'warning', color: 'yellow' };
    return { status: 'poor', color: 'red' };
  };

  const queryStatus = getPerformanceStatus(metrics.queryCount, { good: 10, warning: 20 });
  const memoryStatus = getPerformanceStatus(metrics.memoryUsage, { good: 50, warning: 100 });
  const cacheStatus = getPerformanceStatus(metrics.cacheSize, { good: 10000, warning: 50000 });

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            Performance Monitor
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearUnusedCache}
              className="text-xs"
            >
              Clear Cache
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onToggle}
              className="text-xs"
            >
              Hide
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Query Performance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Active Queries</span>
            </div>
            <Badge 
              variant="outline" 
              className={`text-${queryStatus.color}-600 dark:text-${queryStatus.color}-400`}
            >
              {metrics.queryCount}
            </Badge>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {queryStatus.status === 'good' && 'Optimal query count'}
            {queryStatus.status === 'warning' && 'Consider reducing queries'}
            {queryStatus.status === 'poor' && 'Too many active queries'}
          </div>
        </div>

        {/* Memory Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Memory Usage</span>
            </div>
            <Badge 
              variant="outline" 
              className={`text-${memoryStatus.color}-600 dark:text-${memoryStatus.color}-400`}
            >
              {metrics.memoryUsage} MB
            </Badge>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {memoryStatus.status === 'good' && 'Memory usage is normal'}
            {memoryStatus.status === 'warning' && 'Memory usage is elevated'}
            {memoryStatus.status === 'poor' && 'High memory usage detected'}
          </div>
        </div>

        {/* Cache Size */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Cache Size</span>
            </div>
            <Badge 
              variant="outline" 
              className={`text-${cacheStatus.color}-600 dark:text-${cacheStatus.color}-400`}
            >
              {Math.round(metrics.cacheSize / 1024)} KB
            </Badge>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {cacheStatus.status === 'good' && 'Cache size is optimal'}
            {cacheStatus.status === 'warning' && 'Cache size is growing'}
            {cacheStatus.status === 'poor' && 'Cache size is too large'}
          </div>
        </div>

        {/* Last Update */}
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <Clock className="h-3 w-3" />
          <span>Updated {metrics.lastUpdate.toLocaleTimeString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}







