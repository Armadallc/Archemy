import React, { createContext, useContext, useState, type ReactNode } from 'react';

// Mock user interface for testing
export interface MockUser {
  user_id: string;
  user_name: string;
  email: string;
  role: 'super_admin' | 'corporate_admin' | 'program_admin' | 'program_user' | 'driver';
  primary_program_id?: string | null;
  corporate_client_id?: string | null;
  program_id?: string | null;
  level?: string;
  avatar_url?: string;
}

interface MockAuthContextType {
  mockUser: MockUser | null;
  setMockUser: (user: MockUser | null) => void;
  isMockMode: boolean;
  setIsMockMode: (enabled: boolean) => void;
}

const MockAuthContext = createContext<MockAuthContextType | null>(null);

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [mockUser, setMockUser] = useState<MockUser | null>(null);
  const [isMockMode, setIsMockMode] = useState(false);

  return (
    <MockAuthContext.Provider value={{ 
      mockUser, 
      setMockUser, 
      isMockMode, 
      setIsMockMode 
    }}>
      {children}
    </MockAuthContext.Provider>
  );
}

export function useMockAuth() {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error('useMockAuth must be used within a MockAuthProvider');
  }
  return context;
}
