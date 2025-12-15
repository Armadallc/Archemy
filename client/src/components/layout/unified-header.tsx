import React, { useState, useEffect, useMemo, memo } from 'react';
import { Button } from '../ui/button';
import { Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useHierarchy } from '../../hooks/useHierarchy';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { HeaderScopeSelector } from '../HeaderScopeSelector';
import EnhancedNotificationCenter from '../notifications/EnhancedNotificationCenter';
import GlobalSearch from '../search/GlobalSearch';
import { useLayout } from '../../contexts/layout-context';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/queryClient';

interface UnifiedHeaderProps {
  showTimeDisplay?: boolean;
  showSearch?: boolean;
  title?: string; // Optional dynamic title
}

// Skeleton component for loading states
function HeaderSkeleton() {
  return (
    <div 
      className="px-6 py-6 flex items-center justify-between rounded-lg border backdrop-blur-md shadow-xl animate-pulse" 
      style={{ 
        backgroundColor: 'var(--card)', 
        borderColor: 'var(--border)', 
        height: '150px' 
      }}
    >
      <div className="flex items-center gap-3">
        <div className="h-20 w-40 bg-gray-200 rounded" style={{ backgroundColor: 'var(--muted)' }}></div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="h-10 w-48 bg-gray-200 rounded" style={{ backgroundColor: 'var(--muted)' }}></div>
        <div className="h-10 w-40 bg-gray-200 rounded" style={{ backgroundColor: 'var(--muted)' }}></div>
        <div className="h-10 w-10 bg-gray-200 rounded-full" style={{ backgroundColor: 'var(--muted)' }}></div>
      </div>
    </div>
  );
}

