import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { 
  Home, 
  Calendar, 
  Truck, 
  Users, 
  Plus,
  Settings,
  User
} from "lucide-react";

interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    path: "/dashboard",
    icon: Home,
    label: "Dashboard",
    roles: ["driver", "organization_admin", "organization_user", "super_admin", "monarch_owner"]
  },
  {
    path: "/trips",
    icon: Calendar,
    label: "Trips",
    roles: ["organization_admin", "organization_user", "super_admin", "monarch_owner"]
  },
  {
    path: "/trips/new",
    icon: Plus,
    label: "New Trip",
    roles: ["organization_admin", "organization_user", "super_admin", "monarch_owner"]
  },
  {
    path: "/drivers",
    icon: Truck,
    label: "Drivers",
    roles: ["organization_admin", "super_admin", "monarch_owner"]
  },
  {
    path: "/clients",
    icon: Users,
    label: "Clients",
    roles: ["organization_admin", "organization_user", "super_admin", "monarch_owner"]
  }
];

export default function MobileNavigation() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user.role)
  );

  // Show profile/settings as last item for all users
  const profileItem = {
    path: "/profile",
    icon: User,
    label: "Profile",
    roles: ["driver", "organization_admin", "organization_user", "super_admin", "monarch_owner"]
  };

  const allItems = [...filteredNavItems, profileItem];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="flex justify-around items-center py-2 px-1">
        {allItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path || 
            (item.path === "/dashboard" && location === "/");
          
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