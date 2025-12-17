import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Folder, 
  Settings, 
  HelpCircle, 
  Search,
  Database,
  FileText,
  File,
  MoreHorizontal,
  Plus,
  Download,
  Github,
  ChevronDown,
  CheckCircle,
  Clock,
  DollarSign,
  CreditCard,
  Activity,
  Menu,
  X
} from 'lucide-react';

// Mock data
const mockData = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  stats: {
    totalRevenue: 1250.00,
    newCustomers: 1234,
    activeAccounts: 45678,
    growthRate: 4.5,
  },
  recentSales: [
    { id: 1, customer: "Olivia Martin", email: "olivia@example.com", amount: 1999.00, status: "completed" },
    { id: 2, customer: "Jackson Lee", email: "jackson@example.com", amount: 39.00, status: "processing" },
    { id: 3, customer: "Isabella Nguyen", email: "isabella@example.com", amount: 299.00, status: "completed" },
    { id: 4, customer: "William Kim", email: "william@example.com", amount: 99.00, status: "completed" },
    { id: 5, customer: "Sofia Davis", email: "sofia@example.com", amount: 39.00, status: "failed" },
  ],
  documents: [
    { name: "Cover page", type: "Cover page", status: "In Process", target: 18, limit: 5, reviewer: "Eddie Lake" },
    { name: "Table of contents", type: "Table of contents", status: "Done", target: 29, limit: 24, reviewer: "Eddie Lake" },
    { name: "Executive summary", type: "Narrative", status: "Done", target: 10, limit: 13, reviewer: "Eddie Lake" },
  ]
};

