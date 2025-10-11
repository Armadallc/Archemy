import { useState, useCallback } from 'react';
import { useLocation } from 'wouter';

interface SearchResult {
  id: string;
  type: 'trip' | 'driver' | 'client' | 'location' | 'program' | 'corporate-client';
  title: string;
  subtitle: string;
  description?: string;
  status?: string;
  date?: string;
  icon: React.ReactNode;
  url: string;
  priority: 'high' | 'medium' | 'low';
}

export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();

  const openSearch = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleResultSelect = useCallback((result: SearchResult) => {
    // Navigate to the result URL
    setLocation(result.url);
    closeSearch();
  }, [setLocation, closeSearch]);

  return {
    isOpen,
    openSearch,
    closeSearch,
    handleResultSelect
  };
}
