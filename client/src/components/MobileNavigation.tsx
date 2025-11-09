import React from "react";
import { useLocation } from "wouter";
import { useAuth } from "../hooks/useAuth";
import { 
  Home, 
  Calendar, 
  Truck, 
  Users, 
  Plus,
  Settings,
  User,
  MapPin,
  Building,
  Building2,
  Users2,
  Shield
} from "lucide-react";

interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    path: "/",
    icon: Home,
    label: "Dashboard",
    roles: ["driver", "program_admin", "program_user", "super_admin", "corporate_admin"]
  },
  {
    path: "/trips",
    icon: Calendar,
    label: "Trips",
    roles: ["program_admin", "program_user", "super_admin", "corporate_admin"]
  },
  {
    path: "/clients",
    icon: Users,
    label: "Clients",
    roles: ["program_admin", "program_user", "super_admin", "corporate_admin"]
  },
  {
    path: "/client-groups",
    icon: Users2,
    label: "Groups",
    roles: ["program_admin", "program_user", "super_admin", "corporate_admin"]
  },
  {
    path: "/drivers",
    icon: Truck,
    label: "Drivers",
    roles: ["program_admin", "super_admin", "corporate_admin"]
  },
  {
    path: "/locations",
    icon: MapPin,
    label: "Locations",
    roles: ["program_admin", "super_admin", "corporate_admin"]
  },
  {
    path: "/programs",
    icon: Building,
    label: "Programs",
    roles: ["super_admin", "corporate_admin"]
  },
  {
    path: "/corporate-clients",
    icon: Building2,
    label: "Clients",
    roles: ["super_admin"]
  },
  {
    path: "/permissions",
    icon: Shield,
    label: "Permissions",
    roles: ["super_admin"]
  }
];

export default function MobileNavigation() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();

  // Only render on mobile devices
  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    return null;
  }

  if (!user) return null;

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user.role)
  );

  // Show settings as last item for all users
  const settingsItem = {
    path: "/settings",
    icon: Settings,
    label: "Settings",
    roles: ["driver", "program_admin", "program_user", "super_admin", "corporate_admin"]
  };

  const allItems = [...filteredNavItems, settingsItem];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="flex justify-around items-center py-2 px-1">
        {allItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path || 
            (item.path === "/" && location === "/");
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`
                flex flex-col items-center justify-center p-2 rounded-lg transition-colors
                min-w-0 flex-1 max-w-20
                ${isActive 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium truncate">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Safe area padding for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-white"></div>
    </nav>
  );
}