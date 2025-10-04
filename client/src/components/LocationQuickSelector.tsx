import React, { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { MapPin, Search, Clock, Star } from "lucide-react";
import { useHierarchy } from "../hooks/useHierarchy";
import { apiRequest } from "../lib/queryClient";

interface Location {
  id: string;
  name: string;
  address: string;
  type: 'program_location' | 'frequent_location';
  is_frequent?: boolean;
  last_used?: string;
}

interface LocationQuickSelectorProps {
  onLocationSelect: (location: Location) => void;
  placeholder?: string;
  className?: string;
}

export default function LocationQuickSelector({ 
  onLocationSelect, 
  placeholder = "Select location...",
  className = ""
}: LocationQuickSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const { level, selectedProgram, selectedCorporateClient } = useHierarchy();

  // Fetch locations based on hierarchy level
  useEffect(() => {
    const fetchLocations = async () => {
      if (!selectedProgram && level !== 'corporate') return;
      
      setLoading(true);
      try {
        // Fetch program locations
        const programLocationsResponse = await apiRequest("GET", `/api/locations/program/${selectedProgram}`);
        const programLocations = await programLocationsResponse.json();
        
        // Fetch frequent locations
        const frequentLocationsResponse = await apiRequest("GET", `/api/frequent-locations/program/${selectedProgram}`);
        const frequentLocations = await frequentLocationsResponse.json();
        
        const allLocations = [
          ...programLocations.map((loc: any) => ({
            ...loc,
            type: 'program_location' as const
          })),
          ...frequentLocations.map((loc: any) => ({
            ...loc,
            type: 'frequent_location' as const,
            is_frequent: true
          }))
        ];
        
        setLocations(allLocations);
      } catch (error) {
        console.error('Error fetching locations:', error);
        setLocations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [selectedProgram, level]);

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLocationSelect = (location: Location) => {
    onLocationSelect(location);
    setOpen(false);
    setSearchTerm("");
  };

  const frequentLocations = filteredLocations.filter(loc => loc.is_frequent);
  const programLocations = filteredLocations.filter(loc => !loc.is_frequent);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`w-full justify-between ${className}`}
        >
          <MapPin className="h-4 w-4 mr-2" />
          {placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">
              Loading locations...
            </div>
          ) : (
            <>
              {/* Frequent Locations */}
              {frequentLocations.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <Star className="h-3 w-3" />
                    Frequent Locations
                  </div>
                  {frequentLocations.map((location) => (
                    <div
                      key={location.id}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer rounded"
                      onClick={() => handleLocationSelect(location)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {location.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {location.address}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Frequent
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Program Locations */}
              {programLocations.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    <MapPin className="h-3 w-3" />
                    Program Locations
                  </div>
                  {programLocations.map((location) => (
                    <div
                      key={location.id}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 cursor-pointer rounded"
                      onClick={() => handleLocationSelect(location)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {location.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {location.address}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Program
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {filteredLocations.length === 0 && !loading && (
                <div className="p-4 text-center text-sm text-gray-500">
                  No locations found
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
