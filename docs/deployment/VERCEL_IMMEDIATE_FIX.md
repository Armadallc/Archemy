# Immediate Vercel Build Fix

## The Problem
Vercel is still running `npm run build` which executes the old package.json script without `npx`.

## Immediate Solution: Vercel Dashboard Override

### Step-by-Step:

1. **Go to Vercel Dashboard**
   - https://vercel.com/dashboard
   - Click your HALCYON project

2. **Settings → General**
   - Click **Settings** tab
   - Click **General** in left sidebar

3. **Build & Development Settings**
   - Scroll to **Build & Development Settings** section

4. **Override Build Command**
   - Find **Build Command** field
   - **IMPORTANT:** Make sure the **Override** toggle/checkbox is **ON/CHECKED**
   - **Clear the entire field**
   - Type exactly (no quotes, no extra spaces):
     ```
     npx vite build
     ```

5. **Save**
   - Click **Save** button at bottom

6. **Redeploy**
   - Go to **Deployments** tab
   - Click **⋯** (three dots) on latest deployment
   - Click **Redeploy**

---

## What Should Happen

After override, build logs should show:
```
Running "build" command: `npx vite build`...
```

**NOT:**
```
> npm run build
> vite build && esbuild...
```

---

## If Override Still Doesn't Work

Try these alternatives in the Build Command field:

**Option 1:**
```
bash -c "npx vite build"
```

**Option 2:**
```
npm run build:vercel || npx vite build
```

**Option 3:** Create a new script in package.json:
```json
"build:vercel": "npx vite build"
```

Then override with:
```
npm run build:vercel
```

---

## Long-Term Fix

Once the override works, merge the fix to main:

1. Create PR: `feature/consistent-typography-headers` → `main`
2. Merge PR
3. Vercel will auto-deploy with the fix
4. You can then remove the override

---

**Status:** ✅ `vercel.json` updated with `npx vite build`. Override in dashboard should work now.

