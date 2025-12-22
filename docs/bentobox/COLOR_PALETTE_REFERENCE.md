# BentoBox Calendar - Color Palette Reference

## Fire Design System Colors

### Core Palette

| Color | Hex | Usage | Category Mapping |
|-------|-----|-------|------------------|
| **Coral** | `#ff8475` | Clinical groups | `clinical` |
| **Lime** | `#f1fec9` | Life skills | `life-skills` |
| **Ice** | `#e8fffe` | Recreation | `recreation` |
| **Charcoal** | `#26282b` | Medical | `medical` |
| **Silver** | `#eaeaea` | Administrative | `administrative` |

### Extended Palette

| Color | Hex | Usage |
|-------|-----|-------|
| **Coral Dark** | `#e04850` | Darker coral variant |
| **Coral Light** | `#ff7a80` | Lighter coral variant |
| **Lime Dark** | `#d4e5a8` | Darker lime variant (borders) |
| **Lime Light** | `#f7ffdf` | Lighter lime variant |
| **Ice Dark** | `#b8e5e3` | Darker ice variant (borders) |
| **Ice Light** | `#f0fffe` | Lighter ice variant |
| **Charcoal Light** | `#363a3e` | Lighter charcoal variant |
| **Charcoal Lighter** | `#464a4f` | Even lighter charcoal |
| **Silver Dark** | `#d4d4d4` | Darker silver variant (borders) |
| **Silver Light** | `#f4f4f4` | Lighter silver variant (cloud) |

### Background Colors

| Color | Usage | Tailwind Class |
|-------|-------|----------------|
| **Cloud** | `#f4f4f4` | Light mode background | `bg-cloud` or `bg-[#f4f4f4]` |
| **Shadow** | `#343434` | Dark mode accents | `bg-[#343434]` |

## Current Color Usage in BentoBox

### Event/Encounter Colors

**Pattern**: Background with opacity + Text color + Left border accent

```typescript
// Coral (Clinical)
bg-[#ff8475]/20 text-[#ff8475] border-l-4 border-[#ff8475] hover:bg-[#ff8475]/30

// Lime (Life Skills)
bg-[#f1fec9]/60 text-[#26282b] border-l-4 border-[#d4e5a8] hover:bg-[#f1fec9]/80 dark:text-[#26282b]

// Ice (Recreation)
bg-[#e8fffe]/60 text-[#26282b] border-l-4 border-[#b8e5e3] hover:bg-[#e8fffe]/80 dark:text-[#26282b]

// Charcoal (Medical)
bg-[#26282b]/20 text-[#26282b] border-l-4 border-[#26282b] hover:bg-[#26282b]/30 dark:bg-[#26282b]/40 dark:text-[#eaeaea]

// Silver (Administrative)
bg-[#eaeaea]/60 text-[#26282b] border-l-4 border-[#d4d4d4] hover:bg-[#eaeaea]/80 dark:text-[#26282b]
```

### Opacity Levels

- **Coral**: 20% background, 30% hover
- **Lime**: 60% background, 80% hover
- **Ice**: 60% background, 80% hover
- **Charcoal**: 20% background, 30% hover (40% in dark mode)
- **Silver**: 60% background, 80% hover

### Border Pattern

All events use a **left border** (`border-l-4`) with the same color as the event:
- Coral: `border-[#ff8475]`
- Lime: `border-[#d4e5a8]` (limeDark)
- Ice: `border-[#b8e5e3]` (iceDark)
- Charcoal: `border-[#26282b]`
- Silver: `border-[#d4d4d4]` (silverDark)

## Integration Rules

### ✅ Allowed

1. **Use only Fire palette colors** for calendar events
2. **Use extended palette shades** for borders and accents
3. **Maintain opacity patterns** (20% for coral/charcoal, 60% for lime/ice/silver)
4. **Use left border accent** pattern for consistency
5. **Map external colors** to Fire palette using `color-adapter.ts`

### ❌ Not Allowed

1. **No arbitrary colors** outside Fire palette
2. **No full opacity backgrounds** (must use opacity for readability)
3. **No right/top/bottom borders** (only left border for events)
4. **No color mixing** (stick to single Fire color per event)

## Color Mapping for Full-Calendar Integration

When integrating full-calendar components, use this mapping:

```typescript
// External color → Fire color
'red' → 'coral'
'green' → 'lime'
'blue' → 'ice'
'gray' → 'charcoal'
'white' → 'silver'
```

See `client/src/components/bentobox-calendar/adapters/color-adapter.ts` for full mapping.

## Dark Mode Considerations

- **Charcoal** events use higher opacity in dark mode (40% vs 20%)
- **Text colors** switch to light colors (`#eaeaea`) on dark backgrounds
- **Borders** remain the same color but may need contrast adjustment

## Testing Checklist

- [ ] All events use Fire palette colors only
- [ ] Opacity levels match existing pattern
- [ ] Left border accent is present
- [ ] Hover states work correctly
- [ ] Dark mode colors are appropriate
- [ ] No color conflicts with existing UI
- [ ] External colors are mapped correctly

