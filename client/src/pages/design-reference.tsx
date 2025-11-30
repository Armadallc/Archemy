/**
 * HALCYON Design System - Design Reference Page
 * 
 * This is a visual catalog and reference library for all design elements,
 * components, and patterns used in the HALCYON transportation management system.
 */

import React, { useState } from 'react';
import { designTokens } from '../design-system/tokens';

export default function DesignReference() {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'colors', label: 'Color System', icon: '🎨' },
    { id: 'typography', label: 'Typography', icon: '📝' },
    { id: 'spacing', label: 'Spacing & Layout', icon: '📏' },
    { id: 'shadows', label: 'Shadows & Depth', icon: '🌟' },
    { id: 'components', label: 'Components', icon: '🧩' },
    { id: 'patterns', label: 'Design Patterns', icon: '🔧' },
  ];

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-display-xs text-gray-900 mb-4">HALCYON Design System</h2>
        <p className="text-body-lg text-gray-600 mb-6">
          A comprehensive design system for the HALCYON transportation management platform, 
          built with consistency, accessibility, and scalability in mind.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🎨</span>
            </div>
            <h3 className="text-heading-md mb-2">Colors</h3>
            <p className="text-body-sm text-gray-600">
              Semantic color palette with primary, secondary, and status colors
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📝</span>
            </div>
            <h3 className="text-heading-md mb-2">Typography</h3>
            <p className="text-body-sm text-gray-600">
              Consistent text styles and font scales for all content
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">📏</span>
            </div>
            <h3 className="text-heading-md mb-2">Spacing</h3>
            <p className="text-body-sm text-gray-600">
              Systematic spacing scale for consistent layouts
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🌟</span>
            </div>
            <h3 className="text-heading-md mb-2">Shadows</h3>
            <p className="text-body-sm text-gray-600">
              Elevation system for depth and visual hierarchy
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-display-xs text-gray-900 mb-4">Design Principles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-heading-lg mb-3">Consistency</h3>
            <p className="text-body-md text-gray-600 mb-4">
              All design elements follow the same visual language and interaction patterns 
              to create a cohesive user experience.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center text-body-sm text-gray-600">
                <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                Consistent color usage across all components
              </li>
              <li className="flex items-center text-body-sm text-gray-600">
                <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                Standardized spacing and typography scales
              </li>
              <li className="flex items-center text-body-sm text-gray-600">
                <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                Unified interaction patterns and animations
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-heading-lg mb-3">Accessibility</h3>
            <p className="text-body-md text-gray-600 mb-4">
              Design elements are built with accessibility in mind, ensuring 
              the platform is usable by everyone.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center text-body-sm text-gray-600">
                <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                WCAG 2.1 AA compliance for color contrast
              </li>
              <li className="flex items-center text-body-sm text-gray-600">
                <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                Keyboard navigation support
              </li>
              <li className="flex items-center text-body-sm text-gray-600">
                <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                Screen reader compatibility
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderColors = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-display-xs text-gray-900 mb-4">Color System</h2>
        <p className="text-body-lg text-gray-600 mb-6">
          Our color system is built around semantic meaning and accessibility. 
          Each color has a specific purpose and meets WCAG 2.1 AA contrast requirements.
        </p>
        
        <div className="space-y-8">
          {/* Primary Colors */}
          <div>
            <h3 className="text-heading-lg mb-4">Primary Colors</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4">
              {Object.entries(designTokens.colors.primary).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div 
                    className="w-full h-16 rounded-lg border border-gray-200 mb-2"
                    style={{ backgroundColor: value }}
                  />
                  <div className="text-body-sm font-medium">primary-{key}</div>
                  <div className="text-caption-md text-gray-500">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Semantic Colors */}
          <div>
            <h3 className="text-heading-lg mb-4">Semantic Colors</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-3">
                <h4 className="text-heading-md">Success</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-success-500 rounded"></div>
                    <div>
                      <div className="text-body-sm font-medium">success-500</div>
                      <div className="text-caption-md text-gray-500">#22c55e</div>
                    </div>
                  </div>
                  <p className="text-caption-md text-gray-600">Used for positive actions, success states, and confirmations</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-heading-md">Warning</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-warning-500 rounded"></div>
                    <div>
                      <div className="text-body-sm font-medium">warning-500</div>
                      <div className="text-caption-md text-gray-500">#f59e0b</div>
                    </div>
                  </div>
                  <p className="text-caption-md text-gray-600">Used for warnings, alerts, and attention-grabbing elements</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-heading-md">Error</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-error-500 rounded"></div>
                    <div>
                      <div className="text-body-sm font-medium">error-500</div>
                      <div className="text-caption-md text-gray-500">#ef4444</div>
                    </div>
                  </div>
                  <p className="text-caption-md text-gray-600">Used for errors, destructive actions, and critical alerts</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-heading-md">Info</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-info-500 rounded"></div>
                    <div>
                      <div className="text-body-sm font-medium">info-500</div>
                      <div className="text-caption-md text-gray-500">#3b82f6</div>
                    </div>
                  </div>
                  <p className="text-caption-md text-gray-600">Used for informational messages and neutral actions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTypography = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-display-xs text-gray-900 mb-4">Typography System</h2>
        <p className="text-body-lg text-gray-600 mb-6">
          Our typography system provides consistent text styles and scales for all content types, 
          from large display headings to small captions.
        </p>
        
        <div className="space-y-8">
          {/* Display Styles */}
          <div>
            <h3 className="text-heading-lg mb-4">Display Styles</h3>
            <div className="space-y-4">
              {Object.entries(designTokens.typography.textStyles)
                .filter(([key]) => key.startsWith('display'))
                .map(([key, style]) => (
                <div key={key} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-heading-md">{key}</h4>
                    <div className="text-caption-md text-gray-500">
                      {style.fontSize} / {style.lineHeight} / {style.fontWeight}
                    </div>
                  </div>
                  <div 
                    className="text-gray-900"
                    style={{
                      fontSize: style.fontSize,
                      lineHeight: style.lineHeight,
                      fontWeight: style.fontWeight,
                      ...('letterSpacing' in style && { letterSpacing: (style as any).letterSpacing }),
                    }}
                  >
                    The quick brown fox jumps over the lazy dog
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Heading Styles */}
          <div>
            <h3 className="text-heading-lg mb-4">Heading Styles</h3>
            <div className="space-y-4">
              {Object.entries(designTokens.typography.textStyles)
                .filter(([key]) => key.startsWith('heading'))
                .map(([key, style]) => (
                <div key={key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-heading-sm">{key}</h4>
                    <div className="text-caption-md text-gray-500">
                      {style.fontSize} / {style.lineHeight} / {style.fontWeight}
                    </div>
                  </div>
                  <div 
                    className="text-gray-900"
                    style={{
                      fontSize: style.fontSize,
                      lineHeight: style.lineHeight,
                      fontWeight: style.fontWeight,
                      ...('letterSpacing' in style && { letterSpacing: (style as any).letterSpacing }),
                    }}
                  >
                    The quick brown fox jumps over the lazy dog
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Body Styles */}
          <div>
            <h3 className="text-heading-lg mb-4">Body Text Styles</h3>
            <div className="space-y-4">
              {Object.entries(designTokens.typography.textStyles)
                .filter(([key]) => key.startsWith('body'))
                .map(([key, style]) => (
                <div key={key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-heading-sm">{key}</h4>
                    <div className="text-caption-md text-gray-500">
                      {style.fontSize} / {style.lineHeight} / {style.fontWeight}
                    </div>
                  </div>
                  <div 
                    className="text-gray-900"
                    style={{
                      fontSize: style.fontSize,
                      lineHeight: style.lineHeight,
                      fontWeight: style.fontWeight,
                      ...('letterSpacing' in style && { letterSpacing: (style as any).letterSpacing }),
                    }}
                  >
                    The quick brown fox jumps over the lazy dog. This is sample body text that demonstrates the typography style.
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSpacing = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-display-xs text-gray-900 mb-4">Spacing & Layout System</h2>
        <p className="text-body-lg text-gray-600 mb-6">
          Our spacing system provides consistent spacing scales for layouts, components, and content.
        </p>
        
        <div className="space-y-8">
          {/* Spacing Scale */}
          <div>
            <h3 className="text-heading-lg mb-4">Spacing Scale</h3>
            <div className="space-y-3">
              {Object.entries(designTokens.spacing.scale).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-4">
                  <div className="w-16 text-body-sm font-medium">{key}</div>
                  <div className="w-20 text-caption-md text-gray-500">{value}</div>
                  <div 
                    className="h-4 bg-primary-500 rounded"
                    style={{ width: value }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Border Radius */}
          <div>
            <h3 className="text-heading-lg mb-4">Border Radius</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {Object.entries(designTokens.spacing.borderRadius).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div 
                    className="w-16 h-16 bg-primary-500 mx-auto mb-3"
                    style={{ borderRadius: value }}
                  />
                  <div className="text-body-sm font-medium">{key}</div>
                  <div className="text-caption-md text-gray-500">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderShadows = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-display-xs text-gray-900 mb-4">Shadows & Depth System</h2>
        <p className="text-body-lg text-gray-600 mb-6">
          Our shadow system provides consistent depth and elevation for components and layouts.
        </p>
        
        <div className="space-y-8">
          {/* Elevation System */}
          <div>
            <h3 className="text-heading-lg mb-4">Elevation System</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(designTokens.shadows.elevation).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div 
                    className="w-24 h-24 bg-white mx-auto mb-4 rounded-lg border border-gray-200"
                    style={{ boxShadow: value }}
                  />
                  <div className="text-body-sm font-medium">elevation-{key}</div>
                  <div className="text-caption-md text-gray-500 break-all">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Focus Shadows */}
          <div>
            <h3 className="text-heading-lg mb-4">Focus Shadows</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(designTokens.shadows.focus).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div 
                    className="w-24 h-24 bg-white mx-auto mb-4 rounded-lg border border-gray-200"
                    style={{ boxShadow: value }}
                  />
                  <div className="text-body-sm font-medium">focus-{key}</div>
                  <div className="text-caption-md text-gray-500 break-all">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderComponents = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-display-xs text-gray-900 mb-4">Component Library</h2>
        <p className="text-body-lg text-gray-600 mb-6">
          Reusable components built with our design system tokens.
        </p>
        
        <div className="space-y-8">
          {/* Buttons */}
          <div>
            <h3 className="text-heading-lg mb-4">Buttons</h3>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                  Primary Button
                </button>
                <button className="px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors">
                  Secondary Button
                </button>
                <button className="px-4 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors">
                  Success Button
                </button>
                <button className="px-4 py-2 bg-error-500 text-white rounded-lg hover:bg-error-600 transition-colors">
                  Error Button
                </button>
              </div>
            </div>
          </div>

          {/* Cards */}
          <div>
            <h3 className="text-heading-lg mb-4">Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6 elevation-1">
                <h4 className="text-heading-md mb-2">Card Title</h4>
                <p className="text-body-md text-gray-600">This is a sample card component with elevation-1 shadow.</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6 elevation-2">
                <h4 className="text-heading-md mb-2">Card Title</h4>
                <p className="text-body-md text-gray-600">This is a sample card component with elevation-2 shadow.</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6 elevation-3">
                <h4 className="text-heading-md mb-2">Card Title</h4>
                <p className="text-body-md text-gray-600">This is a sample card component with elevation-3 shadow.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPatterns = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h2 className="text-display-xs text-gray-900 mb-4">Design Patterns</h2>
        <p className="text-body-lg text-gray-600 mb-6">
          Common design patterns and best practices for using our design system.
        </p>
        
        <div className="space-y-8">
          <div>
            <h3 className="text-heading-lg mb-4">Color Usage Guidelines</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-heading-md">Primary Colors</h4>
                <ul className="space-y-2">
                  <li className="flex items-center text-body-sm text-gray-600">
                    <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                    Use for main actions and brand elements
                  </li>
                  <li className="flex items-center text-body-sm text-gray-600">
                    <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                    Maintain sufficient contrast ratios
                  </li>
                  <li className="flex items-center text-body-sm text-gray-600">
                    <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                    Use darker shades for hover states
                  </li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="text-heading-md">Status Colors</h4>
                <ul className="space-y-2">
                  <li className="flex items-center text-body-sm text-gray-600">
                    <span className="w-2 h-2 bg-success-500 rounded-full mr-3"></span>
                    Use consistently across all status indicators
                  </li>
                  <li className="flex items-center text-body-sm text-gray-600">
                    <span className="w-2 h-2 bg-warning-500 rounded-full mr-3"></span>
                    Provide clear visual hierarchy
                  </li>
                  <li className="flex items-center text-body-sm text-gray-600">
                    <span className="w-2 h-2 bg-error-500 rounded-full mr-3"></span>
                    Ensure accessibility compliance
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverview();
      case 'colors':
        return renderColors();
      case 'typography':
        return renderTypography();
      case 'spacing':
        return renderSpacing();
      case 'shadows':
        return renderShadows();
      case 'components':
        return renderComponents();
      case 'patterns':
        return renderPatterns();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-display-sm text-gray-900">Design Reference</h1>
            <p className="text-body-lg text-gray-600 mt-2">
              Visual catalog and reference library for the HALCYON design system
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`py-4 px-1 border-b-2 font-medium text-body-md transition-colors ${
                  activeSection === section.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{section.icon}</span>
                {section.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderSectionContent()}
      </div>
    </div>
  );
}


