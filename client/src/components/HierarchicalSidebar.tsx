import React from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  Users, 
  Car, 
  UserCheck, 
  Calendar,
  Settings,
  BarChart3,
  FileText,
  Bell,
  Code
} from 'lucide-react';
import { Link } from 'wouter';
import { useHierarchy } from '../hooks/useHierarchy';
import { useAuth } from '../hooks/useAuth';
import { DrillDownDropdown } from './DrillDownDropdown';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  permissions: string[];
  levels: Array<'corporate' | 'client' | 'program'>;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/',
    permissions: ['view_calendar'],
    levels: ['corporate', 'client', 'program']
  },
  {
    id: 'trips',
    label: 'Trips',
    icon: MapPin,
    href: '/trips',
    permissions: ['view_trips'],
    levels: ['corporate', 'client', 'program']
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: Users,
    href: '/clients',
    permissions: ['view_clients'],
    levels: ['corporate', 'client', 'program']
  },
  {
    id: 'vehicles',
    label: 'Vehicles',
    icon: Car,
    href: '/vehicles',
    permissions: ['view_vehicles'],
    levels: ['corporate', 'client', 'program']
  },
  {
    id: 'drivers',
    label: 'Drivers',
    icon: UserCheck,
    href: '/drivers',
    permissions: ['view_drivers'],
    levels: ['corporate', 'client', 'program']
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: Calendar,
    href: '/calendar',
    permissions: ['view_calendar'],
    levels: ['corporate', 'client', 'program']
  },
          {
            id: 'calendar-experiment',
            label: 'Experiment',
            icon: Calendar,
            href: '/calendar-experiment',
            permissions: ['view_calendar'],
            levels: ['corporate', 'client', 'program']
          },
          {
            id: 'playground',
            label: 'Playground',
            icon: Code,
            href: '/playground',
            permissions: ['view_calendar'],
            levels: ['corporate', 'client', 'program']
          },
          {
            id: 'shadcn-dashboard',
            label: 'Shadcn Dashboard',
            icon: LayoutDashboard,
            href: '/shadcn-dashboard',
            permissions: ['view_dashboard'],
            levels: ['corporate', 'client', 'program']
          },
          {
            id: 'shadcn-dashboard-migrated',
            label: 'Migrated Dashboard',
            icon: LayoutDashboard,
            href: '/shadcn-dashboard-migrated',
            permissions: ['view_dashboard'],
            levels: ['corporate', 'client', 'program']
          },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    href: '/reports',
    permissions: ['view_reports'],
    levels: ['corporate', 'client', 'program']
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    href: '/notifications',
    permissions: ['view_notifications'],
    levels: ['corporate', 'client', 'program']
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/settings',
    permissions: ['manage_users'],
    levels: ['corporate', 'client', 'program']
  }
];

interface HierarchicalSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function HierarchicalSidebar({ isCollapsed, onToggle }: HierarchicalSidebarProps) {
  const { user } = useAuth();
  const { level, getPageTitle, getBreadcrumbPath, navigateToCorporate } = useHierarchy();

  // Filter navigation items based on user permissions and current level
  const filteredItems = navigationItems.filter(item => {
    // Check if user has required permissions
    const hasPermission = item.permissions.some(permission => {
      // This would need to be implemented with actual permission checking
      return true; // Placeholder for now
    });

    // Check if item is available at current level
    const isAvailableAtLevel = item.levels.includes(level);

    return hasPermission && isAvailableAtLevel;
  });

  const getLevelDescription = () => {
    switch (level) {
      case 'corporate':
        return 'Viewing all corporate clients';
      case 'client':
        return 'Viewing specific corporate client';
      case 'program':
        return 'Viewing specific program';
      default:
        return '';
    }
  };

  return (
    <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">
              {getPageTitle()}
            </h2>
            <p className="text-sm text-gray-500">
              {getBreadcrumbPath()}
            </p>
            <p className="text-xs text-gray-400">
              {getLevelDescription()}
            </p>
          </div>
        )}
      </div>

      {/* Drill-down Navigation */}
      <div className="p-4 border-b border-gray-200">
        <DrillDownDropdown />
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-1">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          
          // Special handling for Dashboard button - reset to default state
          if (item.id === 'dashboard') {
            return (
              <Link
                key={item.id}
                to={item.href}
                onClick={() => {
                  // Reset hierarchy to user's default level
                  if (user?.role === 'super_admin') {
                    navigateToCorporate();
                  }
                  // For other roles, the hierarchy will be reset by the route change
                }}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isCollapsed 
                    ? 'justify-center' 
                    : 'justify-start'
                } text-gray-700 hover:bg-gray-100 hover:text-gray-900`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </Link>
            );
          }
          
          // Regular navigation items
          return (
            <Link
              key={item.id}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isCollapsed 
                  ? 'justify-center' 
                  : 'justify-start'
              } text-gray-700 hover:bg-gray-100 hover:text-gray-900`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed && (
          <div className="text-xs text-gray-500">
            <div>Level: {level}</div>
            <div>Role: {user?.role}</div>
          </div>
        )}
      </div>
    </div>
  );
}


