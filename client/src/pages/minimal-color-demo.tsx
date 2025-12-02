import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { 
  StatusBadge, 
  StatusIcon,
  TripProgressMeter, 
  TripStatusInline, 
  TripProgressBar,
  PriorityIndicator, 
  PriorityBadge, 
  PriorityText 
} from "../components/ui/minimal-color-system";

/**
 * Minimal Color System Demo
 * 
 * This page demonstrates all replacement components for the color simplification.
 * View this page to see how status, priority, and trip indicators work without
 * heavy color coding.
 */
export default function MinimalColorDemo() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto p-6">
        <div className="container mx-auto max-w-5xl space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Minimal Color System</h1>
            <p className="text-foreground-secondary">
              Replacement components for color-coded badges. Uses typography, icons, and meters instead of color.
            </p>
          </div>

          {/* Status Badges */}
          <Card>
            <CardHeader>
              <CardTitle>Status Indicators</CardTitle>
              <CardDescription>
                Text labels + icons instead of color coding. Only "attention" uses coral accent.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Standard badges */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Standard Badges</h3>
                <div className="flex flex-wrap gap-3">
                  <StatusBadge status="success" />
                  <StatusBadge status="pending" />
                  <StatusBadge status="error" />
                  <StatusBadge status="warning" />
                  <StatusBadge status="info" />
                  <StatusBadge status="attention" />
                </div>
              </div>

              {/* Custom labels */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Custom Labels</h3>
                <div className="flex flex-wrap gap-3">
                  <StatusBadge status="success" label="DELIVERED" />
                  <StatusBadge status="pending" label="AWAITING APPROVAL" />
                  <StatusBadge status="error" label="CANCELLED" />
                  <StatusBadge status="attention" label="URGENT" />
                </div>
              </div>

              {/* Without icons */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Without Icons</h3>
                <div className="flex flex-wrap gap-3">
                  <StatusBadge status="success" showIcon={false} />
                  <StatusBadge status="attention" label="NEEDS REVIEW" showIcon={false} />
                </div>
              </div>

              {/* Icon-only */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Icon Only (Compact)</h3>
                <div className="flex items-center gap-3">
                  <StatusIcon status="success" />
                  <StatusIcon status="pending" />
                  <StatusIcon status="error" />
                  <StatusIcon status="warning" />
                  <StatusIcon status="info" />
                  <StatusIcon status="attention" />
                </div>
              </div>

              {/* Usage note */}
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-foreground-secondary">
                  <strong className="text-foreground">Usage:</strong> Use "attention" status sparingly — only for items that 
                  truly require immediate action. It's the only status that uses the coral accent color.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Trip Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Trip Progress Indicators</CardTitle>
              <CardDescription>
                Progress meters + typography instead of color coding. Empty → Partial → Full.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Full meters with labels */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Progress Meters (Full)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-3 bg-surface-muted rounded-lg">
                    <TripProgressMeter status="scheduled" />
                  </div>
                  <div className="p-3 bg-surface-muted rounded-lg">
                    <TripProgressMeter status="confirmed" />
                  </div>
                  <div className="p-3 bg-surface-muted rounded-lg">
                    <TripProgressMeter status="in_progress" />
                  </div>
                  <div className="p-3 bg-surface-muted rounded-lg">
                    <TripProgressMeter status="completed" />
                  </div>
                  <div className="p-3 bg-surface-muted rounded-lg">
                    <TripProgressMeter status="cancelled" />
                  </div>
                </div>
              </div>

              {/* Inline (no meter) */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Inline (Icon + Text, No Meter)</h3>
                <div className="flex flex-wrap gap-4">
                  <TripStatusInline status="scheduled" />
                  <TripStatusInline status="confirmed" />
                  <TripStatusInline status="in_progress" />
                  <TripStatusInline status="completed" />
                  <TripStatusInline status="cancelled" />
                </div>
              </div>

              {/* Meter only */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Meter Only (Compact)</h3>
                <div className="space-y-2 max-w-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-24">Scheduled</span>
                    <TripProgressBar status="scheduled" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-24">Confirmed</span>
                    <TripProgressBar status="confirmed" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-24">In Progress</span>
                    <TripProgressBar status="in_progress" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-24">Complete</span>
                    <TripProgressBar status="completed" />
                  </div>
                </div>
              </div>

              {/* Custom labels */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Custom Labels</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-surface-muted rounded-lg">
                    <TripProgressMeter status="scheduled" label="AWAITING PICKUP" />
                  </div>
                  <div className="p-3 bg-surface-muted rounded-lg">
                    <TripProgressMeter status="in_progress" label="EN ROUTE" />
                  </div>
                  <div className="p-3 bg-surface-muted rounded-lg">
                    <TripProgressMeter status="completed" label="DELIVERED" />
                  </div>
                </div>
              </div>

              {/* Usage note */}
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-foreground-secondary">
                  <strong className="text-foreground">Typography cues:</strong> Notice how typography alone indicates status:
                  italic for in-progress, bold for completed, strike-through for cancelled. The meter provides visual reinforcement.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Priority Indicators */}
          <Card>
            <CardHeader>
              <CardTitle>Priority Indicators</CardTitle>
              <CardDescription>
                Typography weight + optional meter. Coral accent ONLY for "urgent". List order is primary indicator.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Full indicators with meters */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Full Indicators (Text + Meter)</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-surface-muted rounded-lg">
                    <PriorityIndicator level="urgent" label="Server outage - immediate attention" showMeter showIcon />
                  </div>
                  <div className="p-3 bg-surface-muted rounded-lg">
                    <PriorityIndicator level="high" label="Critical bug affecting users" showMeter />
                  </div>
                  <div className="p-3 bg-surface-muted rounded-lg">
                    <PriorityIndicator level="medium" label="Update documentation" showMeter />
                  </div>
                  <div className="p-3 bg-surface-muted rounded-lg">
                    <PriorityIndicator level="low" label="Refactor utility functions" showMeter />
                  </div>
                </div>
              </div>

              {/* Without meters */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Text Only (No Meter)</h3>
                <div className="space-y-2">
                  <PriorityIndicator level="urgent" label="Server outage" showIcon />
                  <PriorityIndicator level="high" label="Critical bug" />
                  <PriorityIndicator level="medium" label="Update docs" />
                  <PriorityIndicator level="low" label="Refactor utils" />
                </div>
              </div>

              {/* Badges */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Badge Style (Compact)</h3>
                <div className="flex flex-wrap gap-3">
                  <PriorityBadge level="urgent" />
                  <PriorityBadge level="high" />
                  <PriorityBadge level="medium" />
                  <PriorityBadge level="low" />
                </div>
              </div>

              {/* Text-only inline */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Inline Text (Minimal)</h3>
                <div className="flex flex-wrap gap-3">
                  <PriorityText level="urgent" />
                  <PriorityText level="high" />
                  <PriorityText level="medium" />
                  <PriorityText level="low" />
                </div>
              </div>

              {/* Task list example */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Task List Example (Order + Typography)</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
                    <div className="space-y-1">
                      <div className="font-extrabold text-primary uppercase text-sm">URGENT</div>
                      <div className="text-foreground">Fix database connection issue</div>
                    </div>
                    <PriorityBadge level="urgent" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
                    <div className="space-y-1">
                      <div className="font-extrabold uppercase text-sm">HIGH</div>
                      <div className="text-foreground">Update payment gateway</div>
                    </div>
                    <PriorityBadge level="high" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
                    <div className="space-y-1">
                      <div className="font-medium text-sm">Medium</div>
                      <div className="text-foreground">Refactor user service</div>
                    </div>
                    <PriorityBadge level="medium" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-surface-muted rounded-lg">
                    <div className="space-y-1">
                      <div className="font-light text-muted-foreground text-sm">Low</div>
                      <div className="text-foreground-secondary">Update code comments</div>
                    </div>
                    <PriorityBadge level="low" />
                  </div>
                </div>
              </div>

              {/* Usage note */}
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-foreground-secondary">
                  <strong className="text-foreground">Important:</strong> List ORDER is the primary priority indicator.
                  High-priority items should always be at the top. These components provide secondary visual reinforcement.
                  Use "urgent" level sparingly — only for true emergencies requiring immediate action.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Before/After Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Before/After Migration Examples</CardTitle>
              <CardDescription>
                Side-by-side comparison showing the old color-coded approach vs. minimal color system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status comparison */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Status Indicators</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-surface-muted rounded-lg">
                    <div className="text-xs font-semibold mb-3 text-muted-foreground">❌ BEFORE (Color-coded)</div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 rounded-md text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Success</span>
                      <span className="px-2 py-1 rounded-md text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Error</span>
                      <span className="px-2 py-1 rounded-md text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Warning</span>
                      <span className="px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Info</span>
                    </div>
                  </div>
                  <div className="p-4 bg-surface-muted rounded-lg">
                    <div className="text-xs font-semibold mb-3 text-muted-foreground">✅ AFTER (Minimal Color)</div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status="success" />
                      <StatusBadge status="error" />
                      <StatusBadge status="warning" />
                      <StatusBadge status="info" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Trip status comparison */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground-secondary">Trip Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-surface-muted rounded-lg">
                    <div className="text-xs font-semibold mb-3 text-muted-foreground">❌ BEFORE (Color-coded)</div>
                    <div className="space-y-2">
                      <div className="px-3 py-2 rounded-md text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Scheduled</div>
                      <div className="px-3 py-2 rounded-md text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">In Progress</div>
                      <div className="px-3 py-2 rounded-md text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</div>
                    </div>
                  </div>
                  <div className="p-4 bg-surface-muted rounded-lg">
                    <div className="text-xs font-semibold mb-3 text-muted-foreground">✅ AFTER (Minimal Color)</div>
                    <div className="space-y-3">
                      <TripProgressMeter status="scheduled" />
                      <TripProgressMeter status="in_progress" />
                      <TripProgressMeter status="completed" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Design Principles */}
          <Card>
            <CardHeader>
              <CardTitle>Design Principles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold text-foreground mb-1">1. Use Color Sparingly</h4>
                  <p className="text-foreground-secondary">
                    Coral accent (primary) is reserved for urgent/attention states only. Everything else uses 
                    typography, layout, and neutral colors (foreground, muted, border).
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">2. Typography as Primary Signal</h4>
                  <p className="text-foreground-secondary">
                    Use font weight, caps, italics, and strike-through to convey meaning. Bold = important, 
                    light = less important, ALL CAPS = urgent, italic = in-progress.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">3. Layout & Order</h4>
                  <p className="text-foreground-secondary">
                    Position is meaning. High-priority items at top, completed items at bottom. 
                    Let the user's natural reading pattern do the work.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">4. Visual Reinforcement</h4>
                  <p className="text-foreground-secondary">
                    Icons, meters, and badges provide secondary reinforcement. They support, not replace, 
                    the primary signals (typography and order).
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">5. Accessible by Default</h4>
                  <p className="text-foreground-secondary">
                    Text labels + proper semantic HTML work for everyone. Screen readers get meaningful content, 
                    not just color differences.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

