import React, { useState, ReactNode } from 'react';
import { Button } from '../components/ui/button';
import { LayoutDashboard, Code, Sun, Moon, Monitor, Tablet, Smartphone, X, Calendar, Plus, ChevronLeft, ChevronRight, List, DollarSign, Users, CreditCard, Activity, BarChart3, Download } from 'lucide-react';
import { Link } from 'wouter';
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

interface PlaygroundComponent {
  id: string;
  name: string;
  code: string;
  component: ReactNode;
}

// Shadcn Dashboard Example Component
const ShadcnDashboardExample = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Mock data for the dashboard
  const mockData = {
    totalRevenue: 45231.89,
    subscriptions: 2350,
    sales: 12234,
    activeNow: 573,
    recentSales: [
      { id: 1, customer: "Olivia Martin", email: "olivia@example.com", amount: 1999.00, status: "completed" },
      { id: 2, customer: "Jackson Lee", email: "jackson@example.com", amount: 39.00, status: "processing" },
      { id: 3, customer: "Isabella Nguyen", email: "isabella@example.com", amount: 299.00, status: "completed" },
      { id: 4, customer: "William Kim", email: "william@example.com", amount: 99.00, status: "completed" },
      { id: 5, customer: "Sofia Davis", email: "sofia@example.com", amount: 39.00, status: "failed" },
    ],
    chartData: [
      { month: "January", desktop: 186, mobile: 80 },
      { month: "February", desktop: 305, mobile: 200 },
      { month: "March", desktop: 237, mobile: 120 },
      { month: "April", desktop: 73, mobile: 190 },
      { month: "May", desktop: 209, mobile: 130 },
      { month: "June", desktop: 214, mobile: 140 },
    ]
  };

  // Section Cards Component
  const SectionCards = () => (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${mockData.totalRevenue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">+20.1% from last month</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{mockData.subscriptions.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">+180.1% from last month</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sales</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{mockData.sales.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">+19% from last month</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Now</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{mockData.activeNow}</div>
          <p className="text-xs text-muted-foreground">+201 since last hour</p>
        </CardContent>
      </Card>
    </div>
  );

  // Chart Component
  const ChartAreaInteractive = () => (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px] w-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Interactive Chart Component</p>
            <p className="text-sm text-gray-400">Chart.js or Recharts would be integrated here</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Data Table Component
  const DataTable = () => (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sales</CardTitle>
        <p className="text-sm text-muted-foreground">You made 265 sales this month.</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockData.recentSales.map((sale) => (
            <div key={sale.id} className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{sale.customer}</p>
                <p className="text-sm text-muted-foreground">{sale.email}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={sale.status === 'completed' ? 'default' : sale.status === 'processing' ? 'secondary' : 'destructive'}>
                  {sale.status}
                </Badge>
                <div className="text-sm font-medium">+${sale.amount.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Here's what's happening with your business today.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Sale
          </Button>
        </div>
      </div>
      
      <SectionCards />
      <ChartAreaInteractive />
      <DataTable />
    </div>
  );
};

// Big Calendar Example Component - Full Implementation
const BigCalendarExample = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day' | 'year' | 'agenda'>('month');
  
  // Mock data structure matching Big Calendar
  const mockEvents = [
    {
      id: 1,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      title: "Team Meeting",
      description: "Weekly team standup",
      color: "blue" as const,
      user: { id: "1", name: "John Doe", picturePath: null }
    },
    {
      id: 2,
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
      title: "Client Call",
      description: "Discuss project requirements",
      color: "green" as const,
      user: { id: "2", name: "Jane Smith", picturePath: null }
    },
    {
      id: 3,
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
      title: "Project Review",
      description: "Monthly project review meeting",
      color: "purple" as const,
      user: { id: "1", name: "John Doe", picturePath: null }
    }
  ];

  const mockUsers = [
    { id: "1", name: "John Doe", picturePath: null },
    { id: "2", name: "Jane Smith", picturePath: null }
  ];

  // Calendar header component
  const CalendarHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Big calendar</h1>
        </div>
        <p className="text-sm text-gray-600">Built with Next.js and Tailwind by lramos33</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">View on GitHub</Button>
        <Button variant="ghost" size="icon">
          <Sun className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  // Calendar controls component
  const CalendarControls = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="bg-gray-800 text-white px-3 py-1 rounded text-sm font-medium">
          {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
        </div>
        <div className="text-sm">
          <div className="font-medium">{selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
          <div className="text-gray-600">{mockEvents.length} events</div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {view === 'month' && selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {view === 'week' && `${new Date(selectedDate.getTime() - selectedDate.getDay() * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(selectedDate.getTime() + (6 - selectedDate.getDay()) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
            {view === 'day' && selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          {['agenda', 'day', 'week', 'month', 'year'].map((viewType) => (
            <Button
              key={viewType}
              variant={view === viewType ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setView(viewType as any)}
              className={view === viewType ? 'bg-gray-800 text-white' : ''}
            >
              {viewType === 'agenda' && <List className="h-4 w-4" />}
              {viewType === 'day' && <Calendar className="h-4 w-4" />}
              {viewType === 'week' && <Calendar className="h-4 w-4" />}
              {viewType === 'month' && <Calendar className="h-4 w-4" />}
              {viewType === 'year' && <Calendar className="h-4 w-4" />}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="sm">L M +2 All</Button>
        <Button className="bg-black text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>
    </div>
  );

  // Month view component
  const MonthView = () => {
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    const startOfWeek = new Date(startOfMonth);
    startOfWeek.setDate(startOfMonth.getDate() - startOfMonth.getDay());
    
    const days = [];
    const current = new Date(startOfWeek);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    const getEventsForDay = (date: Date) => {
      return mockEvents.filter(event => {
        const eventDate = new Date(event.startDate);
        return eventDate.toDateString() === date.toDateString();
      });
    };

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 bg-gray-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center font-medium text-gray-600 border-r border-b">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            const dayEvents = getEventsForDay(day);
            
            return (
              <div key={index} className={`min-h-[120px] p-2 border-r border-b ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}`}>
                <div className={`text-sm font-medium mb-1 ${isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded truncate ${
                        event.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                        event.color === 'green' ? 'bg-green-100 text-green-800' :
                        event.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500">+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Week view component
  const WeekView = () => {
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }

    const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-8 bg-gray-50">
          <div className="p-2 border-r"></div>
          {days.map(day => (
            <div key={day.toISOString()} className="p-2 text-center border-r">
              <div className="text-sm font-medium">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div className="text-lg font-bold">{day.getDate()}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-8">
          <div className="border-r">
            {hours.map(hour => (
              <div key={hour} className="h-12 p-2 text-xs text-gray-600 border-b">
                {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </div>
            ))}
          </div>
          {days.map(day => (
            <div key={day.toISOString()} className="border-r">
              {hours.map(hour => (
                <div key={hour} className="h-12 border-b relative">
                  {/* Event blocks would go here */}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Day view component
  const DayView = () => {
    const hours = Array.from({ length: 12 }, (_, i) => i + 8);
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();

    return (
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-2">
          <div className="border-r">
            <div className="p-4 bg-gray-50 border-b">
              <div className="text-lg font-bold">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
            </div>
            <div>
              {hours.map(hour => (
                <div key={hour} className="h-16 p-2 text-xs text-gray-600 border-b relative">
                  <div className="absolute left-2 top-2">
                    {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                  </div>
                  {currentHour === hour && (
                    <div 
                      className="absolute left-0 right-0 bg-red-500 h-0.5 z-10"
                      style={{ top: `${(currentMinute / 60) * 100}%` }}
                    >
                      <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="p-4">
            <div className="text-sm text-gray-600 mb-4">Happening now</div>
            <div className="space-y-2">
              {mockEvents.map(event => (
                <div key={event.id} className="p-3 border rounded-lg">
                  <div className="font-medium">{event.title}</div>
                  <div className="text-sm text-gray-600">{event.user.name}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(event.startDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - 
                    {new Date(event.endDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Agenda view component
  const AgendaView = () => {
    const groupedEvents = mockEvents.reduce((acc, event) => {
      const date = new Date(event.startDate).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(event);
      return acc;
    }, {} as Record<string, typeof mockEvents>);

    return (
      <div className="space-y-6">
        {Object.entries(groupedEvents).map(([date, events]) => (
          <div key={date}>
            <div className="text-lg font-semibold mb-3">
              {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <div className="space-y-2">
              {events.map(event => (
                <div key={event.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div 
                    className={`w-4 h-4 rounded-full ${
                      event.color === 'blue' ? 'bg-blue-500' :
                      event.color === 'green' ? 'bg-green-500' :
                      event.color === 'purple' ? 'bg-purple-500' :
                      'bg-gray-500'
                    }`}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-gray-600">{event.description}</div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(event.startDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - 
                    {new Date(event.endDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </div>
                  <Badge variant="secondary">{event.user.name}</Badge>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <CalendarHeader />
      <CalendarControls />
      
      <div className="bg-white rounded-lg border">
        {view === 'month' && <MonthView />}
        {view === 'week' && <WeekView />}
        {view === 'day' && <DayView />}
        {view === 'agenda' && <AgendaView />}
        {view === 'year' && (
          <div className="p-8 text-center text-gray-500">
            Year view - 12 month grid would be implemented here
          </div>
        )}
      </div>
    </div>
  );
};

export default function Playground() {
  const [components, setComponents] = useState<PlaygroundComponent[]>([]);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showCode, setShowCode] = useState(false);

  const addShadcnDashboard = () => {
    const newComponent: PlaygroundComponent = {
      id: `shadcn-dashboard-${Date.now()}`,
      name: 'Shadcn Dashboard Example',
      code: `// Shadcn Dashboard Component Example
// Based on the official shadcn/ui dashboard example
// https://github.com/shadcn-ui/ui/tree/fbcc665b49f48cb2cd3339ac1a86396954a5632a/apps/v4/app/(examples)/dashboard

const mockData = {
  totalRevenue: 45231.89,
  subscriptions: 2350,
  sales: 12234,
  activeNow: 573,
  recentSales: [
    { id: 1, customer: "Olivia Martin", email: "olivia@example.com", amount: 1999.00, status: "completed" },
    { id: 2, customer: "Jackson Lee", email: "jackson@example.com", amount: 39.00, status: "processing" },
    // ... more sales data
  ]
};

// Features:
// - Statistics cards with icons and metrics
// - Interactive chart placeholder
// - Data table with status badges
// - Responsive grid layout
// - Modern shadcn/ui styling`,
      component: <ShadcnDashboardExample />,
    };
    setComponents((prev) => [...prev, newComponent]);
  };

  const addBigCalendarExample = () => {
    const newComponent: PlaygroundComponent = {
      id: `big-calendar-${Date.now()}`,
      name: 'Big Calendar Example',
      code: `// Big Calendar Component Example
// This demonstrates the data structure and basic functionality
// from the lramos33/big-calendar repository

const mockEvents = [
  {
    id: 1,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    title: "Team Meeting",
    description: "Weekly team standup",
    color: "blue",
    user: { id: "1", name: "John Doe", picturePath: null }
  }
];

const mockUsers = [
  { id: "1", name: "John Doe", picturePath: null },
  { id: "2", name: "Jane Smith", picturePath: null }
];`,
      component: <BigCalendarExample />,
    };
    setComponents((prev) => [...prev, newComponent]);
  };

  const addSampleComponent = () => {
    const newComponent: PlaygroundComponent = {
      id: `sample-${Date.now()}`,
      name: `Sample Component ${components.length + 1}`,
      code: `// Example code for Sample Component ${components.length + 1}\n<div>Hello from Sample!</div>`,
      component: (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Sample Card</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This is a sample component in the playground.</p>
            <Button className="mt-4">Click Me</Button>
          </CardContent>
        </Card>
      ),
    };
    setComponents((prev) => [...prev, newComponent]);
  };

  const clearCanvas = () => {
    setComponents([]);
  };

  const getViewportClass = () => {
    switch (viewMode) {
      case 'tablet':
        return 'w-[768px] mx-auto border-x-4 border-gray-300 shadow-lg';
      case 'mobile':
        return 'w-[375px] mx-auto border-x-4 border-gray-300 shadow-lg';
      case 'desktop':
      default:
        return 'w-full';
    }
  };

  return (
    <div className={`flex flex-col h-full ${theme === 'dark' ? 'dark bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Header/Controls */}
      <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
            <LayoutDashboard className="h-5 w-5" />
            Back to Dashboard
          </Link>
          <h1 className="text-xl font-semibold ml-4">Component Playground</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Viewport Controls */}
          <ToggleGroup type="single" value={viewMode} onValueChange={(value: 'desktop' | 'tablet' | 'mobile') => setViewMode(value)} aria-label="View mode">
            <ToggleGroupItem value="desktop" aria-label="Desktop view">
              <Monitor className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="tablet" aria-label="Tablet view">
              <Tablet className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="mobile" aria-label="Mobile view">
              <Smartphone className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Theme Toggle */}
          <Button variant="outline" size="icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

                  <Button onClick={addShadcnDashboard} className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Add Dashboard
                  </Button>
                  <Button onClick={addBigCalendarExample} className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Add Big Calendar
                  </Button>
          <Button onClick={addSampleComponent}>Add Sample Component</Button>
          <Button variant="outline" onClick={clearCanvas}>Clear Canvas</Button>
          <Button variant="outline" onClick={() => setShowCode(!showCode)}>
            <Code className="h-4 w-4 mr-2" />
            {showCode ? 'Hide Code' : 'Show Code'}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-6">
        <div className={`transition-all duration-300 ${getViewportClass()} h-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 flex flex-col gap-6 bg-white dark:bg-gray-800`}>
          {components.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-20">
              <Code className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Import components here to test them out!</p>
              <p className="text-sm">Use the "Add Big Calendar" or "Add Sample Component" buttons to get started.</p>
            </div>
          ) : (
            components.map((comp) => (
              <div key={comp.id} className="relative border rounded-md p-4 bg-background dark:bg-gray-700 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">{comp.name}</h3>
                  <Button variant="ghost" size="icon" onClick={() => setComponents(prev => prev.filter(c => c.id !== comp.id))}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mb-4">
                  {comp.component}
                </div>
                {showCode && (
                  <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-xs overflow-x-auto">
                    <code>{comp.code}</code>
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}