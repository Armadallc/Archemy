import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';

interface EmergencyButtonProps {
  driverName?: string;
  currentTripId?: string;
  className?: string;
}

export const EmergencyButton: React.FC<EmergencyButtonProps> = ({ 
  driverName = 'Driver', 
  currentTripId,
  className = ''
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  const handlePressIn = () => {
    console.log('🚨 Emergency button pressed - starting 3-second countdown');
    
    setIsPressed(true);
    setHoldProgress(0);
    setCountdown(3);
    
    // Start countdown
    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          handleEmergency();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Start progress animation
    progressRef.current = setInterval(() => {
      setHoldProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressRef.current!);
          return 100;
        }
        return prev + (100 / 30); // 3 seconds = 30 intervals of 100ms
      });
    }, 100);
  };

  const handlePressOut = () => {
    console.log('🚨 Emergency button released - cancelling countdown');
    
    setIsPressed(false);
    setHoldProgress(0);
    setCountdown(3);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  };

  const handleEmergency = async () => {
    try {
      console.log('🚨 Emergency activated - calling 911 and sending alerts');
      
      // 1. Call 911 immediately (web version - opens phone dialer)
      window.open('tel:911', '_self');
      
      // 2. Get current location (simplified for now)
      const location = {
        latitude: 40.7128, // This would be replaced with actual GPS
        longitude: -74.0060,
        address: 'Current Location'
      };
      
      // 3. Send emergency alert to admins
      await sendEmergencyAlert(location);
      
      // 4. Show confirmation
      alert('Emergency Alerted: 911 has been called and admins have been notified');
      
      console.log('🚨 Emergency alert completed successfully');
      
    } catch (error) {
      console.error('❌ Error during emergency activation:', error);
      alert('Error: Failed to activate emergency. Please call 911 manually.');
    }
  };

  const sendEmergencyAlert = async (location: any) => {
    try {
      // Call the backend API to send SMS alerts
      console.log('🚨 Emergency alert data prepared:', {
        driverName,
        location,
        tripId: currentTripId,
        timestamp: new Date().toISOString()
      });
      
      const response = await fetch('/api/emergency/panic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ 
          location, 
          tripId: currentTripId 
        })
      });
      
      if (!response.ok) {
        throw new Error(`Emergency alert failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('🚨 Emergency alert sent successfully:', result);
      
    } catch (error) {
      console.error('❌ Failed to send emergency alert:', error);
      throw error;
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      <div className="relative">
        <Button
          className={`
            w-60 h-60 rounded-full bg-red-500 hover:bg-red-600 
            text-white font-bold shadow-lg text-[144px] leading-none
            transition-all duration-200 ease-in-out select-none
            ${isPressed ? 'scale-95 bg-red-600' : 'scale-100'}
            flex items-center justify-center
            border-4 border-red-600
          `}
          onMouseDown={handlePressIn}
          onMouseUp={handlePressOut}
          onMouseLeave={handlePressOut}
          onTouchStart={handlePressIn}
          onTouchEnd={handlePressOut}
        >
          *
          {isPressed && (
            <div className="absolute -top-10 -right-10 w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-red-500 text-5xl font-bold">{countdown}</span>
            </div>
          )}
        </Button>
        
        {isPressed && (
          <div className="w-60 h-4 bg-gray-200 rounded-full mt-4 overflow-hidden">
            <div 
              className={`h-full bg-red-500 rounded-full transition-all duration-100 ease-linear`}
              style={{ width: `${holdProgress}%` }}
            />
          </div>
        )}
      </div>
      
      <div className="text-center">
        <p className="text-2xl text-gray-600 font-semibold">Hold for Emergency</p>
        <p className="text-sm text-gray-500 mt-1">Press and hold for 3 seconds</p>
      </div>
    </div>
  );
};
