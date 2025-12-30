# Import Dropdown Menu from Full-Calendar Repo

## Manual Steps

Since automated fetching has SSL certificate issues, here are manual steps:

### Option 1: Direct Download
1. Open: https://raw.githubusercontent.com/yassir-jeraidi/full-calendar/main/src/components/ui/dropdown-menu.tsx
2. Copy the entire file content
3. Save it as: `client/src/components/ui/dropdown-menu-full-calendar.tsx`
4. Compare with existing: `client/src/components/ui/dropdown-menu.tsx`
5. Replace or merge as needed

### Option 2: Using Git (Recommended)
```bash
# Clone the repo temporarily
cd /tmp
git clone https://github.com/yassir-jeraidi/full-calendar.git
cd full-calendar

# Copy the dropdown-menu component
cp src/components/ui/dropdown-menu.tsx /Users/sefebrun/Projects/HALCYON/client/src/components/ui/dropdown-menu-full-calendar.tsx

# Clean up
cd ..
rm -rf full-calendar
```

### Option 3: Using npm/yarn (If available)
```bash
# If the repo is published as a package
npm install @yassir-jeraidi/full-calendar
# Then copy from node_modules
```

## After Import

1. **Compare the files:**
   ```bash
   diff client/src/components/ui/dropdown-menu.tsx client/src/components/ui/dropdown-menu-full-calendar.tsx
   ```

2. **Update StaffFilter.tsx** to use the imported component:
   ```typescript
   // If keeping both, use the full-calendar version
   import {
     DropdownMenu,
     DropdownMenuContent,
     DropdownMenuTrigger,
     // ... etc
   } from '../ui/dropdown-menu-full-calendar';
   ```

3. **Or replace the existing one:**
   ```bash
   mv client/src/components/ui/dropdown-menu.tsx client/src/components/ui/dropdown-menu.backup.tsx
   mv client/src/components/ui/dropdown-menu-full-calendar.tsx client/src/components/ui/dropdown-menu.tsx
   ```

4. **Test the component** to ensure it works correctly

## Notes

- Both repos use ShadCN UI, so components should be very similar
- The main differences might be in styling or additional props
- Check for any dependencies that need to be installed




