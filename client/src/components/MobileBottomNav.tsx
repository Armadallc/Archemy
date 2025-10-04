import React from "react";
import { Home, Route, LogOut, User } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useLocation } from "wouter";

export default function MobileBottomNav() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const isDriver = user?.role === 'driver';

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 safe-area-pb">
      <div className="flex justify-around items-center">
        <button
          onClick={() => setLocation('/')}
          className={`flex flex-col items-center p-2 ${
            location === '/' ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs mt-1">Home</span>
        </button>
        
        {isDriver && (
          <button
            onClick={() => setLocation('/trips')}
            className={`flex flex-col items-center p-2 ${
              location === '/trips' ? 'text-blue-600' : 'text-gray-500'
            }`}
          >
            <Route className="w-5 h-5" />
            <span className="text-xs mt-1">Trips</span>
          </button>
        )}
        
        <button
          onClick={() => setLocation('/settings')}
          className={`flex flex-col items-center p-2 ${
            location === '/settings' ? 'text-blue-600' : 'text-gray-500'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-xs mt-1">Profile</span>
        </button>
        
        <button
          onClick={handleLogout}
          className="flex flex-col items-center p-2 text-gray-500"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-xs mt-1">Logout</span>
        </button>
      </div>
    </div>
  );
}