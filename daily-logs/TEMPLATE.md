# Development Session Template

Use this template to create consistent daily development logs.

## 🎯 Today's Single Focus:
[One sentence - what's the ONE thing I'm building today?]

## 🔨 Specific Tasks:
- [ ] [Smallest testable increment]
- [ ] [Next smallest testable increment]
- [ ] [Next smallest testable increment]

## 🚫 Scope Guardrails (What I'm NOT Doing Today):
[List of tempting features that would distract from today's goal]
- Don't start [feature X]
- Don't refactor [system Y]
- Don't redesign [component Z]

## ⏰ Time Budget: [X] hours max
If I can't finish in [X] hours, this goal is too big. Break it smaller.

## 📸 Current State:
**Session Started:** [Timestamp]
**Git Commit:** [Hash]
**Branch:** [Branch name]

## 🧪 Success Criteria:
[How will I know this is "done" today?]
- [ ] [Specific testable outcome]
- [ ] [Feature works in dev environment]
- [ ] [No console errors]

---
## 📝 SESSION LOG (update as you work):

### [Timestamp] - Started
[What you're beginning with]

### [Timestamp] - Progress Update
[What's working, what's not]

### [Timestamp] - Completed
[What you finished]

---
## 📋 COMPLETION SUMMARY:
[Fill this out at end of session]

### ✅ What was completed:
- 

### ⚠️ What's partially done:
- 

### ❌ What broke or needs fixing:
- 

### 💡 Key learnings:
- 

### 🎯 Next session priority:
- 

---
## 🔄 ROLLBACK INSTRUCTIONS:
If something breaks, here's how to get back to a working state:

### Quick Rollback (last commit):
```bash
git reset --hard HEAD~1
```

### Checkpoint Rollback (if available):
```bash
git checkout [checkpoint-tag-name]
```

### Emergency Rollback (to last working state):
```bash
./scripts/rollback-safeguards.sh emergency
```
