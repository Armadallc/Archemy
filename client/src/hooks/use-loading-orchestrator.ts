import { useState, useEffect } from 'react';
import { useLayout } from '../contexts/layout-context';

export function useLoadingOrchestrator() {
  const layout = useLayout();
  const [pageLoadStart] = useState(Date.now());

  // Simulate coordinated loading
  useEffect(() => {
    // Set header loading briefly
    layout.setLoadingState('header', true);
    const headerTimer = setTimeout(() => {
      layout.setLoadingState('header', false);
    }, 500); // Header loads fast

    // Page content loads after header
    const contentTimer = setTimeout(() => {
      layout.setLoadingState('content', false);
    }, 1000);

    return () => {
      clearTimeout(headerTimer);
      clearTimeout(contentTimer);
    };
  }, [layout]);

  // Calculate progress based on time
  const progress = Math.min((Date.now() - pageLoadStart) / 2000, 1) * 100;

  return {
    isHeaderLoading: layout.isLoading.header,
    isContentLoading: layout.isLoading.content,
    isGlobalLoading: layout.isLoading.global,
    progress,
  };
}





