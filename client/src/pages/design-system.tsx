/**
 * HALCYON Design System - Control Panel
 * 
 * Comprehensive control panel for the Atomic Design System with:
 * - Design token editor
 * - Component builder
 * - Live preview
 * - Theme management
 */

import React, { useState, useCallback } from 'react';
import { designTokens } from '../design-system/tokens';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { 
  Palette, 
  Type, 
  Ruler, 
  Box, 
  Eye, 
  Download, 
  Upload, 
  Save,
  RotateCcw,
  Copy,
  Check,
  Plus,
  Minus,
  Settings,
  Layers,
  Component,
  Layout
} from 'lucide-react';

// Design token editor component
const TokenEditor = ({ tokens, onUpdate }: { tokens: any, onUpdate: (tokens: any) => void }) => {
  const [activeSection, setActiveSection] = useState('colors');

  const updateColor = (path: string, value: string) => {
    const newTokens = { ...tokens };
    const keys = path.split('.');
    let current = newTokens;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    onUpdate(newTokens);
  };

  const renderColorEditor = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Primary Colors</h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(tokens.colors.primary).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={`primary-${key}`}>Primary {key}</Label>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-8 h-8 rounded border border-gray-300"
                  style={{ backgroundColor: value as string }}
                />
                <Input
                  id={`primary-${key}`}
                  value={value as string}
                  onChange={(e) => updateColor(`colors.primary.${key}`, e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Semantic Colors</h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(tokens.colors.semantic).map(([category, colors]) => (
            <div key={category} className="space-y-2">
              <h4 className="font-medium capitalize">{category}</h4>
              {Object.entries(colors as any).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <Label htmlFor={`${category}-${key}`} className="text-sm">
                    {category} {key}
                  </Label>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: value as string }}
                    />
                    <Input
                      id={`${category}-${key}`}
                      value={value as string}
                      onChange={(e) => updateColor(`colors.semantic.${category}.${key}`, e.target.value)}
                      className="flex-1 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTypographyEditor = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Font Sizes</h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(tokens.typography.fontSize).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={`fontSize-${key}`}>{key}</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id={`fontSize-${key}`}
                  value={value as string}
                  onChange={(e) => updateColor(`typography.fontSize.${key}`, e.target.value)}
                  className="flex-1"
                />
                <div 
                  className="text-sm px-2 py-1 bg-gray-100 rounded"
                  style={{ fontSize: value as string }}
                >
                  Aa
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSpacingEditor = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Spacing Scale</h3>
        <div className="space-y-4">
          {Object.entries(tokens.spacing.scale).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={`spacing-${key}`}>{key}</Label>
                <span className="text-sm text-gray-500">{value}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div 
                  className="h-4 bg-blue-500 rounded"
                  style={{ width: value as string }}
                />
                <Input
                  id={`spacing-${key}`}
                  value={value as string}
                  onChange={(e) => updateColor(`spacing.scale.${key}`, e.target.value)}
                  className="w-20"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Design Tokens</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline" size="sm">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="colors" className="flex items-center space-x-2">
            <Palette className="w-4 h-4" />
            <span>Colors</span>
          </TabsTrigger>
          <TabsTrigger value="typography" className="flex items-center space-x-2">
            <Type className="w-4 h-4" />
            <span>Typography</span>
          </TabsTrigger>
          <TabsTrigger value="spacing" className="flex items-center space-x-2">
            <Ruler className="w-4 h-4" />
            <span>Spacing</span>
          </TabsTrigger>
          <TabsTrigger value="shadows" className="flex items-center space-x-2">
            <Box className="w-4 h-4" />
            <span>Shadows</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="mt-6">
          {renderColorEditor()}
        </TabsContent>
        <TabsContent value="typography" className="mt-6">
          {renderTypographyEditor()}
        </TabsContent>
        <TabsContent value="spacing" className="mt-6">
          {renderSpacingEditor()}
        </TabsContent>
        <TabsContent value="shadows" className="mt-6">
          <div className="text-center py-8 text-gray-500">
            Shadow editor coming soon...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Component builder component
const ComponentBuilder = () => {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [components, setComponents] = useState<any[]>([]);

  const availableComponents = [
    { id: 'button', name: 'Button', icon: Component, category: 'atoms' },
    { id: 'input', name: 'Input', icon: Component, category: 'atoms' },
    { id: 'card', name: 'Card', icon: Component, category: 'atoms' },
    { id: 'badge', name: 'Badge', icon: Component, category: 'atoms' },
    { id: 'form-field', name: 'Form Field', icon: Component, category: 'molecules' },
    { id: 'search-input', name: 'Search Input', icon: Component, category: 'molecules' },
    { id: 'data-table', name: 'Data Table', icon: Component, category: 'organisms' },
    { id: 'navigation', name: 'Navigation', icon: Component, category: 'organisms' },
  ];

  const addComponent = (component: any) => {
    const newComponent = {
      id: `${component.id}-${Date.now()}`,
      type: component.id,
      name: component.name,
      category: component.category,
      props: {},
      position: { x: 100, y: 100 + components.length * 60 }
    };
    setComponents([...components, newComponent]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Component Builder</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 h-96">
        {/* Component Palette */}
        <div className="col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Components</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {availableComponents.map((component) => (
                <div
                  key={component.id}
                  className="flex items-center space-x-2 p-2 rounded border cursor-pointer hover:bg-gray-50"
                  onClick={() => addComponent(component)}
                >
                  <component.icon className="w-4 h-4" />
                  <span className="text-sm">{component.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {component.category}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Canvas */}
        <div className="col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-sm">Canvas</CardTitle>
            </CardHeader>
            <CardContent className="relative h-full bg-gray-50 rounded">
              {components.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Drag components here to build</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {components.map((component) => (
                    <div
                      key={component.id}
                      className="p-3 bg-white border rounded cursor-pointer hover:shadow-md"
                      onClick={() => setSelectedComponent(component.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <Component className="w-4 h-4" />
                        <span className="text-sm font-medium">{component.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {component.category}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Properties Panel */}
        <div className="col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Properties</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedComponent ? (
                <div className="space-y-4">
                  <div>
                    <Label>Component Type</Label>
                    <Input value={components.find(c => c.id === selectedComponent)?.name} disabled />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Input value={components.find(c => c.id === selectedComponent)?.category} disabled />
                  </div>
                  <Separator />
                  <div className="text-sm text-gray-500">
                    Property editor coming soon...
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select a component to edit properties</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Live preview component
const LivePreview = ({ tokens }: { tokens: any }) => {
  const [viewport, setViewport] = useState('desktop');
  const [theme, setTheme] = useState('light');

  const viewportOptions = [
    { value: 'mobile', label: 'Mobile', width: '375px' },
    { value: 'tablet', label: 'Tablet', width: '768px' },
    { value: 'desktop', label: 'Desktop', width: '1024px' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Live Preview</h2>
        <div className="flex space-x-2">
          <Select value={viewport} onValueChange={setViewport}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {viewportOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            <Eye className="w-4 h-4 mr-2" />
            {theme === 'light' ? 'Dark' : 'Light'}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="relative">
            <div 
              className="mx-auto bg-white border rounded-lg overflow-hidden"
              style={{ 
                width: viewportOptions.find(v => v.value === viewport)?.width,
                maxWidth: '100%'
              }}
            >
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">Preview</h3>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <Button>Primary Button</Button>
                    <Button variant="outline">Secondary Button</Button>
                    <Button variant="ghost">Ghost Button</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded">
                      <h4 className="font-medium mb-2">Card Title</h4>
                      <p className="text-sm text-gray-600">This is a sample card component.</p>
                    </div>
                    <div className="p-4 border rounded">
                      <h4 className="font-medium mb-2">Another Card</h4>
                      <p className="text-sm text-gray-600">With different content.</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Sample Input</Label>
                    <Input placeholder="Enter text..." />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Theme manager component
const ThemeManager = () => {
  const [themes, setThemes] = useState([
    { id: 'default', name: 'Default Theme', isActive: true },
    { id: 'dark', name: 'Dark Theme', isActive: false },
    { id: 'corporate', name: 'Corporate Theme', isActive: false },
  ]);

  const [newThemeName, setNewThemeName] = useState('');

  const createTheme = () => {
    if (newThemeName.trim()) {
      const newTheme = {
        id: newThemeName.toLowerCase().replace(/\s+/g, '-'),
        name: newThemeName,
        isActive: false
      };
      setThemes([...themes, newTheme]);
      setNewThemeName('');
    }
  };

  const activateTheme = (themeId: string) => {
    setThemes(themes.map(theme => ({
      ...theme,
      isActive: theme.id === themeId
    })));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Theme Manager</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map((theme) => (
          <Card 
            key={theme.id} 
            className={`cursor-pointer transition-all ${
              theme.isActive ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
            }`}
            onClick={() => activateTheme(theme.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{theme.name}</h3>
                {theme.isActive && (
                  <Badge variant="default" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>
              <div className="flex space-x-1">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex space-x-2">
        <Input
          placeholder="New theme name..."
          value={newThemeName}
          onChange={(e) => setNewThemeName(e.target.value)}
          className="flex-1"
        />
        <Button onClick={createTheme} disabled={!newThemeName.trim()}>
          <Plus className="w-4 h-4 mr-2" />
          Create
        </Button>
      </div>
    </div>
  );
};

// Main design system page
export default function DesignSystem() {
  const [tokens, setTokens] = useState(designTokens);
  const [activePanel, setActivePanel] = useState('tokens');

  const updateTokens = useCallback((newTokens: any) => {
    setTokens(newTokens);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Design System Control Panel</h1>
                <p className="text-lg text-gray-600 mt-2">
                  Comprehensive tool for managing design tokens, building components, and creating themes
                </p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button>
                  <Save className="w-4 h-4 mr-2" />
                  Save All
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
          {/* Left Panel - Token Editor (Full Height) */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardContent className="p-6 h-full">
                <TokenEditor tokens={tokens} onUpdate={updateTokens} />
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Two Row Layout */}
          <div className="lg:col-span-1 flex flex-col gap-8 h-full">
            {/* Top Row - Component Builder */}
            <div className="flex-1">
              <Card className="h-full">
                <CardContent className="p-6 h-full">
                  <ComponentBuilder />
                </CardContent>
              </Card>
            </div>

            {/* Bottom Row - Live Preview */}
            <div className="flex-1">
              <Card className="h-full">
                <CardContent className="p-6 h-full">
                  <LivePreview tokens={tokens} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Bottom Panel - Theme Manager */}
        <div className="mt-8">
          <Card>
            <CardContent className="p-6">
              <ThemeManager />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}