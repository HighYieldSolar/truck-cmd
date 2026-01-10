#===============================================================================
# Ralph Wiggum - PowerShell Version for Windows
#===============================================================================
# A simplified PowerShell implementation of Ralph for Windows users
# who prefer not to use Git Bash.
#
# Usage:
#   .\ralph.ps1 [-MaxIterations 20] [-Verbose]
#===============================================================================

param(
    [int]$MaxIterations = 20,
    [int]$TimeoutMinutes = 15,
    [switch]$VerboseOutput
)

$ErrorActionPreference = "Stop"

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$PromptFile = Join-Path $ScriptDir "PROMPT.md"
$PrdFile = Join-Path $ScriptDir "prd.json"
$ProgressFile = Join-Path $ScriptDir "progress.txt"
$LogDir = Join-Path $ScriptDir "logs"
$StatusFile = Join-Path $ScriptDir "status.json"

$CompletionPromise = "<promise>COMPLETE</promise>"
$SleepBetweenIterations = 5

# Ensure log directory exists
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir | Out-Null
}

$LogFile = Join-Path $LogDir "ralph-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

#-------------------------------------------------------------------------------
# Helper Functions
#-------------------------------------------------------------------------------

function Write-Log {
    param(
        [string]$Level,
        [string]$Message
    )

    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $Color = switch ($Level) {
        "INFO"    { "Cyan" }
        "WARN"    { "Yellow" }
        "ERROR"   { "Red" }
        "SUCCESS" { "Green" }
        "LOOP"    { "Magenta" }
        default   { "White" }
    }

    Write-Host "[$Timestamp] [$Level] $Message" -ForegroundColor $Color
    "[$Timestamp] [$Level] $Message" | Out-File -Append -FilePath $LogFile
}

function Update-Status {
    param(
        [int]$LoopCount,
        [string]$Status,
        [string]$LastAction = ""
    )

    $StatusObj = @{
        timestamp = (Get-Date -Format "o")
        loop_count = $LoopCount
        max_iterations = $MaxIterations
        status = $Status
        last_action = $LastAction
        project = "Truck Command"
    }

    $StatusObj | ConvertTo-Json | Out-File -FilePath $StatusFile
}

function Test-Completion {
    param([string]$Response)

    if ($Response -match [regex]::Escape($CompletionPromise)) {
        return $true
    }

    $CompletionPhrases = @(
        "all stories complete",
        "all tasks complete",
        "project complete"
    )

    foreach ($phrase in $CompletionPhrases) {
        if ($Response -match $phrase) {
            return $true
        }
    }

    return $false
}

function Build-Prompt {
    param([int]$Iteration)

    $BasePrompt = Get-Content -Path $PromptFile -Raw

    $Context = @"
## Current Session Context
- **Iteration**: $Iteration of $MaxIterations
- **Timestamp**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
- **Working Directory**: $ProjectRoot

## Instructions
1. Read prd.json for current task status
2. Select the highest priority incomplete story
3. Implement the feature following acceptance criteria
4. Run linting: ``npm run lint``
5. Test your changes
6. Commit with descriptive message
7. Update prd.json to mark story as complete
8. Add learnings to progress.txt

## Completion
When ALL stories in prd.json are complete, output exactly:
$CompletionPromise

---

$BasePrompt
"@

    return $Context
}

#-------------------------------------------------------------------------------
# Main Loop
#-------------------------------------------------------------------------------

function Start-RalphLoop {
    Write-Host ""
    Write-Host "===============================================================================" -ForegroundColor Magenta
    Write-Host "    Ralph Wiggum - Autonomous AI Development Loop" -ForegroundColor Magenta
    Write-Host "    Truck Command - PowerShell Edition" -ForegroundColor Magenta
    Write-Host "===============================================================================" -ForegroundColor Magenta
    Write-Host ""

    # Check for Claude CLI
    $ClaudeExists = Get-Command "claude" -ErrorAction SilentlyContinue
    if (-not $ClaudeExists) {
        Write-Log "ERROR" "Claude Code CLI not found. Please install it first."
        exit 1
    }

    # Check for required files
    if (-not (Test-Path $PromptFile)) {
        Write-Log "ERROR" "Prompt file not found: $PromptFile"
        exit 1
    }

    Write-Log "SUCCESS" "Ralph initialized successfully"
    Write-Log "INFO" "Max iterations: $MaxIterations"
    Write-Log "INFO" "Press Ctrl+C to stop at any time"
    Write-Host ""

    for ($i = 1; $i -le $MaxIterations; $i++) {
        Write-Log "LOOP" "========== ITERATION $i of $MaxIterations =========="

        Update-Status -LoopCount $i -Status "running" -LastAction "Starting iteration"

        # Build prompt
        $FullPrompt = Build-Prompt -Iteration $i

        # Run Claude Code
        Write-Log "INFO" "Executing Claude Code..."
        $StartTime = Get-Date

        try {
            # Save prompt to temp file for Claude
            $TempPromptFile = Join-Path $env:TEMP "ralph-prompt-$i.md"
            $FullPrompt | Out-File -FilePath $TempPromptFile -Encoding UTF8

            # Execute Claude with timeout
            $Response = & claude -p $FullPrompt --dangerously-skip-permissions 2>&1 | Out-String

            $Duration = ((Get-Date) - $StartTime).TotalSeconds

            Write-Log "INFO" "Iteration completed in $([math]::Round($Duration))s"

            # Log response
            "" | Out-File -Append -FilePath $LogFile
            "--- Iteration $i Response ---" | Out-File -Append -FilePath $LogFile
            $Response | Out-File -Append -FilePath $LogFile
            "--- End Response ---" | Out-File -Append -FilePath $LogFile

            # Check for completion
            if (Test-Completion -Response $Response) {
                Write-Log "SUCCESS" "=========================================="
                Write-Log "SUCCESS" "Ralph completed successfully!"
                Write-Log "SUCCESS" "Total iterations: $i"
                Write-Log "SUCCESS" "=========================================="
                Update-Status -LoopCount $i -Status "complete" -LastAction "Project completed"
                return
            }

            # Update progress
            "" | Out-File -Append -FilePath $ProgressFile
            "### [Iteration $i] - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" | Out-File -Append -FilePath $ProgressFile
            "Duration: $([math]::Round($Duration))s" | Out-File -Append -FilePath $ProgressFile

            Update-Status -LoopCount $i -Status "running" -LastAction "Iteration $i completed"

            # Sleep between iterations
            if ($i -lt $MaxIterations) {
                Write-Log "INFO" "Sleeping ${SleepBetweenIterations}s before next iteration..."
                Start-Sleep -Seconds $SleepBetweenIterations
            }
        }
        catch {
            Write-Log "ERROR" "Error in iteration: $_"
            Update-Status -LoopCount $i -Status "error" -LastAction "Error: $_"
        }
    }

    Write-Log "WARN" "=========================================="
    Write-Log "WARN" "Max iterations reached ($MaxIterations)"
    Write-Log "WARN" "Project may not be complete"
    Write-Log "WARN" "=========================================="
    Update-Status -LoopCount $MaxIterations -Status "max_iterations" -LastAction "Max iterations reached"
}

# Entry point
Set-Location $ProjectRoot
Start-RalphLoop
