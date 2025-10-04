import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { 
  Calendar, 
  Filter, 
  Plus, 
  Download, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  Map
} from "lucide-react";
import { Link } from "wouter";
import EnhancedTripCalendar from "../components/EnhancedTripCalendar";
import { useAuth } from "../hooks/useAuth";
import { useHierarchy } from "../hooks/useHierarchy";

export default function CalendarPage() {
  const { user } = useAuth();
  const { level, selectedProgram, selectedCorporateClient } = useHierarchy();
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'map'>('calendar');

  const getPageTitle = () => {
    if (level === 'corporate') {
      return "Universal Calendar";
    } else if (level === 'program' && selectedProgram) {
      return `${selectedProgram} Calendar`;
    } else if (level === 'client' && selectedCorporateClient) {
      return `${selectedCorporateClient} Calendar`;
    }
    return "Trip Calendar";
  };

  const getSubtitle = () => {
    if (level === 'corporate') {
      return "All trips across all programs and corporate clients";
    } else if (level === 'program' && selectedProgram) {
      return `Trips for ${selectedProgram} program`;
    } else if (level === 'client' && selectedCorporateClient) {
      return `Trips for ${selectedCorporateClient} corporate client`;
    }
    return "Manage and view all trips";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Calendar className="h-8 w-8 mr-3" />
            {getPageTitle()}
          </h1>
          <p className="text-muted-foreground mt-1">
            {getSubtitle()}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4 mr-1" />
              Calendar
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none border-x"
            >
              <List className="h-4 w-4 mr-1" />
              List
            </Button>
            <Button
              variant={viewMode === 'map' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('map')}
              className="rounded-l-none"
            >
              <Map className="h-4 w-4 mr-1" />
              Map
            </Button>
          </div>

          {/* Action Buttons */}
          <Button asChild>
            <Link to="/trips/new">
              <Plus className="h-4 w-4 mr-2" />
              New Trip
            </Link>
          </Button>
          
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button variant="outline">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              {viewMode === 'calendar' && 'Trip Calendar'}
              {viewMode === 'list' && 'Trip List'}
              {viewMode === 'map' && 'Trip Map'}
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {level === 'corporate' ? 'Universal View' : 
                 level === 'program' ? 'Program View' : 
                 level === 'client' ? 'Corporate View' : 'Default View'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {viewMode === 'calendar' && (
            <div className="space-y-4">
              <EnhancedTripCalendar />
            </div>
          )}
          
          {viewMode === 'list' && (
            <div className="text-center text-gray-500 py-12">
              <List className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">List View</h3>
              <p className="text-sm">Trip list view will be implemented here</p>
            </div>
          )}
          
          {viewMode === 'map' && (
            <div className="text-center text-gray-500 py-12">
              <Map className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">Map View</h3>
              <p className="text-sm">Interactive trip map will be implemented here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Trips</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <div className="h-8 w-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">→</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold">1</p>
              </div>
              <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">⏰</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
