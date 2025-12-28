import React from 'react';
import { Card, CardContent } from '../components/ui/card';
import ChatWidget from '../components/chat/ChatWidget';
import { useAuth } from '../hooks/useAuth';
import { HeaderScopeSelector } from '../components/HeaderScopeSelector';

export default function ChatPage() {
  const { user } = useAuth();
  
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
      <div className="flex-1 flex flex-col overflow-hidden space-y-6" style={{ padding: '24px', backgroundColor: 'var(--background)' }}>
        {/* Header - Match dashboard header structure */}
        <div className="flex-shrink-0">
          <div className="px-6 py-6 rounded-lg card-neu flex items-center justify-between" style={{ backgroundColor: 'var(--background)', border: 'none', height: '150px' }}>
            <div>
              <h1 
                className="font-bold text-foreground" 
                style={{ 
                  fontFamily: "'Nohemi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'",
                  fontSize: '110px'
                }}
              >
                huddle.
              </h1>
            </div>
            <div className="flex items-center gap-6">
              {(user?.role === 'super_admin' || user?.role === 'corporate_admin') && (
                <HeaderScopeSelector />
              )}
            </div>
          </div>
        </div>
        {/* Chat Content - Match header width */}
        <div className="flex-1 overflow-auto min-h-0">
          <div className="card-neu h-full flex flex-col rounded-lg" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <div className="p-0 flex-1 min-h-0 flex flex-col">
              <ChatWidget />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
