import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  StatusBadge, 
  StatusIcon,
  TripProgressMeter, 
  TripStatusInline, 
  TripProgressBar,
  PriorityIndicator, 
  PriorityBadge, 
  PriorityText 
} from '../ui/minimal-color-system';

export function FireColorPalette() {
  return (
    <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
      <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardTitle style={{ color: '#a5c8ca' }}>FIRE COLOR PALETTE</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Core Colors */}
        <div>
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#a5c8ca' }}>Core Colors</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { name: 'Charcoal', value: '#1e2023', cssVar: '--color-charcoal', usage: 'Dark backgrounds, light mode text' },
              { name: 'Ice', value: '#e8fffe', cssVar: '--color-ice', usage: 'Light accent backgrounds' },
              { name: 'Lime', value: '#f1fec9', cssVar: '--color-lime', usage: 'Elevated surfaces, accent' },
              { name: 'Coral', value: '#ff8475', cssVar: '--color-coral', usage: 'Primary actions, highlights' },
              { name: 'Silver', value: '#eaeaea', cssVar: '--color-silver', usage: 'Borders, muted backgrounds' },
              { name: 'Cloud', value: '#f4f4f4', cssVar: '--color-cloud', usage: 'Light mode background' },
              { name: 'Shadow', value: '#292929', cssVar: '--color-shadow', usage: 'Dark gray accents' },
              { name: 'Aqua', value: '#a5c8ca', cssVar: '--color-aqua', usage: 'Light teal accents' },
            ].map(({ name, value, cssVar, usage }) => (
              <div key={name} className="space-y-2 card-neu-flat rounded-lg p-4" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <div 
                  className="w-full h-20 rounded-lg border-2 mb-2"
                  style={{ backgroundColor: value, borderColor: 'rgba(165, 200, 202, 0.3)' }}
                />
                <div className="text-sm font-semibold" style={{ color: '#a5c8ca' }}>{name}</div>
                <div className="text-xs font-mono" style={{ color: '#a5c8ca', opacity: 0.7 }}>{value}</div>
                <div className="text-xs" style={{ color: '#a5c8ca', opacity: 0.6 }}>{usage}</div>
                <div className="text-xs font-mono" style={{ color: '#a5c8ca', opacity: 0.5 }}>{cssVar}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Semantic Colors */}
        <div>
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#a5c8ca' }}>Semantic Colors</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Backgrounds & Surfaces */}
            <div className="space-y-3 card-neu-flat rounded-lg p-4" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <h4 className="font-medium mb-3" style={{ color: '#a5c8ca' }}>Backgrounds & Surfaces</h4>
              {[
                { cssVar: '--background', value: '#f4f4f4', label: 'Background' },
                { cssVar: '--card', value: '#ffffff', label: 'Card' },
                { cssVar: '--popover', value: '#ffffff', label: 'Popover' },
                { cssVar: '--surface-elevated', value: '#f1fec9', label: 'Surface Elevated' },
              ].map(({ cssVar, value, label }) => (
                <div key={cssVar} className="space-y-2">
                  <Label className="text-sm" style={{ color: '#a5c8ca', opacity: 0.8 }}>{label}</Label>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-8 h-8 rounded-lg border-2 flex-shrink-0"
                      style={{ backgroundColor: value, borderColor: 'rgba(165, 200, 202, 0.3)' }}
                    />
                    <Input
                      value={cssVar}
                      readOnly
                      className="flex-1 text-xs font-mono card-neu-pressed"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    />
                  </div>
                  <div className="text-xs font-mono ml-10" style={{ color: '#a5c8ca', opacity: 0.6 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Text & Foreground */}
            <div className="space-y-3 card-neu-flat rounded-lg p-4" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <h4 className="font-medium mb-3" style={{ color: '#a5c8ca' }}>Text & Foreground</h4>
              {[
                { cssVar: '--foreground', value: '#26282b', label: 'Foreground' },
                { cssVar: '--foreground-secondary', value: '#5c6166', label: 'Foreground Secondary' },
                { cssVar: '--foreground-muted', value: '#8a8f94', label: 'Foreground Muted' },
                { cssVar: '--muted-foreground', value: '#6b7280', label: 'Muted Foreground' },
              ].map(({ cssVar, value, label }) => (
                <div key={cssVar} className="space-y-2">
                  <Label className="text-sm" style={{ color: '#a5c8ca', opacity: 0.8 }}>{label}</Label>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-8 h-8 rounded-lg border-2 flex-shrink-0"
                      style={{ backgroundColor: value, borderColor: 'rgba(165, 200, 202, 0.3)' }}
                    />
                    <Input
                      value={cssVar}
                      readOnly
                      className="flex-1 text-xs font-mono card-neu-pressed"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    />
                  </div>
                  <div className="text-xs font-mono ml-10" style={{ color: '#a5c8ca', opacity: 0.6 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="space-y-3 card-neu-flat rounded-lg p-4" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <h4 className="font-medium mb-3" style={{ color: '#a5c8ca' }}>Actions</h4>
              {[
                { cssVar: '--primary', value: '#ff8475', label: 'Primary' },
                { cssVar: '--accent', value: '#f1fec9', label: 'Accent' },
                { cssVar: '--destructive', value: '#dc2626', label: 'Destructive' },
                { cssVar: '--ring', value: '#ff8475', label: 'Ring' },
              ].map(({ cssVar, value, label }) => (
                <div key={cssVar} className="space-y-2">
                  <Label className="text-sm" style={{ color: '#a5c8ca', opacity: 0.8 }}>{label}</Label>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-8 h-8 rounded-lg border-2 flex-shrink-0"
                      style={{ backgroundColor: value, borderColor: 'rgba(165, 200, 202, 0.3)' }}
                    />
                    <Input
                      value={cssVar}
                      readOnly
                      className="flex-1 text-xs font-mono card-neu-pressed"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    />
                  </div>
                  <div className="text-xs font-mono ml-10" style={{ color: '#a5c8ca', opacity: 0.6 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Status Colors */}
            <div className="space-y-3 card-neu-flat rounded-lg p-4" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <h4 className="font-medium mb-3" style={{ color: '#a5c8ca' }}>Status Colors</h4>
              {[
                { cssVar: '--scheduled', value: '#7afffe', label: 'Scheduled' },
                { cssVar: '--in-progress', value: '#f1fe60', label: 'In Progress' },
                { cssVar: '--completed', value: '#3bfec9', label: 'Completed' },
                { cssVar: '--cancelled', value: '#e04850', label: 'Cancelled' },
              ].map(({ cssVar, value, label }) => (
                <div key={cssVar} className="space-y-2">
                  <Label className="text-sm" style={{ color: '#a5c8ca', opacity: 0.8 }}>{label}</Label>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-8 h-8 rounded-lg border-2 flex-shrink-0"
                      style={{ backgroundColor: value, borderColor: 'rgba(165, 200, 202, 0.3)' }}
                    />
                    <Input
                      value={cssVar}
                      readOnly
                      className="flex-1 text-xs font-mono card-neu-pressed"
                      style={{ backgroundColor: 'var(--background)', border: 'none' }}
                    />
                  </div>
                  <div className="text-xs font-mono ml-10" style={{ color: '#a5c8ca', opacity: 0.6 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ComponentLibrary() {
  return (
    <div className="space-y-6">
      {/* Status Badges */}
      <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardTitle style={{ color: '#a5c8ca' }}>STATUS INDICATORS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#a5c8ca', opacity: 0.8 }}>Standard Badges</h3>
            <div className="flex flex-wrap gap-3">
              <StatusBadge status="success" />
              <StatusBadge status="pending" />
              <StatusBadge status="error" />
              <StatusBadge status="warning" />
              <StatusBadge status="info" />
              <StatusBadge status="attention" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#a5c8ca', opacity: 0.8 }}>Icon Only</h3>
            <div className="flex items-center gap-3">
              <StatusIcon status="success" />
              <StatusIcon status="pending" />
              <StatusIcon status="error" />
              <StatusIcon status="warning" />
              <StatusIcon status="info" />
              <StatusIcon status="attention" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trip Progress */}
      <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardTitle style={{ color: '#a5c8ca' }}>TRIP PROGRESS INDICATORS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#a5c8ca', opacity: 0.8 }}>Progress Meters</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3 card-neu-flat rounded-lg" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <TripProgressMeter status="scheduled" />
              </div>
              <div className="p-3 card-neu-flat rounded-lg" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <TripProgressMeter status="in_progress" />
              </div>
              <div className="p-3 card-neu-flat rounded-lg" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <TripProgressMeter status="completed" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#a5c8ca', opacity: 0.8 }}>Inline Status</h3>
            <div className="flex flex-wrap gap-4">
              <TripStatusInline status="scheduled" />
              <TripStatusInline status="confirmed" />
              <TripStatusInline status="in_progress" />
              <TripStatusInline status="completed" />
              <TripStatusInline status="cancelled" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority Indicators */}
      <Card className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <CardHeader className="card-neu-flat [&]:shadow-none" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <CardTitle style={{ color: '#a5c8ca' }}>PRIORITY INDICATORS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#a5c8ca', opacity: 0.8 }}>Full Indicators</h3>
            <div className="space-y-3">
              <div className="p-3 card-neu-flat rounded-lg" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <PriorityIndicator level="urgent" label="Server outage - immediate attention" showMeter showIcon />
              </div>
              <div className="p-3 card-neu-flat rounded-lg" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <PriorityIndicator level="high" label="Critical bug affecting users" showMeter />
              </div>
              <div className="p-3 card-neu-flat rounded-lg" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <PriorityIndicator level="medium" label="Update documentation" showMeter />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#a5c8ca', opacity: 0.8 }}>Badge Style</h3>
            <div className="flex flex-wrap gap-3">
              <PriorityBadge level="urgent" />
              <PriorityBadge level="high" />
              <PriorityBadge level="medium" />
              <PriorityBadge level="low" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

