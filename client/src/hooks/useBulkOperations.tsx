import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../lib/queryClient';

interface BulkOperationResult {
  success: boolean;
  message: string;
  failedItems?: string[];
}

export function useBulkOperations(entityType: 'trips' | 'drivers' | 'clients' | 'locations') {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const toggleItem = useCallback((itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  }, []);

  const selectAll = useCallback((allItemIds: string[]) => {
    setSelectedItems(allItemIds);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const executeBulkAction = useCallback(async (
    action: string, 
    itemIds: string[]
  ): Promise<BulkOperationResult> => {
    if (itemIds.length === 0) {
      return { success: false, message: 'No items selected' };
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', `/api/${entityType}/bulk`, {
        action,
        itemIds
      });

      if (!response.ok) {
        throw new Error(`Bulk operation failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/${entityType}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/trips'] });
      queryClient.invalidateQueries({ queryKey: ['/api/drivers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });

      return {
        success: true,
        message: result.message || `Successfully processed ${itemIds.length} items`,
        failedItems: result.failedItems || []
      };
    } catch (error) {
      console.error('Bulk operation error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    } finally {
      setIsLoading(false);
    }
  }, [entityType, queryClient]);

  const getBulkActionDescription = useCallback((action: string) => {
    const descriptions: Record<string, string> = {
      // Trip actions
      'status_scheduled': 'Mark selected trips as scheduled',
      'status_in_progress': 'Mark selected trips as in progress',
      'status_completed': 'Mark selected trips as completed',
      'status_cancelled': 'Mark selected trips as cancelled',
      'assign_driver': 'Assign driver to selected trips',
      'trip_export': 'Export selected trips to CSV',
      'trip_delete': 'Delete selected trips permanently',
      
      // Driver actions
      'status_active': 'Mark selected drivers as active',
      'status_inactive': 'Mark selected drivers as inactive',
      'driver_send_notification': 'Send notification to selected drivers',
      'archive': 'Archive selected drivers',
      
      // Client actions
      'client_send_notification': 'Send notification to selected clients',
      
      // Common actions (fallback for generic actions)
      'export': 'Export selected items to CSV',
      'delete': 'Delete selected items permanently',
    };

    return descriptions[action] || 'Perform bulk operation on selected items';
  }, []);

  return {
    selectedItems,
    isLoading,
    toggleItem,
    selectAll,
    clearSelection,
    executeBulkAction,
    getBulkActionDescription,
    isItemSelected: (itemId: string) => selectedItems.includes(itemId),
    selectedCount: selectedItems.length
  };
}







