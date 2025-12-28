import React from "react";
import { useAuth } from "../hooks/useAuth";
import { HeaderScopeSelector } from "../components/HeaderScopeSelector";
import { RollbackManager } from "../utils/rollback-manager";
import SimpleBookingForm from "../components/booking/simple-booking-form";

export default function NewTripPage() {
  const { user } = useAuth();
  const ENABLE_UNIFIED_HEADER = RollbackManager.isUnifiedHeaderEnabled();

  return (
    <div className="flex-1 overflow-auto mobile-optimized pb-20 md:pb-0">
      <div className="flex-1 overflow-auto p-6" style={{ backgroundColor: 'var(--background)' }}>
        <div className="space-y-6">
          {/* Page Header - Only show if unified header is disabled (fallback) */}
          {!ENABLE_UNIFIED_HEADER && (
            <div>
              <div className="px-6 py-6 rounded-lg card-neu card-glow-border flex items-center justify-between" style={{ backgroundColor: 'var(--background)', border: 'none', height: '150px' }}>
                <div>
                  <h1 
                    className="font-bold text-foreground" 
                    style={{ 
                      fontFamily: "'Nohemi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'",
                      fontSize: '110px'
                    }}
                  >
                    new trip.
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                  {(user?.role === 'super_admin' || user?.role === 'corporate_admin') && (
                    <HeaderScopeSelector />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Booking Form */}
          <div>
            <SimpleBookingForm />
          </div>
        </div>
      </div>
    </div>
  );
}

