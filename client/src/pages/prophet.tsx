/**
 * PROPHET Calculator Page
 * Precision Revenue Outcome Planning for Healthcare Expense Tracking
 */

import React from "react";
import { ProphetCalculator } from "../components/prophet";
import { useAuth } from "../hooks/useAuth";
import { AlertCircle } from "lucide-react";

export default function ProphetPage() {
  const { user } = useAuth();

  // Only allow super_admin
  if (user?.role !== 'super_admin') {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" style={{ color: '#a5c8ca' }} />
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#a5c8ca' }}>Access Denied</h1>
          <p style={{ color: '#a5c8ca', opacity: 0.7 }}>PROPHET Calculator is only available to Super Administrators.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--page-background)' }}>
      <div className="flex-1 flex flex-col overflow-hidden" style={{ padding: '24px' }}>
        <div className="flex-1 overflow-auto min-h-0">
          <ProphetCalculator />
        </div>
      </div>
    </div>
  );
}

