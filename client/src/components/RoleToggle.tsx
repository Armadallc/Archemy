import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from './ui/dropdown-menu';
import { 
  ChevronDown, 
  User, 
  Building2, 
  Users, 
  Car,
  Shield,
  TestTube
} from 'lucide-react';

interface RoleToggleProps {
  currentRole: string;
  onRoleChange: (role: string, userContext: any) => void;
  isDevelopment?: boolean;
}

// Mock user contexts for testing different roles
const mockUserContexts = {
  super_admin: {
    user_id: 'super_admin_monarch_1758946085586',
    user_name: 'Super Admin',
    email: 'admin@monarch.com',
    role: 'super_admin',
    primary_program_id: null,
    corporate_client_id: null,
    program_id: null,
    level: 'corporate'
  },
  corporate_admin: {
    user_id: 'corporate_admin_monarch_1758946085586',
    user_name: 'Corporate Admin',
    email: 'corp@monarch.com',
    role: 'corporate_admin',
    primary_program_id: null,
    corporate_client_id: 'monarch',
    program_id: null,
    level: 'corporate'
  },
  program_admin: {
    user_id: 'program_admin_monarch_1758946085586',
    user_name: 'Program Admin',
    email: 'program@monarch.com',
    role: 'program_admin',
    primary_program_id: 'monarch_competency',
    corporate_client_id: 'monarch',
    program_id: 'monarch_competency',
    level: 'program'
  },
  driver: {
    user_id: 'driver_monarch_1758946085586',
    user_name: 'John Driver',
    email: 'driver@monarch.com',
    role: 'driver',
    primary_program_id: 'monarch_competency',
    corporate_client_id: 'monarch',
    program_id: 'monarch_competency',
    level: 'program'
  }
};

const roleConfig = {
  super_admin: {
    label: 'Super Admin',
    icon: Shield,
    color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    description: 'System-wide access'
  },
  corporate_admin: {
    label: 'Corporate Admin',
    icon: Building2,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    description: 'Corporate-level access'
  },
  program_admin: {
    label: 'Program Admin',
    icon: Users,
    color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    description: 'Program-level access'
  },
  driver: {
    label: 'Driver',
    icon: Car,
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    description: 'Driver access'
  }
};

export default function RoleToggle({ currentRole, onRoleChange, isDevelopment = false }: RoleToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Don't render in production
  if (!isDevelopment) {
    return null;
  }

  const currentConfig = roleConfig[currentRole as keyof typeof roleConfig];
  const CurrentIcon = currentConfig?.icon || User;

  const handleRoleChange = (role: string) => {
    const userContext = mockUserContexts[role as keyof typeof mockUserContexts];
    onRoleChange(role, userContext);
    setIsOpen(false);
  };

  return (
    <div className="flex items-center space-x-2">
      <Badge variant="outline" className="bg-yellow-50 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
        <TestTube className="w-3 h-3 mr-1" />
        DEV
      </Badge>
      
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center space-x-2 min-w-[140px] justify-between"
          >
            <div className="flex items-center space-x-2">
              <CurrentIcon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {currentConfig?.label || 'Unknown Role'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Switch User Role
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Development testing only
            </p>
          </div>
          
          <DropdownMenuSeparator />
          
          {Object.entries(roleConfig).map(([role, config]) => {
            const Icon = config.icon;
            const isActive = role === currentRole;
            
            return (
              <DropdownMenuItem
                key={role}
                onClick={() => handleRoleChange(role)}
                className={`flex items-center space-x-3 px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  isActive ? 'bg-gray-100 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'
                }`}
              >
                <div className={`p-1 rounded ${config.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{config.label}</span>
                    {isActive && (
                      <Badge variant="secondary" className="text-xs text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-600">
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {config.description}
                  </p>
                </div>
              </DropdownMenuItem>
            );
          })}
          
          <DropdownMenuSeparator />
          
          <div className="px-3 py-2">
            <p className="text-xs text-gray-600 dark:text-gray-300">
              This toggle only works in development mode
            </p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
