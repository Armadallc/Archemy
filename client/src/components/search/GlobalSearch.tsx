import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Clock, User, Car, MapPin, Calendar, Filter } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/queryClient';
import { useHierarchy } from '../../hooks/useHierarchy';
import { format } from 'date-fns';

interface SearchResult {
  id: string;
  type: 'trip' | 'driver' | 'client' | 'location' | 'program' | 'corporate-client';
  title: string;
  subtitle: string;
  description?: string;
  status?: string;
  date?: string;
  icon: React.ReactNode;
  url: string;
  priority: 'high' | 'medium' | 'low';
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onResultSelect?: (result: SearchResult) => void;
}

const getResultIcon = (type: SearchResult['type']) => {
  switch (type) {
    case 'trip': return <Calendar className="h-4 w-4" />;
    case 'driver': return <Car className="h-4 w-4" />;
    case 'client': return <User className="h-4 w-4" />;
    case 'location': return <MapPin className="h-4 w-4" />;
    case 'program': return <Filter className="h-4 w-4" />;
    case 'corporate-client': return <Filter className="h-4 w-4" />;
    default: return <Search className="h-4 w-4" />;
  }
};

const getStatusColor = (status?: string) => {
  if (!status) return 'default';
  switch (status.toLowerCase()) {
    case 'completed': return 'success';
    case 'in_progress': return 'warning';
    case 'scheduled': return 'default';
    case 'cancelled': return 'destructive';
    case 'active': return 'success';
    case 'inactive': return 'secondary';
    default: return 'default';
  }
};

export default function GlobalSearch({ isOpen, onClose, onResultSelect }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { level, selectedProgram, selectedCorporateClient } = useHierarchy();

  // Search function
  const searchEntities = useCallback(async (searchQuery: string): Promise<SearchResult[]> => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];

    setIsLoading(true);
    try {
      const results: SearchResult[] = [];

      // Search trips
      try {
        const tripsResponse = await apiRequest('GET', '/api/trips');
        const trips = await tripsResponse.json();
        
        const tripResults = trips
          .filter((trip: any) => 
            trip.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            trip.pickup_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            trip.dropoff_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            trip.id?.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 5)
          .map((trip: any): SearchResult => ({
            id: trip.id,
            type: 'trip',
            title: trip.client_name || 'Unnamed Trip',
            subtitle: `${trip.pickup_address} → ${trip.dropoff_address}`,
            description: `Scheduled: ${trip.scheduled_pickup_time ? format(new Date(trip.scheduled_pickup_time), 'MMM dd, yyyy HH:mm') : 'Not set'}`,
            status: trip.status,
            date: trip.scheduled_pickup_time,
            icon: getResultIcon('trip'),
            url: `/trips/${trip.id}`,
            priority: trip.status === 'in_progress' ? 'high' : 'medium'
          }));

        results.push(...tripResults);
      } catch (error) {
        console.warn('Error searching trips:', error);
      }

      // Search drivers
      try {
        const driversResponse = await apiRequest('GET', '/api/drivers');
        const drivers = await driversResponse.json();
        
        const driverResults = drivers
          .filter((driver: any) => 
            driver.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            driver.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            driver.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            driver.id?.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 5)
          .map((driver: any): SearchResult => ({
            id: driver.id,
            type: 'driver',
            title: driver.name || 'Unnamed Driver',
            subtitle: driver.email || 'No email',
            description: `Phone: ${driver.phone || 'Not provided'}`,
            status: driver.status || 'active',
            icon: getResultIcon('driver'),
            url: `/drivers/${driver.id}`,
            priority: driver.status === 'active' ? 'high' : 'medium'
          }));

        results.push(...driverResults);
      } catch (error) {
        console.warn('Error searching drivers:', error);
      }

      // Search clients
      try {
        const clientsResponse = await apiRequest('GET', '/api/clients');
        const clients = await clientsResponse.json();
        
        const clientResults = clients
          .filter((client: any) => 
            client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.id?.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .slice(0, 5)
          .map((client: any): SearchResult => ({
            id: client.id,
            type: 'client',
            title: client.name || 'Unnamed Client',
            subtitle: client.email || 'No email',
            description: `Phone: ${client.phone || 'Not provided'}`,
            status: client.status || 'active',
            icon: getResultIcon('client'),
            url: `/clients/${client.id}`,
            priority: 'medium'
          }));

        results.push(...clientResults);
      } catch (error) {
        console.warn('Error searching clients:', error);
      }

      // Sort by priority and relevance
      return results.sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (b.priority === 'high' && a.priority !== 'high') return 1;
        return a.title.localeCompare(b.title);
      });

    } catch (error) {
      console.error('Search error:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [level, selectedProgram, selectedCorporateClient]);

  // Debounced search
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (query.trim().length >= 2) {
      const timeout = setTimeout(async () => {
        const results = await searchEntities(query);
        setSearchResults(results);
        setSelectedIndex(0);
      }, 300);
      setSearchTimeout(timeout);
    } else {
      setSearchResults([]);
      setSelectedIndex(0);
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [query, searchEntities]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (searchResults[selectedIndex]) {
          handleResultSelect(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  const handleResultSelect = (result: SearchResult) => {
    onResultSelect?.(result);
    onClose();
    setQuery('');
    setSearchResults([]);
  };

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20">
      <Card className="w-full max-w-2xl mx-4 shadow-2xl">
        <CardContent className="p-0">
          {/* Search Input */}
          <div className="flex items-center p-4 border-b">
            <Search className="h-5 w-5 text-muted-foreground mr-3" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search trips, drivers, clients..."
              className="flex-1 border-0 shadow-none focus-visible:ring-0 text-lg"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Search Results */}
          <div className="max-h-96">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-muted-foreground">Searching...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <ScrollArea className="max-h-96">
                <div className="p-2">
                  {searchResults.map((result, index) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                        index === selectedIndex
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => handleResultSelect(result)}
                    >
                      <div className="flex-shrink-0 mr-3 text-muted-foreground">
                        {result.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium truncate">{result.title}</h4>
                          <div className="flex items-center space-x-2">
                            {result.status && (
                              <Badge variant={getStatusColor(result.status) as any}>
                                {result.status}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {result.type}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {result.subtitle}
                        </p>
                        {result.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {result.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : query.length >= 2 ? (
              <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                <Search className="h-8 w-8 mb-2" />
                <p>No results found for "{query}"</p>
                <p className="text-sm">Try searching for trips, drivers, or clients</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                <Search className="h-8 w-8 mb-2" />
                <p>Start typing to search...</p>
                <p className="text-sm">Search across trips, drivers, clients, and more</p>
              </div>
            )}
          </div>

          {/* Search Tips */}
          {query.length < 2 && (
            <div className="border-t p-4 bg-muted/50">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <kbd className="px-2 py-1 bg-background border rounded text-xs">↑↓</kbd>
                  <span className="ml-1">Navigate</span>
                </div>
                <div className="flex items-center">
                  <kbd className="px-2 py-1 bg-background border rounded text-xs">Enter</kbd>
                  <span className="ml-1">Select</span>
                </div>
                <div className="flex items-center">
                  <kbd className="px-2 py-1 bg-background border rounded text-xs">Esc</kbd>
                  <span className="ml-1">Close</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}




