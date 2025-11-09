# Development Workflow Scripts

This directory contains scripts to support a structured daily development workflow for the HALCYON transportation management application.

## 🎯 Purpose

These scripts help maintain focus, track progress, and create safe rollback points during development. They're designed for solo development with AI pair programming (Cursor).

## 📋 Available Scripts

### 1. `morning-check.sh` - Start Session Awareness
**Purpose:** Begin each development session with full situational awareness

**Usage:**
```bash
./scripts/morning-check.sh
```

**What it shows:**
- Current git branch and uncommitted changes
- Last commit message and timing
- Today's planned goals (if any)
- System health (TypeScript, database, dev server)
- Recent errors (if any)

**When to use:** At the start of every development session

---

### 2. `new-session.sh` - Define Session Goals
**Purpose:** Force clear goal definition before starting coding

**Usage:**
```bash
./scripts/new-session.sh
```

**What it does:**
- Creates `daily-logs/YYYY-MM-DD.md` with structured template
- Pre-populates timestamps and git commit hash
- Opens file in your default editor
- Handles existing files gracefully

**When to use:** Before starting focused work on a new feature

---

### 3. `quick-commit.sh` - Effortless Commits
**Purpose:** Make committing working increments effortless

**Usage:**
```bash
./scripts/quick-commit.sh "Your commit message"
./scripts/quick-commit.sh "Your commit message" --no-push
```

**What it does:**
- Stages all changes (`git add .`)
- Formats message with ✅ prefix
- Commits and pushes to current branch
- Shows confirmation with commit hash
- Handles push failures gracefully

**When to use:** After completing small working increments

---

### 4. `checkpoint.sh` - Create Save Points
**Purpose:** Create explicit "save points" when something works

**Usage:**
```bash
./scripts/checkpoint.sh "Storage buckets created"
```

**What it does:**
- Runs health checks (TypeScript compilation, build test)
- Creates git commit and lightweight tag
- Logs checkpoint in `daily-logs/checkpoints.md`
- Provides rollback instructions
- Fails gracefully if health checks don't pass

**When to use:** After completing major working features

---

### 5. `end-session.sh` - Capture Accomplishments
**Purpose:** Capture what was accomplished before stopping work

**Usage:**
```bash
./scripts/end-session.sh
```

**What it does:**
- Interactive prompts for completion summary
- Appends to today's session log
- Creates `daily-logs/next-session.md` with handoff info
- Records git state and next priorities

**When to use:** At the end of each development session

---

## 🚀 Daily Workflow Example

### Morning (Starting Session):
```bash
./scripts/morning-check.sh          # See where you left off
./scripts/new-session.sh            # Create today's intent log
npm run dev                         # Start development
```

### During Development:
```bash
# After each small working increment:
./scripts/checkpoint.sh "Upload function works"
./scripts/quick-commit.sh "Storage: Upload helper implemented"
```

### End of Session:
```bash
./scripts/end-session.sh            # Log what was accomplished
./scripts/quick-commit.sh "WIP: Trip photos 60% done"
```

### Next Session:
```bash
./scripts/morning-check.sh          # Picks up where you left off
# Continue from next-session.md
```

---

## 📁 File Structure

```
scripts/
├── morning-check.sh      # Session awareness
├── new-session.sh        # Goal definition
├── quick-commit.sh       # Easy commits
├── checkpoint.sh         # Save points
└── end-session.sh        # Session closure

daily-logs/
├── TEMPLATE.md           # Session log template
├── 2025-10-11.md        # Today's session log
├── next-session.md      # Next session handoff
└── checkpoints.md       # Working milestone log
```

---

## ⚙️ Setup Instructions

1. **Make scripts executable:**
   ```bash
   chmod +x scripts/*.sh
   ```

2. **Test the scripts:**
   ```bash
   ./scripts/morning-check.sh
   ```

3. **Create your first session log:**
   ```bash
   ./scripts/new-session.sh
   ```

---

## 🔧 Customization

### Editor Preferences
The scripts will try to open files in this order:
1. VS Code (`code`)
2. Nano (`nano`)
3. Vim (`vim`)
4. Manual editing prompt

### Health Check Commands
The scripts use these commands for health checks:
- TypeScript: `npm run check`
- Build: `npm run build`
- Dev Server: `npm run dev` (with timeout)

### Git Workflow
Scripts work with any git workflow but are optimized for:
- Feature branches
- Frequent commits
- Lightweight tags for checkpoints

---

## 🆘 Troubleshooting

### Script Permission Errors
```bash
chmod +x scripts/*.sh
```

### Git Not Found
Ensure git is installed and accessible from PATH.

### Editor Not Opening
Scripts will fall back to manual editing prompts if no editor is found.

### Health Check Failures
Checkpoint creation will fail if:
- TypeScript compilation has errors
- Build process fails
- This prevents creating checkpoints of broken code

---

## 📝 Best Practices

1. **Start each session** with `morning-check.sh`
2. **Define clear goals** with `new-session.sh`
3. **Commit frequently** with `quick-commit.sh`
4. **Create checkpoints** after major features work
5. **End sessions** with `end-session.sh`
6. **Review next-session.md** before starting new work

---

## 🎯 Integration with Existing Workflow

These scripts integrate with your existing:
- **Git workflow** (works with any branching strategy)
- **Package.json scripts** (uses `npm run dev`, `npm run check`, `npm run build`)
- **Supabase setup** (tests database connectivity)
- **TypeScript setup** (validates compilation)
- **VS Code** (opens files in editor)

The scripts are designed to enhance your existing workflow, not replace it.
