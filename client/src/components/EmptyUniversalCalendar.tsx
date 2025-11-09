import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight
} from "lucide-react";
import { format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday
} from "date-fns";

export default function EmptyUniversalCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const navigateDate = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const getViewTitle = () => {
    return format(currentDate, 'MMMM yyyy');
  };

  // Get the date range for the calendar grid
  const dateRange = {
    start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 }),
  };

  const days = eachDayOfInterval(dateRange);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Universal Calendar
          </CardTitle>
        </div>

        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate('prev')}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          
          <h3 className="text-lg font-semibold">{getViewTitle()}</h3>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateDate('next')}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

              <CardContent>
                <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
          {/* Header row */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-gray-50 dark:bg-gray-800 p-2 text-center text-sm font-medium">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {days.map(day => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isDayToday = isToday(day);
            
            return (
              <div 
                key={day.toISOString()} 
                className={`
                  bg-white dark:bg-gray-900 p-2 min-h-[100px] border-r border-b border-gray-200 dark:border-gray-700
                  ${!isCurrentMonth ? 'text-gray-400 bg-gray-50 dark:bg-gray-800' : ''}
                  ${isDayToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                `}
              >
                <div className={`
                  text-sm font-medium mb-1 
                  ${isDayToday ? 'text-blue-600 dark:text-blue-400' : ''}
                `}>
                  {format(day, 'd')}
                </div>
                
                {/* Empty day content - no trips */}
                <div className="space-y-1">
                  {/* This is where trip data would go, but it's empty */}
                </div>
              </div>
            );
          })}
        </div>

        {/* Current date info */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-gray-800 dark:text-gray-200 mb-2">
              Today is {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </div>
            <div className="text-xs text-gray-700 dark:text-gray-300">
              Calendar shows {getViewTitle()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
