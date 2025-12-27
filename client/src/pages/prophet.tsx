/**
 * PROPHET Calculator Page
 * Precision Revenue Outcome Planning for Healthcare Expense Tracking
 */

import React from "react";
import { ProphetCalculator } from "../components/prophet";
import { useAuth } from "../hooks/useAuth";
import { usePageAccess } from "../hooks/use-page-access";
import { AlertCircle } from "lucide-react";

export default function ProphetPage() {
  // Check page access - super_admin only
  usePageAccess({ permission: "manage_users" });
  
  const { user } = useAuth();

  // Only allow super_admin
  if (user?.role !== 'super_admin') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">PROPHET Calculator is only available to Super Administrators.</p>
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

