/**
 * HALCYON Design System - Demo Page
 * 
 * A demonstration page showing the design system components in action.
 */

import React from 'react';
// import { designTokens } from '../design-system/tokens';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function DesignSystemDemo() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">HALCYON Design System Demo</h1>
          <p className="text-xl text-gray-600">
            Showcasing our atomic design system components and design tokens
          </p>
        </div>

        {/* Design Tokens Section */}
        <Card>
          <CardHeader>
            <CardTitle>Design Tokens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Color Palette</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(designTokens.colors.primary).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div 
                      className="w-16 h-16 rounded-lg border border-gray-200 mx-auto mb-2"
                      style={{ backgroundColor: value }}
                    />
                    <div className="text-sm font-medium">primary-{key}</div>
                    <div className="text-xs text-gray-500">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Typography Scale</h3>
              <div className="space-y-4">
                {Object.entries(designTokens.typography.textStyles).map(([key, style]) => (
                  <div key={key} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{key}</h4>
                      <div className="text-sm text-gray-500">
                        {style.fontSize} / {style.lineHeight} / {style.fontWeight}
                      </div>
                    </div>
                    <div 
                      className="text-gray-900"
                      style={{
                        fontSize: style.fontSize,
                        lineHeight: style.lineHeight,
                        fontWeight: style.fontWeight,
                        letterSpacing: style.letterSpacing,
                      }}
                    >
                      The quick brown fox jumps over the lazy dog
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Atomic Components Section */}
        <Card>
          <CardHeader>
            <CardTitle>Atomic Components</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Buttons</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="default">Default Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="destructive">Destructive Button</Button>
                <Button variant="link">Link Button</Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Button Sizes</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon">🚀</Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Form Elements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="demo-input">Sample Input</Label>
                  <Input id="demo-input" placeholder="Enter text..." />
                </div>
                <div className="space-y-2">
                  <Label>Badges</Label>
                  <div className="flex gap-2">
                    <Badge variant="default">Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                    <Badge variant="outline">Outline</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Layout Examples */}
        <Card>
          <CardHeader>
            <CardTitle>Layout Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Card 1</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">This is a sample card component with elevation.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Card 2</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Another card with consistent styling.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Card 3</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Third card maintaining the grid layout.</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Z-Index Management Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Z-Index Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                This section will demonstrate proper z-index layering to prevent dropdown and modal conflicts.
              </p>
              <div className="text-sm text-gray-500">
                Z-index management system coming soon...
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}






