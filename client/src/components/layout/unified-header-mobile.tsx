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
import { useIsMobile } from '../../hooks/use-mobile';

interface UnifiedHeaderMobileProps {
  showSearch?: boolean;
}

// Mobile-optimized header component
function UnifiedHeaderMobileComponent({ 
  showSearch = true
}: UnifiedHeaderMobileProps) {
  const { user } = useAuth();
  const { activeScope, activeScopeName, selectedCorporateClient } = useHierarchy();
  const { isOpen, openSearch, closeSearch, handleResultSelect } = useGlobalSearch();
  const layout = useLayout();

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

  // Memoize logo computation
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

    if (user?.role === 'corporate_admin') {
      const corporateLogo = getCorporateClientLogo();
      if (corporateLogo) {
        return corporateLogo;
      }
      return getMainLogoUrl();
    }
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

  // Show minimal loading state
  if (isLoading) {
    return (
      <div 
        className="px-4 py-3 flex items-center justify-between border-b backdrop-blur-md" 
        style={{ 
          backgroundColor: 'var(--card)', 
          borderColor: 'var(--border)', 
          height: '64px',
          minHeight: '64px'
        }}
      >
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" style={{ backgroundColor: 'var(--muted)' }}></div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" style={{ backgroundColor: 'var(--muted)' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="px-4 py-3 flex items-center justify-between border-b backdrop-blur-md sticky top-0 z-40" 
      style={{ 
        backgroundColor: 'var(--card)', 
        borderColor: 'var(--border)', 
        height: '64px',
        minHeight: '64px'
      }}
    >
      {/* Left: Logo/App Name */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {displayLogo ? (
          <img 
            src={displayLogo} 
            alt={user?.role === 'corporate_admin' ? "Corporate Client Logo" : "Main Application Logo"} 
            className="object-cover"
            style={{ 
              width: '40px', 
              height: '40px', 
              minWidth: '40px', 
              minHeight: '40px', 
              maxWidth: '40px', 
              maxHeight: '40px', 
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
                fontSize: '18px', 
                fontFamily: "'Nohemi', sans-serif",
                color: 'var(--foreground)',
                fontWeight: 600,
                lineHeight: 1.2
              }}
              className="truncate"
            >
              {displayName}
            </h2>
          </div>
        )}
      </div>
      
      {/* Right: Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Scope Selector - Compact */}
        <div className="hidden sm:block">
          <HeaderScopeSelector />
        </div>
        
        {/* Search Button */}
        {showSearch && (
          <Button
            variant="ghost"
            size="sm"
            onClick={openSearch}
            className="h-9 w-9 p-0"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </Button>
        )}
        
        {/* Notifications */}
        <div className="relative">
          <EnhancedNotificationCenter />
        </div>
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
export const UnifiedHeaderMobile = memo(UnifiedHeaderMobileComponent, (prevProps, nextProps) => {
  return prevProps.showSearch === nextProps.showSearch;
});





