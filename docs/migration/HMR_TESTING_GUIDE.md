# Hot Module Replacement (HMR) Testing Guide

**Date:** 2025-01-27  
**Vite Version:** 7.2.2  
**Purpose:** Verify HMR works correctly after Vite 7 migration

---

## 🎯 What is HMR?

**Hot Module Replacement (HMR)** allows you to update code in your browser without a full page reload. When you save a file:
- ✅ Only the changed component updates
- ✅ Application state is preserved (form inputs, scroll position, etc.)
- ✅ No page refresh needed
- ✅ Fast updates (< 1 second typically)

---

## ✅ Pre-Testing Checklist

- [ ] Vite dev server is running on port 5173
- [ ] Backend server is running on port 8081
- [ ] Browser is open to `http://localhost:5173`
- [ ] Browser DevTools are open (F12)

---

## 🧪 HMR Test Steps

### Step 1: Verify Dev Server is Running

```bash
# Check if Vite dev server is running
lsof -ti :5173

# If not running, start it:
cd client && npx vite --host 0.0.0.0 --port 5173
```

**Expected:** Server should be running and accessible at `http://localhost:5173`

---

### Step 2: Open Application in Browser

1. Open your browser (Chrome recommended)
2. Navigate to: `http://localhost:5173`
3. Open DevTools (F12 or Cmd+Option+I on Mac)
4. Go to the **Console** tab
5. Look for Vite HMR connection message

**Expected Console Output:**
```
[vite] connecting...
[vite] connected.
```

---

### Step 3: Make a Test Change

We'll test HMR by making a visible change to a component. Here are good test files:

**Option A: Simple Text Change (Easiest)**
- File: `client/src/App.tsx` or main layout component
- Change: Update a visible text string

**Option B: Style Change**
- File: Any component with visible styling
- Change: Modify a color or size

**Option C: Component Logic**
- File: A component with state
- Change: Modify a conditional render

---

### Step 4: Save and Observe

1. **Save the file** (Cmd+S / Ctrl+S)
2. **Watch the browser** - you should see:
   - ✅ The change appears **immediately**
   - ✅ **No page reload** (no white flash)
   - ✅ **State is preserved** (if you had form inputs filled, they stay filled)
   - ✅ **Scroll position** is maintained

3. **Check the Console:**
   - Look for: `[vite] hot updated: /path/to/file`
   - Should NOT see: Full page reload messages

4. **Check the Network Tab:**
   - Should see HMR WebSocket messages
   - Should NOT see full page reload requests

---

### Step 5: Test State Preservation

1. **Fill out a form** (if available)
2. **Scroll the page** to a specific position
3. **Make a change** to a component (not the form)
4. **Verify:**
   - ✅ Form inputs are still filled
   - ✅ Scroll position is maintained
   - ✅ Component updated correctly

---

## 🔍 What to Look For

### ✅ Success Indicators

- Change appears instantly (< 1 second)
- No page reload (no white flash)
- Console shows: `[vite] hot updated: ...`
- State is preserved
- No errors in console

### ❌ Failure Indicators

- Page fully reloads (white flash)
- Form inputs are cleared
- Scroll position resets
- Console shows errors
- Network tab shows full page requests

---

## 🐛 Troubleshooting

### HMR Not Working?

1. **Check Dev Server:**
   ```bash
   # Verify server is running
   lsof -ti :5173
   ```

2. **Check Console for Errors:**
   - Look for WebSocket connection errors
   - Check for module loading errors

3. **Check File Path:**
   - Make sure you're editing files in `client/src/`
   - Vite only watches files in the configured root

4. **Check File Extension:**
   - HMR works best with `.tsx`, `.ts`, `.jsx`, `.js`
   - CSS files also support HMR

5. **Restart Dev Server:**
   ```bash
   # Kill and restart
   lsof -ti :5173 | xargs kill -9
   cd client && npx vite --host 0.0.0.0 --port 5173
   ```

---

## 📝 Test Results Template

### Test 1: Simple Text Change
- **File:** _________________
- **Change:** _________________
- **Result:** ✅ Pass / ❌ Fail
- **Notes:** _________________

### Test 2: Style Change
- **File:** _________________
- **Change:** _________________
- **Result:** ✅ Pass / ❌ Fail
- **Notes:** _________________

### Test 3: State Preservation
- **File:** _________________
- **Change:** _________________
- **Result:** ✅ Pass / ❌ Fail
- **Notes:** _________________

### Test 4: Component Logic
- **File:** _________________
- **Change:** _________________
- **Result:** ✅ Pass / ❌ Fail
- **Notes:** _________________

---

## ✅ Success Criteria

- [ ] HMR updates appear instantly (< 1 second)
- [ ] No full page reloads occur
- [ ] State is preserved during updates
- [ ] Console shows HMR update messages
- [ ] No errors in browser console
- [ ] Works for both component and style changes

---

## 📊 Expected Performance

- **Update Time:** < 1 second
- **State Preservation:** 100%
- **Reliability:** No full reloads needed

---

**Ready to test?** Follow the steps above and document your results!

