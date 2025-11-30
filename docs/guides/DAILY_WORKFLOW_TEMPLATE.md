# 🚀 DAILY WORKFLOW TEMPLATE

## **Starting a New Session**

When you want to begin a new development session, say:
> **"Let's begin a new session"**

Then follow this template:

### **Morning Routine (5 minutes):**
```bash
./scripts/morning-check.sh          # Situational awareness
./scripts/new-session.sh            # Define today's goal
npm run dev                         # Start development
```

### **During Development:**
```bash
# After each small working increment:
./scripts/checkpoint.sh "Upload function works"
./scripts/quick-commit.sh "Storage: Upload helper implemented"
```

### **End of Session:**
```bash
./scripts/end-session.sh            # Log accomplishments
./scripts/quick-commit.sh "WIP: Trip photos 60% done"
```

---

## **What Each Script Does:**

### 🌅 **Morning Check** (`morning-check.sh`)
- Shows current git branch and uncommitted changes
- Displays last commit and timing
- Checks system health (TypeScript, database, dev server)
- Shows recent errors (if any)
- **Use:** Start of every session

### 📝 **New Session** (`new-session.sh`)
- Creates `daily-logs/YYYY-MM-DD.md` with structured template
- Pre-populates timestamps and git commit hash
- Opens file in your default editor
- **Use:** Before starting focused work

### ⚡ **Quick Commit** (`quick-commit.sh`)
- Stages all changes (`git add .`)
- Formats message with ✅ prefix
- Commits and pushes to current branch
- **Use:** After completing small working increments

### 🏁 **Checkpoint** (`checkpoint.sh`)
- Runs health checks (TypeScript compilation, build test)
- Creates git commit and lightweight tag
- Logs checkpoint in `daily-logs/checkpoints.md`
- **Use:** After completing major working features

### 🏁 **End Session** (`end-session.sh`)
- Interactive prompts for completion summary
- Appends to today's session log
- Creates `daily-logs/next-session.md` with handoff info
- **Use:** At the end of each development session

---

## **Example Daily Flow:**

### **Morning:**
```bash
$ ./scripts/morning-check.sh
🌅 Development Session Starting
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Current Branch: develop
📝 Uncommitted Files: 3 files modified
🕐 Last Commit: "✅ Fix driver trip filtering"
📅 Committed: 2 hours ago
🎯 TODAY'S PLANNED GOAL: Complete file storage system
✅ System Status: All green
🚀 Ready to start? Run: npm run dev

$ ./scripts/new-session.sh
📝 Session log for today already exists: daily-logs/2025-10-12.md
Opening existing file...

$ npm run dev
```

### **During Development:**
```bash
# After implementing upload function:
$ ./scripts/checkpoint.sh "File upload working"
✅ Health checks passed
✅ Checkpoint created: checkpoint-file-upload-2025-10-12
📝 Logged in daily-logs/checkpoints.md

# After small changes:
$ ./scripts/quick-commit.sh "Storage: Add file validation"
✅ Committed: 7f8a9b2 - Storage: Add file validation
✅ Pushed to develop branch
```

### **End of Session:**
```bash
$ ./scripts/end-session.sh
📝 What did you complete today?
> File upload system, validation, and error handling

📝 What's partially done?
> File retrieval and RLS policies

📝 What broke or needs fixing?
> TypeScript errors in storage helpers

📝 What did you learn?
> Supabase Storage API integration patterns

📝 What's the priority for next session?
> Complete file retrieval and test RLS policies

$ ./scripts/quick-commit.sh "WIP: File storage 75% complete"
✅ Committed: 9c2d4e1 - WIP: File storage 75% complete
✅ Pushed to develop branch
```

---

## **Next Session Handoff:**

When you start your next session, the `morning-check.sh` will show you:
- Where you left off
- What was planned for today
- System status
- Recent errors

The `daily-logs/next-session.md` file will contain:
- What was completed
- What's partially done
- What needs fixing
- Next session priorities

---

## **Quick Reference:**

| Script | When to Use | What it Does |
|--------|-------------|--------------|
| `morning-check.sh` | Start of session | Situational awareness |
| `new-session.sh` | Before focused work | Define goals |
| `quick-commit.sh` | After small changes | Easy commits |
| `checkpoint.sh` | After major features | Create save points |
| `end-session.sh` | End of session | Log accomplishments |

---

## **Pro Tips:**

1. **Always start** with `morning-check.sh` to see where you left off
2. **Use checkpoints** liberally - they're lightweight and safe
3. **Commit frequently** - small, working increments are better
4. **End sessions** properly - it helps with context switching
5. **Review next-session.md** before starting new work

---

## **Integration with AI Pair Programming:**

When working with AI (like Cursor), this workflow helps by:
- Providing clear context about what you're working on
- Creating safe rollback points
- Maintaining focus on specific goals
- Tracking progress systematically
- Enabling easy handoff between sessions

The AI can reference your session logs to understand:
- What you've already tried
- What's working and what's not
- What the current priorities are
- What the next steps should be