// Sidebar Component
const AppSidebar = ({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) => (
  <div className={`bg-gray-900 text-white transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} h-screen flex flex-col`}>
    {/* Header */}
    <div className="p-4 border-b border-gray-700">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
          <BarChart3 className="w-5 h-5" />
        </div>
        {!isCollapsed && <span className="text-lg font-semibold">Acme Inc.</span>}
      </div>
    </div>

    {/* Quick Create Button */}
    <div className="p-4">
      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
        <Plus className="w-4 h-4 mr-2" />
        {!isCollapsed && "Quick Create"}
      </Button>
    </div>

    {/* Main Navigation */}
    <div className="flex-1 px-4">
      <nav className="space-y-2">
        <a href="#" className="flex items-center gap-3 p-2 rounded-lg bg-gray-800 text-white">
          <LayoutDashboard className="w-5 h-5" />
          {!isCollapsed && "Dashboard"}
        </a>
        <a href="#" className="flex items-center gap-3 p-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white">
          <BarChart3 className="w-5 h-5" />
          {!isCollapsed && "Lifecycle"}
        </a>
        <a href="#" className="flex items-center gap-3 p-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white">
          <BarChart3 className="w-5 h-5" />
          {!isCollapsed && "Analytics"}
        </a>
        <a href="#" className="flex items-center gap-3 p-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white">
          <Folder className="w-5 h-5" />
          {!isCollapsed && "Projects"}
        </a>
        <a href="#" className="flex items-center gap-3 p-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white">
          <Users className="w-5 h-5" />
          {!isCollapsed && "Team"}
        </a>
      </nav>

      {/* Documents Section */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">Documents</h3>
        <nav className="space-y-2">
          <a href="#" className="flex items-center gap-3 p-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white">
            <Database className="w-5 h-5" />
            {!isCollapsed && "Data Library"}
          </a>
          <a href="#" className="flex items-center gap-3 p-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white">
            <FileText className="w-5 h-5" />
            {!isCollapsed && "Reports"}
          </a>
          <a href="#" className="flex items-center gap-3 p-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white">
            <File className="w-5 h-5" />
            {!isCollapsed && "Word Assistant"}
          </a>
          <a href="#" className="flex items-center gap-3 p-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white">
            <MoreHorizontal className="w-5 h-5" />
            {!isCollapsed && "More"}
          </a>
        </nav>
      </div>
    </div>

    {/* Footer Navigation */}
    <div className="p-4 border-t border-gray-700">
      <nav className="space-y-2">
        <a href="#" className="flex items-center gap-3 p-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white">
          <Settings className="w-5 h-5" />
          {!isCollapsed && "Settings"}
        </a>
        <a href="#" className="flex items-center gap-3 p-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white">
          <HelpCircle className="w-5 h-5" />
          {!isCollapsed && "Get Help"}
        </a>
        <a href="#" className="flex items-center gap-3 p-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white">
          <Search className="w-5 h-5" />
          {!isCollapsed && "Search"}
        </a>
      </nav>
    </div>

    {/* User Profile */}
    <div className="p-4 border-t border-gray-700">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium">{mockData.user.name[0]}</span>
        </div>
        {!isCollapsed && (
          <div className="flex-1">
            <p className="text-sm font-medium">{mockData.user.name}</p>
            <p className="text-xs text-gray-400">{mockData.user.email}</p>
          </div>
        )}
        {!isCollapsed && <MoreHorizontal className="w-4 h-4 text-gray-400" />}
      </div>
    </div>
  </div>
);

// Header Component
const SiteHeader = () => (
  <div className="bg-gray-800 text-white px-6 py-3 flex items-center justify-between border-b border-gray-700">
    <div className="flex items-center gap-3">
      <FileText className="w-5 h-5" />
      <span className="text-lg font-medium">Documents</span>
    </div>
    <Button variant="outline" size="sm" className="bg-transparent border-gray-600 text-white hover:bg-gray-700">
      <Github className="w-4 h-4 mr-2" />
      GitHub
    </Button>
  </div>
);

// Statistics Cards
const StatsCards = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-300">Total Revenue</CardTitle>
        <DollarSign className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">${mockData.stats.totalRevenue.toLocaleString()}</div>
        <p className="text-xs" style={{ color: 'var(--priority-medium)' }}>+12.5% from last month</p>
        <p className="text-xs text-gray-400">Trending up this month</p>
        <p className="text-xs text-gray-500">Visitors for the last 6 months</p>
      </CardContent>
    </Card>

    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-300">New Customers</CardTitle>
        <Users className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{mockData.stats.newCustomers.toLocaleString()}</div>
        <p className="text-xs text-red-400">-20% from last month</p>
        <p className="text-xs text-gray-400">Down 20% this period</p>
        <p className="text-xs text-gray-500">Acquisition needs attention</p>
      </CardContent>
    </Card>

    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-300">Active Accounts</CardTitle>
        <CreditCard className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{mockData.stats.activeAccounts.toLocaleString()}</div>
        <p className="text-xs" style={{ color: 'var(--priority-medium)' }}>+12.5% from last month</p>
        <p className="text-xs text-gray-400">Strong user retention</p>
        <p className="text-xs text-gray-500">Engagement exceed targets</p>
      </CardContent>
    </Card>

    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-300">Growth Rate</CardTitle>
        <Activity className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{mockData.stats.growthRate}%</div>
        <p className="text-xs" style={{ color: 'var(--priority-medium)' }}>+4.5% from last month</p>
        <p className="text-xs text-gray-400">Steady performance increase</p>
        <p className="text-xs text-gray-500">Meets growth projections</p>
      </CardContent>
    </Card>
  </div>
);

// Chart Component
const ChartSection = () => (
  <Card className="bg-gray-800 border-gray-700">
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="text-white">Total Visitors</CardTitle>
          <p className="text-sm text-gray-400">Total for the last 3 months</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
            Last 3 months
          </Button>
          <Button variant="outline" size="sm" className="bg-transparent border-gray-600 text-gray-400 hover:bg-gray-700">
            Last 30 days
          </Button>
          <Button variant="outline" size="sm" className="bg-transparent border-gray-600 text-gray-400 hover:bg-gray-700">
            Last 7 days
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="h-[300px] w-full flex items-center justify-center border-2 border-dashed border-gray-600 rounded-lg">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400">Interactive Chart Component</p>
          <p className="text-sm text-gray-500">Chart.js or Recharts would be integrated here</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Documents Table
const DocumentsTable = () => (
  <Card className="bg-gray-800 border-gray-700">
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <Button variant="outline" size="sm" className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
            Outline
          </Button>
          <Button variant="outline" size="sm" className="bg-transparent border-gray-600 text-gray-400 hover:bg-gray-700">
            Past Performance (3)
          </Button>
          <Button variant="outline" size="sm" className="bg-transparent border-gray-600 text-gray-400 hover:bg-gray-700">
            Key Personnel (2)
          </Button>
          <Button variant="outline" size="sm" className="bg-transparent border-gray-600 text-gray-400 hover:bg-gray-700">
            Focus Documents
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="bg-transparent border-gray-600 text-gray-400 hover:bg-gray-700">
            Customize Columns
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Section
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Header</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Section Type</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Target</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Limit</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Reviewer</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-400"></th>
            </tr>
          </thead>
          <tbody>
            {mockData.documents.map((doc, index) => (
              <tr key={index} className="border-b border-gray-700 hover:bg-gray-750">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-gray-600 rounded cursor-move"></div>
                    <span className="text-white">{doc.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-300">{doc.type}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {doc.status === 'Done' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="text-gray-300">{doc.status}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-300">{doc.target}</td>
                <td className="py-3 px-4 text-gray-300">{doc.limit}</td>
                <td className="py-3 px-4 text-gray-300">{doc.reviewer}</td>
                <td className="py-3 px-4">
                  <MoreHorizontal className="w-4 h-4 text-gray-400 cursor-pointer" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
);

// Main Dashboard Component
export default function ShadcnDashboard() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <AppSidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <SiteHeader />
        
        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-900">
          <div className="space-y-6">
            {/* Stats Cards */}
            <StatsCards />
            
            {/* Chart Section */}
            <ChartSection />
            
            {/* Documents Table */}
            <DocumentsTable />
          </div>
        </div>
      </div>
    </div>
  );
}
