# Calendar Migration - Quick Rollback Reference

## 🚨 Emergency Rollback

### Fastest Method
```bash
./scripts/rollback-calendar.sh
```

### Manual Restore
```bash
cp client/src/components/EnhancedTripCalendar.tsx.backup client/src/components/EnhancedTripCalendar.tsx
cp client/src/pages/calendar.tsx.backup client/src/pages/calendar.tsx
```

## 📍 Current State

**Backup Files Created:** ✅
- `client/src/components/EnhancedTripCalendar.tsx.backup`
- `client/src/pages/calendar.tsx.backup`

**Git Status:**
- Last commit: `0d9684cd`
- EnhancedTripCalendar.tsx: Modified (uncommitted)

## ✅ Verification Checklist

After rollback, verify:
- [ ] Calendar page loads: http://localhost:5173/calendar
- [ ] Month/Week/Today views work
- [ ] Trip data displays
- [ ] No console errors
- [ ] No TypeScript errors

## 📞 Need Help?

See full documentation: `docs/calendar/CALENDAR_MIGRATION_STATUS.md`

