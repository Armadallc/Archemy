import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LoadingStates {
  header: boolean;
  content: boolean;
  global: boolean;
}

interface LayoutContextType {
  isHeaderVisible: boolean;
  isSidebarVisible: boolean;
  isSidebarCollapsed: boolean;
  isLoading: LoadingStates;
  setHeaderVisibility: (visible: boolean) => void;
  setSidebarVisibility: (visible: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setLoadingState: (area: 'header' | 'content' | 'global', loading: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    header: false,
    content: false,
    global: false,
  });

  const setHeaderVisibility = (visible: boolean) => {
    setIsHeaderVisible(visible);
  };

  const setSidebarVisibility = (visible: boolean) => {
    setIsSidebarVisible(visible);
  };

  const toggleSidebarCollapsed = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  const setLoadingState = (area: 'header' | 'content' | 'global', loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [area]: loading,
    }));
  };

  const value: LayoutContextType = {
    isHeaderVisible,
    isSidebarVisible,
    isSidebarCollapsed,
    isLoading: loadingStates,
    setHeaderVisibility,
    setSidebarVisibility,
    toggleSidebarCollapsed,
    setLoadingState,
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