function UnifiedHeaderComponent({ 
  showTimeDisplay = false, 
  showSearch = true,
  title 
}: UnifiedHeaderProps) {
  const { user } = useAuth();
  const { activeScope, activeScopeName, selectedCorporateClient } = useHierarchy();
  const { isOpen, openSearch, closeSearch, handleResultSelect } = useGlobalSearch();
  const layout = useLayout();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'k',
      metaKey: true,
      callback: openSearch,
      description: 'Open global search'
    },
    {
      key: 'Escape',
      callback: closeSearch,
      description: 'Close global search'
    }
  ]);

  // Time display timer (only if enabled)
  useEffect(() => {
    if (!showTimeDisplay) return;
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [showTimeDisplay]);

  // Format time for Mountain Time (Denver) with AM/PM
  const formatMountainTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      timeZone: 'America/Denver',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Fetch system settings for main logo
  const { data: systemSettings, isLoading: systemSettingsLoading } = useQuery({
    queryKey: ['/api/system-settings'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/system-settings');
        if (!response.ok) {
          return null;
        }
        return await response.json();
      } catch (error) {
        return null;
      }
    },
    enabled: true,
    retry: false,
  });

  // Get corporate client ID from user or selected corporate client
  const corporateClientId = (user as any)?.corporate_client_id || selectedCorporateClient;

  // Fetch corporate client data to get logo
  const { data: corporateClientData, isLoading: corporateClientLoading } = useQuery({
    queryKey: ['/api/corporate-clients', corporateClientId],
    queryFn: async () => {
      if (!corporateClientId) return null;
      try {
        const response = await apiRequest('GET', `/api/corporate/clients/${corporateClientId}`);
        return await response.json();
      } catch (error: any) {
        try {
          const response = await apiRequest('GET', `/api/corporate-clients/${corporateClientId}`);
          return await response.json();
        } catch (legacyError: any) {
          console.error('Error fetching corporate client:', legacyError);
          return null;
        }
      }
    },
    enabled: !!corporateClientId && (user?.role === 'corporate_admin' || !!selectedCorporateClient),
    retry: false,
  });

  // Memoize logo and name computations to prevent unnecessary recalculations
  const displayLogo = useMemo(() => {
    const getCorporateClientLogo = () => {
      if (corporateClientData?.logo_url) {
        return corporateClientData.logo_url;
      }
      return null;
    };

    const getMainLogoUrl = () => {
      return systemSettings?.main_logo_url || null;
    };

    // For corporate admins, prioritize their corporate client logo
    // For super admins, prioritize main logo
    if (user?.role === 'corporate_admin') {
      const corporateLogo = getCorporateClientLogo();
      if (corporateLogo) {
        return corporateLogo;
      }
      return getMainLogoUrl();
    }
    // For super admins and others: main logo > corporate client logo
    const mainLogo = getMainLogoUrl();
    if (mainLogo) {
      return mainLogo;
    }
    return getCorporateClientLogo();
  }, [corporateClientData?.logo_url, systemSettings?.main_logo_url, user?.role]);

  const displayName = useMemo(() => {
    if (selectedCorporateClient) {
      return selectedCorporateClient;
    }
    return systemSettings?.app_name || "HALCYON";
  }, [selectedCorporateClient, systemSettings?.app_name]);
  const isLoading = systemSettingsLoading || corporateClientLoading || layout.isLoading.header;

  // Show skeleton while loading
  if (isLoading) {
    return <HeaderSkeleton />;
  }

  return (
    <div 
      className="px-6 py-6 flex items-center justify-between rounded-lg border backdrop-blur-md shadow-xl" 
      style={{ 
        backgroundColor: 'var(--card)', 
        borderColor: 'var(--border)', 
        height: '150px' 
      }}
    >
      <div className="flex items-center gap-3">
        {showTimeDisplay ? (
          <div 
            className="flex items-center text-foreground"
            style={{
              fontFamily: "'Nohemi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'",
              fontWeight: 700,
              fontSize: '110px',
              lineHeight: 1.15,
              letterSpacing: '-0.015em',
              textTransform: 'none',
            }}
          >
            {formatMountainTime(currentTime)}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {displayLogo ? (
              <img 
                src={displayLogo} 
                alt={user?.role === 'corporate_admin' ? "Corporate Client Logo" : "Main Application Logo"} 
                className="object-cover"
                style={{ 
                  width: '120px', 
                  height: '120px', 
                  minWidth: '120px', 
                  minHeight: '120px', 
                  maxWidth: '120px', 
                  maxHeight: '120px', 
                  display: 'block' 
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div>
                <h2 
                  style={{ 
                    fontSize: '42px', 
                    fontFamily: "'Nohemi', sans-serif",
                    color: 'var(--foreground)'
                  }}
                >
                  {displayName}
                </h2>
              </div>
            )}
            {title && (
              <div className="ml-4">
                <h3 
                  style={{ 
                    fontSize: '24px', 
                    fontFamily: "'Nohemi', sans-serif",
                    color: 'var(--muted-foreground)',
                    fontWeight: 500
                  }}
                >
                  {title}
                </h3>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-4">
        <HeaderScopeSelector />
        {showSearch && (
          <Button
            variant="outline"
            size="sm"
            onClick={openSearch}
            className="flex items-center space-x-2 text-foreground backdrop-blur-sm hover:opacity-80" 
            style={{ 
              backgroundColor: 'var(--surface)', 
              borderColor: 'var(--border)', 
              width: '200px' 
            }}
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </Button>
        )}
        <EnhancedNotificationCenter />
      </div>
      
      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={isOpen}
        onClose={closeSearch}
        onResultSelect={handleResultSelect}
      />
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
// Only re-render if props change or if dependencies from hooks change
export const UnifiedHeader = memo(UnifiedHeaderComponent, (prevProps, nextProps) => {
  // Custom comparison: only re-render if props actually change
  return (
    prevProps.showTimeDisplay === nextProps.showTimeDisplay &&
    prevProps.showSearch === nextProps.showSearch &&
    prevProps.title === nextProps.title
  );
});
