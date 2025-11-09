# Scratch Page Command Template

## Quick Reference Format

Use this format to reference scratch elements when requesting changes to real pages:

```
[REF-ID]: [Change Description]
```

Or with context:
```
[PAGE] → [REF-ID]: [Change Description]
```

---

## Command Examples

### Basic Format
```
DASH-005: Change background color to blue
```

### With Page Context (Optional)
```
Dashboard → DASH-005: Change background color to blue
```

### Multiple Elements
```
DASH-005: Change background to blue
DASH-006: Increase padding to 8px
```

### With Real Component Reference (for clarity)
```
DASH-005 (LiveOperationsWidget): Change background to blue
```

---

## Reference ID System

### Dashboard (`DASH-*`)
- **DASH-001**: Header
- **DASH-002**: Sidebar
- **DASH-003**: Main Content Area
- **DASH-004**: Widget Grid Container
- **DASH-005**: Live Operations Widget → `LiveOperationsWidget.tsx`
- **DASH-006**: Revenue Widget → `RevenueWidget.tsx`
- **DASH-007**: Performance Metrics Widget → `PerformanceMetricsWidget.tsx`
- **DASH-008**: Stats Cards Row
- **DASH-009**: Fleet Status Widget → `FleetStatusWidget.tsx`

### Trips Page (`TRP-*`)
- **TRP-001**: Page Header
- **TRP-002**: Calendar View
- **TRP-003**: Trip Details Panel

### Clients Page (`CLT-*`)
- See `ScratchClients.tsx` for full list

### Drivers Page (`DRV-*`)
- See `ScratchDrivers.tsx` for full list

---

## Usage Tips

1. **Always use the REF-ID** from the scratch page tag (e.g., `DASH-005`)
2. **Include the change** you want (styling, layout, content)
3. **Optional**: Mention the real component name for extra clarity
4. **For nested elements**: Use descriptive names like "DASH-005 header" or "DASH-005 content area"

## Applying Changes to Real Dashboard

To apply changes from the scratch page to the actual dashboard components, use:

```
APPLY [REF-ID]: [Change Description]
```

Or with the component name:
```
APPLY DASH-005 (LiveOperationsWidget): [Change Description]
```

### Examples:
```
APPLY DASH-005: Change to full width (lg:col-span-4)
APPLY DASH-006: Increase padding to 8px
APPLY DASH-009: Change header background color to dark gray
```

### What Happens:
1. **Scratch-only changes** (default): Changes stay on scratch page only
2. **APPLY command**: Changes are applied to both scratch AND the real component file

---

## Example Workflow

1. **View scratch page**: Go to `/scratch` and select the page
2. **Identify element**: Note the REF-ID tag (e.g., `DASH-005`)
3. **Request change**: 
   ```
   DASH-005: Make the header background darker
   ```
4. **AI locates**:
   - Scratch element: `data-scratch-ref="DASH-005"` in `ScratchDashboard.tsx`
   - Real component: `LiveOperationsWidget.tsx` (mapped via reference)
   - Applies change to real component

---

## Mapping Scratch → Real Components

| Scratch REF | Scratch Name | Real Component | Location |
|-------------|--------------|----------------|----------|
| DASH-005 | Live Operations | `LiveOperationsWidget` | `client/src/components/dashboard/LiveOperationsWidget.tsx` |
| DASH-006 | Revenue Widget | `RevenueWidget` | `client/src/components/dashboard/RevenueWidget.tsx` |
| DASH-007 | Performance Metrics | `PerformanceMetricsWidget` | `client/src/components/dashboard/PerformanceMetricsWidget.tsx` |
| DASH-009 | Fleet Status | `FleetStatusWidget` | `client/src/components/dashboard/FleetStatusWidget.tsx` |

---

## Advanced: Nested Element References

For sub-elements within a widget:

```
DASH-005 > header: Change font size to 20px
DASH-005 > content: Add border
DASH-005 > stats section: Change background color
```

---

*This template ensures efficient communication between scratch wireframes and real implementations.*

