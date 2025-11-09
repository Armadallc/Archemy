# 🔍 MANDATORY INVESTIGATION PROTOCOL

## TRIGGER WORD: `INVESTIGATE_FIRST`

When you see this trigger word at the beginning of any command, you MUST follow this protocol before taking any action.

---

## 🚨 INVESTIGATION REQUIREMENTS

### **STEP 1: PROBLEM IDENTIFICATION**
- [ ] What is the exact error message and where does it occur?
- [ ] What specific functionality is broken or not working?
- [ ] What was the user trying to do when the issue occurred?

### **STEP 2: SYSTEM ARCHITECTURE ANALYSIS**
- [ ] What authentication system is actually in use?
- [ ] What data format does the system expect?
- [ ] How does data flow from frontend to backend?
- [ ] What are the system's actual requirements vs. assumptions?

### **STEP 3: ROOT CAUSE ANALYSIS**
- [ ] What is the actual root cause (not just symptoms)?
- [ ] What component is failing and why?
- [ ] What does the system absolutely require to function?

### **STEP 4: SOLUTION VALIDATION**
- [ ] Does my proposed fix address the root cause?
- [ ] Does it align with the system's actual architecture?
- [ ] Will it break existing functionality?
- [ ] Is it the minimal change needed?

---

## 📋 INVESTIGATION CHECKLIST

Before any action, complete this checklist:

```
🔍 INVESTIGATION CHECKPOINT:
- [ ] Problem identified: [specific error/issue]
- [ ] System architecture understood: [auth method, data flow, etc.]
- [ ] Root cause confirmed: [not just symptoms]
- [ ] Solution validated: [aligns with system requirements]
- [ ] Impact assessed: [won't break existing functionality]
```

---

## ❌ PROHIBITED ACTIONS

- Never assume how a system works
- Never make changes based on "likely" or "probably"
- Never implement fixes without understanding the full context
- Never separate the fix from what the system demands
- Never skip the investigation phase

---

## ✅ REQUIRED ACTIONS

1. **INVESTIGATE** → Read code, understand architecture, identify root cause
2. **ANALYZE** → Verify system requirements and data flow
3. **PROPOSE** → Present solution that aligns with system requirements
4. **IMPLEMENT** → Only after understanding is confirmed
5. **VERIFY** → Confirm fix works as expected

---

## 🎯 EXAMPLE WORKFLOW

**User Command:** `INVESTIGATE_FIRST: Fix the WebSocket error`

**My Response:**
1. **INVESTIGATE:** Let me examine the WebSocket error, authentication system, and data flow
2. **ANALYZE:** The system uses [X] auth method, expects [Y] data format
3. **PROPOSE:** Based on my investigation, the fix should be [Z] because...
4. **IMPLEMENT:** Only after you confirm my understanding is correct

---

## 🔄 ENFORCEMENT

If you see me:
- Making assumptions
- Skipping investigation
- Using phrases like "probably" or "likely"
- Proposing changes without understanding

**STOP ME** and ask: "Have you completed the INVESTIGATION_PROTOCOL?"

---

*This protocol ensures all fixes are grounded in actual system requirements, not assumptions.*















