/**
 * Service Code Table
 * Displays and edits Medicaid billing codes
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { useProphetStore } from '../hooks/useProphetStore';
import { EditableField } from '../shared/EditableField';
import { 
  FileCode, 
  AlertTriangle, 
  Search, 
  Filter, 
  RotateCcw, 
  Plus,
  ChevronDown,
  ChevronUp,
  Lock,
  Info
} from 'lucide-react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { ServiceCode, ServiceCategory, SERVICE_CATEGORY_LABELS, RateType, RATE_TYPE_CYCLE, RATE_TYPE_LABELS } from '../types';

interface ServiceCodeRowProps {
  code: ServiceCode;
  onUpdate: (updates: Partial<ServiceCode>) => void;
  expanded: boolean;
  onToggle: () => void;
}

function ServiceCodeRow({ code, onUpdate, expanded, onToggle }: ServiceCodeRowProps) {
  const isBlocked = code.isBlocked;

  return (
    <>
      <tr 
        className={`border-b transition-colors hover:bg-muted/50 ${isBlocked ? 'opacity-60' : ''}`}
        style={{ borderColor: 'var(--border)' }}
      >
        {/* Code */}
        <td className="px-3 py-2">
          <div className="flex items-center gap-2">
            <button 
              onClick={onToggle}
              className="p-1 rounded hover:bg-muted"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
              ) : (
                <ChevronDown className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
              )}
            </button>
            <span className="font-mono font-medium" style={{ color: 'var(--foreground)' }}>
              {code.code}
            </span>
            {code.modifier && (
              <Badge variant="outline" className="text-xs">
                {code.modifier}
              </Badge>
            )}
            {code.isCustom && (
              <Badge variant="secondary" className="text-xs" style={{ backgroundColor: 'rgba(59, 254, 201, 0.2)', color: 'var(--color-lime)' }}>
                Custom
              </Badge>
            )}
            {isBlocked && (
              <Lock className="h-3 w-3" style={{ color: 'var(--status-error)' }} />
            )}
          </div>
        </td>

        {/* Category */}
        <td className="px-3 py-2">
          <Badge 
            variant="outline" 
            className="text-xs"
            style={{
              backgroundColor: code.category === 'BHST' ? 'rgba(255, 85, 93, 0.1)' :
                              code.category === 'NMT' ? 'rgba(59, 254, 201, 0.1)' :
                              code.category === 'NEMT' ? 'rgba(241, 254, 96, 0.1)' :
                              'rgba(232, 255, 254, 0.1)',
              borderColor: code.category === 'BHST' ? 'var(--primary)' :
                           code.category === 'NMT' ? 'var(--color-lime)' :
                           code.category === 'NEMT' ? 'var(--color-yellow)' :
                           'var(--color-ice)',
            }}
          >
            {code.category}
          </Badge>
        </td>

        {/* Description */}
        <td className="px-3 py-2 max-w-xs">
          <span className="text-sm truncate block" style={{ color: 'var(--foreground)' }}>
            {code.description}
          </span>
        </td>

        {/* Rate */}
        <td className="px-3 py-2">
          <EditableField
            value={code.baseRate}
            onChange={(v) => onUpdate({ baseRate: Number(v) })}
            type="currency"
            disabled={isBlocked}
          />
        </td>

        {/* Unit - Click to cycle */}
        <td className="px-3 py-2">
          <button
            onClick={() => {
              if (isBlocked) return;
              const currentIndex = RATE_TYPE_CYCLE.indexOf(code.rateType);
              const nextIndex = (currentIndex + 1) % RATE_TYPE_CYCLE.length;
              const nextRateType = RATE_TYPE_CYCLE[nextIndex];
              // Update unit label based on rate type
              const unitMap: Record<RateType, string> = {
                'per_mile': 'mile',
                'per_15min': '15 min',
                'per_30min': '30 min',
                'per_hour': 'hour',
                'per_trip': 'trip',
                'per_diem': 'day',
              };
              onUpdate({ rateType: nextRateType, unit: unitMap[nextRateType] });
            }}
            disabled={isBlocked}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              isBlocked 
                ? 'cursor-not-allowed opacity-50' 
                : 'hover:bg-muted cursor-pointer'
            }`}
            style={{ 
              color: 'var(--color-ice)',
              backgroundColor: 'rgba(232, 255, 254, 0.1)',
              border: '1px solid rgba(232, 255, 254, 0.2)',
            }}
            title={isBlocked ? 'Blocked' : 'Click to change unit type'}
          >
            {RATE_TYPE_LABELS[code.rateType]}
          </button>
        </td>

        {/* Mileage */}
        <td className="px-3 py-2">
          {code.mileageRate !== undefined ? (
            <EditableField
              value={code.mileageRate}
              onChange={(v) => onUpdate({ mileageRate: Number(v) })}
              type="currency"
              suffix="/mi"
              disabled={isBlocked}
            />
          ) : (
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>—</span>
          )}
        </td>

        {/* Last Updated */}
        <td className="px-3 py-2">
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            {new Date(code.lastUpdated).toLocaleDateString()}
          </span>
        </td>
      </tr>

      {/* Expanded Row */}
      {expanded && (
        <tr style={{ backgroundColor: 'var(--muted)' }}>
          <td colSpan={7} className="px-6 py-4">
            <div className="grid grid-cols-3 gap-4">
              {/* Allowable Limits */}
              <div>
                <h5 className="text-xs font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>
                  ALLOWABLE LIMITS
                </h5>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--muted-foreground)' }}>Per Day:</span>
                    <EditableField
                      value={code.allowable.perDay || 0}
                      onChange={(v) => onUpdate({ 
                        allowable: { ...code.allowable, perDay: Number(v) || undefined }
                      })}
                      type="number"
                      disabled={isBlocked}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--muted-foreground)' }}>Per Month:</span>
                    <EditableField
                      value={code.allowable.perMonth || 0}
                      onChange={(v) => onUpdate({ 
                        allowable: { ...code.allowable, perMonth: Number(v) || undefined }
                      })}
                      type="number"
                      disabled={isBlocked}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--muted-foreground)' }}>Per Year:</span>
                    <EditableField
                      value={code.allowable.perYear || 0}
                      onChange={(v) => onUpdate({ 
                        allowable: { ...code.allowable, perYear: Number(v) || undefined }
                      })}
                      type="number"
                      disabled={isBlocked}
                    />
                  </div>
                </div>
              </div>

              {/* Restrictions */}
              <div>
                <h5 className="text-xs font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>
                  RESTRICTIONS
                </h5>
                {code.restrictions ? (
                  <div className="space-y-1 text-sm">
                    {code.restrictions.requiresWaiver && (
                      <div className="flex items-center gap-1">
                        <Info className="h-3 w-3" style={{ color: 'var(--color-ice)' }} />
                        <span style={{ color: 'var(--foreground)' }}>Requires HCBS Waiver</span>
                      </div>
                    )}
                    {code.restrictions.requiresCrisis && (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" style={{ color: 'var(--status-warning)' }} />
                        <span style={{ color: 'var(--foreground)' }}>Crisis Only</span>
                      </div>
                    )}
                    {code.restrictions.waiverTypes?.length && (
                      <div className="flex flex-wrap gap-1">
                        {code.restrictions.waiverTypes.map((w) => (
                          <Badge key={w} variant="outline" className="text-xs">{w}</Badge>
                        ))}
                      </div>
                    )}
                    {code.restrictions.notes && (
                      <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
                        {code.restrictions.notes}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>None</span>
                )}
              </div>

              {/* Notes */}
              <div>
                <h5 className="text-xs font-semibold mb-2" style={{ color: 'var(--muted-foreground)' }}>
                  NOTES
                </h5>
                {code.notes ? (
                  <p className="text-sm" style={{ color: 'var(--foreground)' }}>{code.notes}</p>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No notes</span>
                )}
                {isBlocked && code.blockReason && (
                  <div className="mt-2 p-2 rounded text-xs" style={{ 
                    backgroundColor: 'rgba(255, 85, 93, 0.1)',
                    color: 'var(--status-error)' 
                  }}>
                    ⚠️ {code.blockReason}
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function ServiceCodeTable() {
  const { serviceCodes, updateServiceCode, resetServiceCodes } = useProphetStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showBlocked, setShowBlocked] = useState(true);
  const [transportOnly, setTransportOnly] = useState(true); // Default to transport codes

  // Transport categories
  const transportCategories: ServiceCategory[] = ['BHST', 'NEMT', 'NMT', 'Other'];

  // Filter codes
  const filteredCodes = useMemo(() => {
    return serviceCodes.filter((code) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        code.code.toLowerCase().includes(searchLower) ||
        code.description.toLowerCase().includes(searchLower) ||
        code.modifier?.toLowerCase().includes(searchLower);

      // Category filter
      const matchesCategory = categoryFilter === 'all' || code.category === categoryFilter;

      // Transport only filter
      const matchesTransport = !transportOnly || transportCategories.includes(code.category);

      // Blocked filter
      const matchesBlocked = showBlocked || !code.isBlocked;

      return matchesSearch && matchesCategory && matchesTransport && matchesBlocked;
    });
  }, [serviceCodes, searchQuery, categoryFilter, transportOnly, showBlocked]);

  // Group by category
  const groupedCodes = useMemo(() => {
    const groups: Record<string, ServiceCode[]> = {};
    filteredCodes.forEach((code) => {
      if (!groups[code.category]) {
        groups[code.category] = [];
      }
      groups[code.category].push(code);
    });
    return groups;
  }, [filteredCodes]);

  return (
    <Card style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg" style={{ color: 'var(--foreground)' }}>
            <FileCode className="h-5 w-5" style={{ color: 'var(--primary)' }} />
            Service Codes Library
            <Badge variant="secondary" className="ml-2">
              {filteredCodes.length} codes
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetServiceCodes}
              className="text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset to Default
            </Button>
            <Button
              size="sm"
              className="text-xs"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Code
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
            <Input
              placeholder="Search codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
            {(['all', 'BHST', 'NEMT', 'NMT', 'Behavioral', 'Other'] as const).map((cat) => (
              <Button
                key={cat}
                variant={categoryFilter === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategoryFilter(cat)}
                className="text-xs"
                style={categoryFilter === cat ? {
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                } : {}}
              >
                {cat === 'all' ? 'All' : cat}
              </Button>
            ))}
          </div>

          <Button
            variant={transportOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTransportOnly(!transportOnly)}
            className="text-xs"
            style={transportOnly ? {
              backgroundColor: 'var(--color-lime)',
              color: 'var(--color-charcoal)',
            } : {}}
          >
            🚐 {transportOnly ? 'Transport Only' : 'All Codes'}
          </Button>

          <Button
            variant={showBlocked ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowBlocked(!showBlocked)}
            className="text-xs"
          >
            <Lock className="h-3 w-3 mr-1" />
            {showBlocked ? 'Hide Blocked' : 'Show Blocked'}
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: 'var(--muted)' }}>
                <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--muted-foreground)' }}>Code</th>
                <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--muted-foreground)' }}>Category</th>
                <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--muted-foreground)' }}>Description</th>
                <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--muted-foreground)' }}>Rate</th>
                <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--muted-foreground)' }}>Unit</th>
                <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--muted-foreground)' }}>Mileage</th>
                <th className="px-3 py-2 text-left font-medium" style={{ color: 'var(--muted-foreground)' }}>Updated</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedCodes).map(([category, codes]) => (
                <React.Fragment key={category}>
                  <tr style={{ backgroundColor: 'rgba(232, 255, 254, 0.05)' }}>
                    <td colSpan={7} className="px-3 py-2">
                      <span className="text-xs font-semibold" style={{ color: 'var(--color-ice)' }}>
                        {SERVICE_CATEGORY_LABELS[category as ServiceCategory] || category}
                      </span>
                    </td>
                  </tr>
                  {codes.map((code) => (
                    <ServiceCodeRow
                      key={code.id}
                      code={code}
                      onUpdate={(updates) => updateServiceCode(code.id, updates)}
                      expanded={expandedId === code.id}
                      onToggle={() => setExpandedId(expandedId === code.id ? null : code.id)}
                    />
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {filteredCodes.length === 0 && (
          <div className="text-center py-8">
            <FileCode className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
            <p style={{ color: 'var(--muted-foreground)' }}>No codes match your filters</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ServiceCodeTable;

