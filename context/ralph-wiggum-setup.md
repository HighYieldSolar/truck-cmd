# Ralph Wiggum AI Agent Setup Guide for Truck Command

> **Source**: Information extracted from Greg Isenberg's podcast with Ryan Carson and official documentation.
> **Video**: ["Ralph Wiggum" AI Agent will 10x Claude Code/Amp](https://www.youtube.com/watch?v=RpvQH0r0ecM)

---

## What is Ralph Wiggum?

Ralph Wiggum is an autonomous AI development loop methodology that lets Claude Code work for hours without human intervention. Named after The Simpsons character, it embodies the philosophy of **persistent iteration despite setbacks**.

### Core Philosophy
- **"Ralph is a Bash loop"** - Geoffrey Huntley (original creator)
- **Iteration > Perfection**: Don't aim for perfect on first try. Let the loop refine the work.
- **Failures Are Data**: Each failure teaches what guardrails to add.
- **Persistence Wins**: Keep trying until success.

```bash
# The simplest form of Ralph
while :; do cat PROMPT.md | claude ; done
```

---

## Why Use Ralph for Truck Command?

Ralph Wiggum is ideal for:

1. **Feature Implementation**: Building complete features overnight (e.g., new IFTA reports, compliance modules)
2. **Large Refactors**: Framework migrations, API updates across multiple files
3. **Test Coverage**: "Add tests for all services in src/lib/services/"
4. **Documentation**: Auto-generating API docs, README updates
5. **Batch Operations**: Standardizing code patterns across components

### Real-World Results
- **Y Combinator Hackathon**: 6 repositories shipped overnight for $297 in API costs
- **Contract Work**: $50k worth of development delivered for $297 in API costs
- **CURSED Language**: Entire programming language created over 3 months with single prompt

---

## Installation Options

### Option 1: Official Claude Code Plugin (Recommended)

```bash
# Install from official plugin marketplace
/plugin install ralph-wiggum@claude-plugins-official
```

**Available Commands:**
- `/ralph-loop "<prompt>" --max-iterations N` - Start a loop
- `/ralph-loop "<prompt>" --max-iterations N --completion-promise "COMPLETE"` - Stop when output matches
- `/cancel-ralph` - Kill active loop

### Option 2: Frank Bria's Ralph Implementation (More Features)

```bash
# Clone the repository
git clone https://github.com/frankbria/ralph-claude-code.git
cd ralph-claude-code

# Install globally (one-time setup)
./install.sh

# This adds commands: ralph, ralph-monitor, ralph-setup
```

**Enhanced Features:**
- Rate limiting (100 calls/hour, configurable)
- Circuit breaker with advanced error detection
- tmux integration for live monitoring
- Session continuity with `--continue` flag
- 165+ tests, production-ready

### Option 3: Manual Bash Script Setup

Create these files in your project:

**`scripts/ralph/ralph.sh`**
```bash
#!/bin/bash
# Ralph Wiggum - Autonomous AI Development Loop

MAX_ITERATIONS=${1:-10}
PROMPT_FILE="scripts/ralph/PROMPT.md"
COMPLETION_PROMISE="<promise>COMPLETE</promise>"

for ((i=1; i<=MAX_ITERATIONS; i++)); do
    echo "=== Iteration $i of $MAX_ITERATIONS ==="

    # Run Claude Code with prompt
    OUTPUT=$(cat "$PROMPT_FILE" | claude --dangerously-skip-permissions 2>&1)

    echo "$OUTPUT"

    # Check for completion
    if echo "$OUTPUT" | grep -q "$COMPLETION_PROMISE"; then
        echo "=== COMPLETE: Found completion promise ==="
        exit 0
    fi

    sleep 2
done

echo "=== MAX ITERATIONS REACHED ==="
exit 1
```

Make executable: `chmod +x scripts/ralph/ralph.sh`

---

## File Structure for Truck Command

```
truck-cmd/
├── scripts/
│   └── ralph/
│       ├── ralph.sh              # Main loop script
│       ├── PROMPT.md             # AI instructions per iteration
│       ├── prd.json              # User stories/tasks (PRD format)
│       └── progress.txt          # Learning log & patterns
├── specs/
│   └── requirements.md           # Technical specifications
└── @fix_plan.md                  # Current priorities (optional)
```

---

## Creating Effective Prompts

### PROMPT.md Template for Truck Command

```markdown
# Truck Command Development Task

## Context
You are working on Truck Command, a Next.js 15 trucking business management SaaS.
- **Stack**: Next.js 15, React 19, Supabase, Stripe, Tailwind CSS, DaisyUI
- **Services**: Located in `src/lib/services/`
- **Components**: Located in `src/components/`

## Current Task
Read `prd.json` and select the highest priority incomplete story.

## Per-Iteration Steps
1. **Read Files**: Review prd.json, progress.txt, and relevant source files
2. **Select Story**: Pick next incomplete story (lowest priority number)
3. **Implement**: Write clean, tested code following existing patterns
4. **Typecheck**: Run `npm run lint` - fix any errors
5. **Test**: Ensure functionality works as expected
6. **Commit**: Git commit with descriptive message
7. **Update**: Mark story as done in prd.json, add learnings to progress.txt

## Success Criteria
- All acceptance criteria for the story are met
- No TypeScript/lint errors
- Code follows existing patterns in the codebase
- Git commit made with clear message

## Completion Signal
When ALL stories in prd.json are complete:
<promise>COMPLETE</promise>

## Patterns (from progress.txt)
- Use existing service layer in `src/lib/services/`
- Follow DaisyUI component patterns
- Supabase RLS policies for data isolation
- Use `formatError()` from supabaseClient for errors
```

### prd.json Template

```json
{
  "projectName": "Truck Command Feature Sprint",
  "branchName": "feature/ralph-sprint-001",
  "stories": [
    {
      "id": "TC-001",
      "title": "Add Bulk Fuel Entry Upload",
      "priority": 1,
      "passes": false,
      "acceptanceCriteria": [
        "CSV file upload component in fuel section",
        "Parse CSV with columns: date, gallons, price, state, truck_id",
        "Validate data before insert",
        "Show success/error summary",
        "Auto-sync to expenses via expenseFuelIntegration"
      ],
      "notes": "Reference existing fuel entry form in src/components/fuel/"
    },
    {
      "id": "TC-002",
      "title": "IFTA Quarterly Report PDF Export",
      "priority": 2,
      "passes": false,
      "acceptanceCriteria": [
        "Generate PDF with jsPDF matching official IFTA format",
        "Include all state mileage breakdowns",
        "Calculate fuel tax owed/credit per state",
        "Add download button to IFTA dashboard"
      ],
      "notes": "Use existing jsPDF patterns from invoice generation"
    }
  ]
}
```

### progress.txt Template

```markdown
# Truck Command Ralph Progress Log

## Codebase Patterns
- Services use async/await with Supabase client
- Components use DaisyUI classes + custom Tailwind
- Auth context provides user via useAuth() hook
- All queries filter by user_id for data isolation

## Key Files
- src/lib/supabaseClient.js - Database client
- src/lib/services/* - Business logic layer
- src/components/* - React components by domain
- src/app/(dashboard)/* - Protected dashboard pages

---

## Session Log

### [Iteration 1] - TC-001: Bulk Fuel Upload
- Started implementation
- Created BulkFuelUpload.jsx component
- Learning: CSV parsing needs Papa Parse library
```

---

## Running Ralph for Truck Command

### Basic Usage

```bash
# Using official plugin
/ralph-loop "Implement the features in prd.json for Truck Command" \
  --max-iterations 30 \
  --completion-promise "COMPLETE"

# Using frankbria/ralph-claude-code
cd "C:\Users\jeram\OneDrive\Desktop\truck cmd"
ralph --monitor  # With tmux dashboard
```

### Overnight Development Session

```bash
# Create batch script for overnight work
cat << 'EOF' > overnight-sprint.sh
#!/bin/bash
cd "/Users/jeram/OneDrive/Desktop/truck cmd"

# Phase 1: Core features
/ralph-loop "Phase 1: Implement TC-001 to TC-005. Output <promise>PHASE1_DONE</promise>" \
  --max-iterations 50

# Phase 2: Testing
/ralph-loop "Phase 2: Add tests for all new features. Output <promise>PHASE2_DONE</promise>" \
  --max-iterations 30
EOF

chmod +x overnight-sprint.sh
./overnight-sprint.sh
```

### Parallel Feature Development (Git Worktrees)

```bash
# Create isolated branches for parallel work
git worktree add ../truck-cmd-ifta -b feature/ifta-improvements
git worktree add ../truck-cmd-billing -b feature/billing-v2

# Terminal 1: IFTA features
cd ../truck-cmd-ifta
/ralph-loop "Implement IFTA improvements..." --max-iterations 30

# Terminal 2: Billing features (simultaneously)
cd ../truck-cmd-billing
/ralph-loop "Implement billing V2..." --max-iterations 30
```

---

## Best Practices

### DO
- **Set `--max-iterations`**: Always use as safety net (10-50 typical)
- **Clear completion criteria**: Define exactly what "done" means
- **Use tests as verification**: Let passing tests signal completion
- **Start small**: Test with 5-10 iterations before overnight runs
- **Monitor costs**: Each iteration burns tokens

### DON'T
- **Ambiguous prompts**: "Make it better" won't converge
- **Skip iteration limits**: Can burn through API credits fast
- **Security-sensitive code**: Auth, payments need human review
- **Architectural decisions**: Novel designs need human judgment

### Cost Awareness
- 50-iteration loop on large codebase: $50-100+ in API credits
- Claude Code subscription: Will hit usage limits faster
- Monitor with `ralph-monitor` dashboard

---

## Troubleshooting

### Loop Won't Converge
1. Refine completion criteria in prompt
2. Add more specific acceptance criteria
3. Break task into smaller stories
4. Check progress.txt for repeated failures

### Stuck in Error Loop
- Circuit breaker should catch this (frankbria version)
- Manual: `/cancel-ralph` or Ctrl+C
- Review logs for pattern of failures

### Windows/Git Bash Issues
```bash
# Install jq dependency first
choco install jq
# Or use WSL for better compatibility
```

---

## Useful Links

### Official Resources
- **Official Plugin**: `/plugin install ralph-wiggum@claude-plugins-official`
- **Claude Code Plugins Repo**: https://github.com/anthropics/claude-code

### Community Implementations
- **frankbria/ralph-claude-code**: https://github.com/frankbria/ralph-claude-code
  - Best for production use with monitoring, rate limiting, circuit breaker
- **AwesomeClaude Guide**: https://awesomeclaude.ai/ralph-wiggum
- **Paddo.dev Deep Dive**: https://paddo.dev/blog/ralph-wiggum-autonomous-loops/

### Video Resources
- **Greg Isenberg + Ryan Carson**: https://www.youtube.com/watch?v=RpvQH0r0ecM
- **Matt Pocock Tutorial**: https://www.youtube.com/watch?v=_IK18goX4X8

---

## Example: Truck Command Sprint

Here's a complete example for running a Ralph sprint on Truck Command:

### 1. Create PRD File

```bash
# Create scripts/ralph directory
mkdir -p scripts/ralph
```

### 2. Define Stories in prd.json

```json
{
  "projectName": "Truck Command Q1 Sprint",
  "stories": [
    {
      "id": "TC-SPRINT-001",
      "title": "Add Driver Document Expiration Alerts",
      "priority": 1,
      "passes": false,
      "acceptanceCriteria": [
        "Check document expiration dates daily",
        "Send notification 30/14/7 days before expiry",
        "Dashboard widget showing upcoming expirations",
        "Email notification integration"
      ]
    },
    {
      "id": "TC-SPRINT-002",
      "title": "Fuel Price Analytics Dashboard",
      "priority": 2,
      "passes": false,
      "acceptanceCriteria": [
        "Chart showing fuel price trends over time",
        "Average price per gallon by state",
        "Cost comparison vs national average",
        "Export data to CSV"
      ]
    }
  ]
}
```

### 3. Start Ralph Loop

```bash
/ralph-loop "You are developing Truck Command. Read prd.json in scripts/ralph/, implement each story following TDD. Use existing service patterns in src/lib/services/. Commit after each completed story. Output <promise>SPRINT_COMPLETE</promise> when all stories pass." --max-iterations 40
```

### 4. Monitor Progress

```bash
# In separate terminal
ralph-monitor

# Or check git log
git log --oneline -10
```

---

## Integration with Existing Workflow

Ralph complements the existing Truck Command development setup:

1. **Before Ralph**: Review Obsidian notes for requirements
2. **During Ralph**: Let agent iterate on mechanical implementation
3. **After Ralph**:
   - Run Semgrep security scan on changes
   - Visual verification with BrowserMCP
   - Human review of architectural decisions
   - Final testing before merge

This keeps Ralph focused on mechanical coding while humans handle judgment calls.
