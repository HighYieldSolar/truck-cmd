# Ralph Wiggum - Autonomous AI Development Loop

> "Ralph is a Bash loop" - Geoffrey Huntley

This is a manual implementation of the Ralph Wiggum technique for autonomous AI development in the Truck Command project.

## What is Ralph?

Ralph Wiggum is an autonomous development loop that lets Claude Code work for hours without human intervention. It repeatedly feeds Claude the same prompt until completion criteria are met, with each iteration seeing the results of previous work through git history and modified files.

## Quick Start

### Windows (Git Bash)
```bash
# Navigate to ralph directory
cd scripts/ralph

# Make scripts executable (Git Bash)
chmod +x ralph.sh ralph-monitor.sh

# Run Ralph
./ralph.sh

# In a separate terminal, run monitor
./ralph-monitor.sh
```

### Windows (Batch Files)
```cmd
# Double-click or run from cmd
scripts\ralph\ralph.bat

# Monitor in separate window
scripts\ralph\ralph-monitor.bat
```

### Windows (PowerShell)
```powershell
# Run Ralph
.\scripts\ralph\ralph.ps1 -MaxIterations 20

# With verbose output
.\scripts\ralph\ralph.ps1 -MaxIterations 20 -VerboseOutput
```

## File Structure

```
scripts/ralph/
├── ralph.sh              # Main loop script (Bash)
├── ralph.ps1             # Main loop script (PowerShell)
├── ralph.bat             # Windows launcher for Bash script
├── ralph-monitor.sh      # Live monitoring dashboard
├── ralph-monitor.bat     # Windows launcher for monitor
├── PROMPT.md             # Instructions for Claude per iteration
├── prd.json              # Task/story tracker
├── sample-prd.json       # Example PRD with sample stories
├── progress.txt          # Learning log and patterns
├── status.json           # Current status (auto-generated)
├── logs/                 # Session logs (auto-generated)
└── README.md             # This file
```

## Configuration

### ralph.sh Options
```bash
./ralph.sh [OPTIONS]

Options:
  -i, --iterations N    Maximum iterations (default: 20)
  -p, --prompt FILE     Prompt file path (default: PROMPT.md)
  -t, --timeout MINS    Timeout per iteration (default: 15)
  -v, --verbose         Enable verbose output
  -h, --help            Show help
```

### ralph.ps1 Options
```powershell
.\ralph.ps1 [-MaxIterations 20] [-TimeoutMinutes 15] [-VerboseOutput]
```

## Setting Up Your Sprint

### 1. Define Your Stories

Edit `prd.json` to add your development tasks:

```json
{
  "projectName": "My Sprint",
  "stories": [
    {
      "id": "TC-001",
      "title": "Feature Name",
      "priority": 1,
      "passes": false,
      "acceptanceCriteria": [
        "Criterion 1",
        "Criterion 2",
        "Criterion 3"
      ],
      "notes": "Additional context for Claude",
      "files": ["src/components/MyComponent.jsx"]
    }
  ]
}
```

**Priority Rules:**
- Lower numbers = higher priority
- Story with lowest priority number gets implemented first
- Set `passes: true` when story is complete

### 2. Customize the Prompt (Optional)

Edit `PROMPT.md` to adjust Claude's behavior:
- Add project-specific patterns
- Include domain knowledge
- Specify coding standards

### 3. Initialize Progress Log

The `progress.txt` file contains learnings that persist across iterations. Review and update the patterns section with your project specifics.

### 4. Run Ralph

```bash
# Start with conservative iterations
./ralph.sh -i 10

# Monitor in separate terminal
./ralph-monitor.sh
```

## How It Works

1. **Read State**: Claude reads `prd.json` and `progress.txt`
2. **Select Task**: Picks highest priority incomplete story
3. **Implement**: Writes code following acceptance criteria
4. **Validate**: Runs `npm run lint`, fixes errors
5. **Commit**: Creates git commit with `[Ralph]` prefix
6. **Update**: Marks story complete, adds learnings
7. **Repeat**: Continues until all stories complete or max iterations

## Completion Detection

Ralph stops when it detects:
- `<promise>COMPLETE</promise>` in Claude's output
- All stories in `prd.json` marked as `passes: true`
- Multiple consecutive "done" signals
- Max iterations reached

## Safety Features

- **Rate Limiting**: Tracks API calls per hour
- **Error Detection**: Stops after consecutive errors
- **Timeout**: Per-iteration timeout prevents hangs
- **Max Iterations**: Hard limit on total iterations

## Best Practices

### DO
- Start with 10-20 iterations, not 50
- Define clear, measurable acceptance criteria
- Review git commits after each session
- Use the sample-prd.json as a template

### DON'T
- Use for ambiguous tasks ("make it better")
- Skip reviewing the output
- Run overnight without testing first
- Use for security-critical code without review

## Monitoring

The monitor shows:
- Current iteration and status
- API calls this hour
- Story completion progress
- Recent activity log
- Git commit history

Controls:
- `q` - Quit monitor
- `r` - Refresh now
- `l` - View full log
- `s` - Show all stories

## Troubleshooting

### "Claude not found"
Ensure Claude Code CLI is installed and in your PATH:
```bash
npm install -g @anthropic-ai/claude-code
# or
claude --version
```

### "jq not found"
Install jq for JSON parsing:
```bash
# Windows (chocolatey)
choco install jq

# Windows (winget)
winget install jqlang.jq

# Mac
brew install jq
```

### Loop not converging
- Make acceptance criteria more specific
- Break large stories into smaller ones
- Add more context to PROMPT.md
- Check progress.txt for repeated errors

### Permission denied (Git Bash)
```bash
chmod +x ralph.sh ralph-monitor.sh
```

## Cost Awareness

Each iteration burns tokens. A 20-iteration session can cost $20-50+ depending on context size. Monitor your usage and start with conservative iteration limits.

## Resources

- [Original Ralph Wiggum Technique](https://awesomeclaude.ai/ralph-wiggum)
- [Frank Bria's Implementation](https://github.com/frankbria/ralph-claude-code)
- [Claude Code Documentation](https://docs.anthropic.com/claude-code)
