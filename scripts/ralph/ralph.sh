#!/bin/bash
#===============================================================================
# Ralph Wiggum - Autonomous AI Development Loop for Truck Command
#===============================================================================
# "Ralph is a Bash loop" - Geoffrey Huntley
#
# This script implements the Ralph Wiggum technique for Claude Code,
# enabling continuous autonomous development cycles where Claude iteratively
# improves your project until completion.
#
# Usage:
#   ./ralph.sh [OPTIONS]
#
# Options:
#   -i, --iterations N    Maximum iterations (default: 20)
#   -p, --prompt FILE     Prompt file path (default: PROMPT.md)
#   -t, --timeout MINS    Timeout per iteration in minutes (default: 15)
#   -v, --verbose         Enable verbose output
#   -h, --help            Show this help message
#
# Requirements:
#   - Claude Code CLI installed and authenticated
#   - jq (for JSON parsing) - install via: choco install jq (Windows) or brew install jq (Mac)
#   - Git repository initialized
#===============================================================================

set -e  # Exit on any error

# Script directory for relative paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

#-------------------------------------------------------------------------------
# Configuration
#-------------------------------------------------------------------------------
MAX_ITERATIONS=10
PROMPT_FILE="$SCRIPT_DIR/PROMPT.md"
PRD_FILE="$SCRIPT_DIR/prd.json"
PROGRESS_FILE="$SCRIPT_DIR/progress.txt"
LOG_DIR="$SCRIPT_DIR/logs"
LOG_FILE="$LOG_DIR/ralph-$(date +%Y%m%d-%H%M%S).log"
STATUS_FILE="$SCRIPT_DIR/status.json"
CALL_COUNT_FILE="$SCRIPT_DIR/.call_count"
TIMESTAMP_FILE="$SCRIPT_DIR/.last_reset"

# Claude Code configuration
CLAUDE_CMD="claude"
CLAUDE_TIMEOUT_MINUTES=10
COMPLETION_PROMISE="<promise>COMPLETE</promise>"

# Rate limiting (adjust based on your plan)
MAX_CALLS_PER_HOUR=50
SLEEP_BETWEEN_ITERATIONS=5

# Verbose mode
VERBOSE=false

# Exit detection
CONSECUTIVE_DONE_SIGNALS=0
MAX_CONSECUTIVE_DONE=3
CONSECUTIVE_ERRORS=0
MAX_CONSECUTIVE_ERRORS=5

#-------------------------------------------------------------------------------
# Colors for terminal output
#-------------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

#-------------------------------------------------------------------------------
# Helper Functions
#-------------------------------------------------------------------------------

show_help() {
    head -n 30 "$0" | tail -n 28
    exit 0
}

log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local color=""

    case $level in
        "INFO")    color=$BLUE ;;
        "WARN")    color=$YELLOW ;;
        "ERROR")   color=$RED ;;
        "SUCCESS") color=$GREEN ;;
        "LOOP")    color=$PURPLE ;;
        "DEBUG")   color=$CYAN ;;
    esac

    echo -e "${color}[$timestamp] [$level] $message${NC}"
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

log_verbose() {
    if [[ "$VERBOSE" == "true" ]]; then
        log "DEBUG" "$1"
    fi
}

#-------------------------------------------------------------------------------
# Initialization
#-------------------------------------------------------------------------------

init() {
    # Create directories
    mkdir -p "$LOG_DIR"

    # Initialize log file
    echo "===============================================================================" >> "$LOG_FILE"
    echo "Ralph Wiggum Session Started: $(date)" >> "$LOG_FILE"
    echo "Project: Truck Command" >> "$LOG_FILE"
    echo "Max Iterations: $MAX_ITERATIONS" >> "$LOG_FILE"
    echo "===============================================================================" >> "$LOG_FILE"

    # Check dependencies
    check_dependencies

    # Initialize call tracking
    init_call_tracking

    # Verify required files exist
    verify_files

    log "SUCCESS" "Ralph initialized successfully"
}

check_dependencies() {
    log "INFO" "Checking dependencies..."

    # Check for Claude CLI
    if ! command -v $CLAUDE_CMD &> /dev/null; then
        log "ERROR" "Claude Code CLI not found. Please install it first."
        log "INFO" "Visit: https://docs.anthropic.com/en/docs/claude-code"
        exit 1
    fi

    # Check for jq (optional but recommended)
    if ! command -v jq &> /dev/null; then
        log "WARN" "jq not found. Some features may be limited."
        log "INFO" "Install jq: choco install jq (Windows) or brew install jq (Mac)"
    fi

    # Check for git
    if ! command -v git &> /dev/null; then
        log "ERROR" "Git not found. Please install it first."
        exit 1
    fi

    log "SUCCESS" "All required dependencies found"
}

verify_files() {
    log "INFO" "Verifying required files..."

    if [[ ! -f "$PROMPT_FILE" ]]; then
        log "ERROR" "Prompt file not found: $PROMPT_FILE"
        log "INFO" "Please create PROMPT.md with your development instructions"
        exit 1
    fi

    if [[ ! -f "$PRD_FILE" ]]; then
        log "WARN" "PRD file not found: $PRD_FILE"
        log "INFO" "Creating empty PRD file..."
        echo '{"projectName": "Truck Command", "stories": []}' > "$PRD_FILE"
    fi

    if [[ ! -f "$PROGRESS_FILE" ]]; then
        log "INFO" "Creating progress file..."
        cat > "$PROGRESS_FILE" << 'PROGRESSEOF'
# Truck Command - Ralph Progress Log
# This file tracks learnings and patterns discovered during development

## Codebase Patterns
- Services use async/await with Supabase client
- Components use DaisyUI classes + custom Tailwind
- Auth context provides user via useAuth() hook
- All queries filter by user_id for data isolation

## Key Files
- src/lib/supabaseClient.js - Database client with formatError()
- src/lib/services/* - Business logic layer
- src/components/* - React components by domain
- src/app/(dashboard)/* - Protected dashboard pages

---

## Session Log

PROGRESSEOF
    fi

    log "SUCCESS" "All required files verified"
}

init_call_tracking() {
    local current_hour=$(date +%Y%m%d%H)
    local last_reset_hour=""

    if [[ -f "$TIMESTAMP_FILE" ]]; then
        last_reset_hour=$(cat "$TIMESTAMP_FILE")
    fi

    # Reset counter if it's a new hour
    if [[ "$current_hour" != "$last_reset_hour" ]]; then
        echo "0" > "$CALL_COUNT_FILE"
        echo "$current_hour" > "$TIMESTAMP_FILE"
        log_verbose "Call counter reset for new hour"
    fi
}

#-------------------------------------------------------------------------------
# Rate Limiting
#-------------------------------------------------------------------------------

can_make_call() {
    local calls_made=0
    if [[ -f "$CALL_COUNT_FILE" ]]; then
        calls_made=$(cat "$CALL_COUNT_FILE")
    fi

    if [[ $calls_made -ge $MAX_CALLS_PER_HOUR ]]; then
        return 1
    else
        return 0
    fi
}

increment_call_counter() {
    local calls_made=0
    if [[ -f "$CALL_COUNT_FILE" ]]; then
        calls_made=$(cat "$CALL_COUNT_FILE")
    fi
    ((calls_made++))
    echo "$calls_made" > "$CALL_COUNT_FILE"
    echo "$calls_made"
}

wait_for_reset() {
    local calls_made=$(cat "$CALL_COUNT_FILE" 2>/dev/null || echo "0")
    log "WARN" "Rate limit reached ($calls_made/$MAX_CALLS_PER_HOUR). Waiting for reset..."

    # Calculate time until next hour
    local current_minute=$(date +%M)
    local current_second=$(date +%S)
    local wait_time=$(((60 - current_minute - 1) * 60 + (60 - current_second)))

    log "INFO" "Sleeping for $wait_time seconds until next hour..."

    # Countdown display
    while [[ $wait_time -gt 0 ]]; do
        local hours=$((wait_time / 3600))
        local minutes=$(((wait_time % 3600) / 60))
        local seconds=$((wait_time % 60))
        printf "\r${YELLOW}Time until reset: %02d:%02d:%02d${NC}" $hours $minutes $seconds
        sleep 1
        ((wait_time--))
    done
    printf "\n"

    # Reset counter
    echo "0" > "$CALL_COUNT_FILE"
    echo "$(date +%Y%m%d%H)" > "$TIMESTAMP_FILE"
    log "SUCCESS" "Rate limit reset! Ready for new calls."
}

#-------------------------------------------------------------------------------
# Status Tracking
#-------------------------------------------------------------------------------

update_status() {
    local loop_count=$1
    local calls_made=$2
    local status=$3
    local last_action=${4:-""}

    cat > "$STATUS_FILE" << STATUSEOF
{
    "timestamp": "$(date -Iseconds)",
    "loop_count": $loop_count,
    "max_iterations": $MAX_ITERATIONS,
    "calls_made_this_hour": $calls_made,
    "max_calls_per_hour": $MAX_CALLS_PER_HOUR,
    "status": "$status",
    "last_action": "$last_action",
    "project": "Truck Command",
    "prompt_file": "$PROMPT_FILE"
}
STATUSEOF
}

#-------------------------------------------------------------------------------
# Completion Detection
#-------------------------------------------------------------------------------

check_completion() {
    local response="$1"

    # Check for completion promise
    if echo "$response" | grep -q "$COMPLETION_PROMISE"; then
        log "SUCCESS" "Completion promise detected!"
        return 0
    fi

    # Check for common completion indicators
    local completion_phrases=(
        "all stories complete"
        "all tasks complete"
        "project complete"
        "nothing left to implement"
        "all acceptance criteria met"
    )

    for phrase in "${completion_phrases[@]}"; do
        if echo "$response" | grep -iq "$phrase"; then
            ((CONSECUTIVE_DONE_SIGNALS++))
            log "INFO" "Done signal detected ($CONSECUTIVE_DONE_SIGNALS/$MAX_CONSECUTIVE_DONE): $phrase"

            if [[ $CONSECUTIVE_DONE_SIGNALS -ge $MAX_CONSECUTIVE_DONE ]]; then
                log "SUCCESS" "Multiple consecutive done signals - project appears complete"
                return 0
            fi
            return 1
        fi
    done

    # Reset done signal counter if no completion indicator
    CONSECUTIVE_DONE_SIGNALS=0
    return 1
}

check_for_errors() {
    local response="$1"

    # Check for error patterns
    local error_patterns=(
        "fatal error"
        "cannot proceed"
        "stuck in loop"
        "unable to continue"
        "blocked by"
    )

    for pattern in "${error_patterns[@]}"; do
        if echo "$response" | grep -iq "$pattern"; then
            ((CONSECUTIVE_ERRORS++))
            log "WARN" "Error pattern detected ($CONSECUTIVE_ERRORS/$MAX_CONSECUTIVE_ERRORS): $pattern"

            if [[ $CONSECUTIVE_ERRORS -ge $MAX_CONSECUTIVE_ERRORS ]]; then
                log "ERROR" "Too many consecutive errors - stopping loop"
                return 0
            fi
            return 1
        fi
    done

    # Reset error counter if no errors
    CONSECUTIVE_ERRORS=0
    return 1
}

#-------------------------------------------------------------------------------
# Main Loop
#-------------------------------------------------------------------------------

run_iteration() {
    local iteration=$1
    local calls_made=$(cat "$CALL_COUNT_FILE" 2>/dev/null || echo "0")

    log "LOOP" "========== ITERATION $iteration of $MAX_ITERATIONS =========="
    log "INFO" "API calls this hour: $calls_made/$MAX_CALLS_PER_HOUR"

    update_status "$iteration" "$calls_made" "running" "Starting iteration"

    # Check rate limit
    if ! can_make_call; then
        wait_for_reset
    fi

    # Build the prompt with context
    local full_prompt=$(build_prompt "$iteration")

    # Run Claude Code
    log "INFO" "Executing Claude Code..."
    local start_time=$(date +%s)

    local response
    local exit_code=0

    # Execute Claude with timeout
    # Using --dangerously-skip-permissions for autonomous operation
    # CAUTION: Only use this in controlled environments
    response=$(timeout ${CLAUDE_TIMEOUT_MINUTES}m $CLAUDE_CMD -p "$full_prompt" --dangerously-skip-permissions 2>&1) || exit_code=$?

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # Increment call counter
    calls_made=$(increment_call_counter)

    log "INFO" "Iteration completed in ${duration}s"
    log_verbose "Response length: ${#response} characters"

    # Save response to log
    echo "" >> "$LOG_FILE"
    echo "--- Iteration $iteration Response ---" >> "$LOG_FILE"
    echo "$response" >> "$LOG_FILE"
    echo "--- End Response ---" >> "$LOG_FILE"

    # Check for timeout
    if [[ $exit_code -eq 124 ]]; then
        log "WARN" "Iteration timed out after ${CLAUDE_TIMEOUT_MINUTES} minutes"
        update_status "$iteration" "$calls_made" "timeout" "Iteration timed out"
        return 1
    fi

    # Check for completion
    if check_completion "$response"; then
        update_status "$iteration" "$calls_made" "complete" "Project completed"
        return 0
    fi

    # Check for errors
    if check_for_errors "$response"; then
        update_status "$iteration" "$calls_made" "error" "Too many errors"
        return 2
    fi

    # Update progress file with iteration summary
    echo "" >> "$PROGRESS_FILE"
    echo "### [Iteration $iteration] - $(date '+%Y-%m-%d %H:%M:%S')" >> "$PROGRESS_FILE"
    echo "Duration: ${duration}s" >> "$PROGRESS_FILE"

    update_status "$iteration" "$calls_made" "running" "Iteration $iteration completed"
    return 1
}

build_prompt() {
    local iteration=$1

    # Read the main prompt
    local prompt=$(cat "$PROMPT_FILE")

    # Add iteration context
    local context="
## Current Session Context
- **Iteration**: $iteration of $MAX_ITERATIONS
- **Timestamp**: $(date '+%Y-%m-%d %H:%M:%S')
- **Working Directory**: $PROJECT_ROOT

## Instructions
1. Read prd.json for current task status
2. Select the highest priority incomplete story
3. Implement the feature following acceptance criteria
4. Run linting: \`npm run lint\`
5. Test your changes
6. Commit with descriptive message: \`git add -A && git commit -m \"[Ralph] description\"\`
7. Update prd.json to mark story as complete (passes: true)
8. Add learnings to progress.txt

## Completion
When ALL stories in prd.json are complete, output exactly:
$COMPLETION_PROMISE

---

$prompt"

    echo "$context"
}

main_loop() {
    log "INFO" "Starting Ralph Wiggum autonomous loop..."
    log "INFO" "Max iterations: $MAX_ITERATIONS"
    log "INFO" "Press Ctrl+C to stop at any time"
    echo ""

    for ((i=1; i<=MAX_ITERATIONS; i++)); do
        run_iteration $i
        local result=$?

        case $result in
            0)
                # Completion detected
                log "SUCCESS" "=========================================="
                log "SUCCESS" "Ralph completed successfully!"
                log "SUCCESS" "Total iterations: $i"
                log "SUCCESS" "=========================================="
                final_report
                exit 0
                ;;
            2)
                # Error limit reached
                log "ERROR" "=========================================="
                log "ERROR" "Ralph stopped due to errors"
                log "ERROR" "Total iterations: $i"
                log "ERROR" "=========================================="
                final_report
                exit 1
                ;;
            *)
                # Continue to next iteration
                if [[ $i -lt $MAX_ITERATIONS ]]; then
                    log "INFO" "Sleeping ${SLEEP_BETWEEN_ITERATIONS}s before next iteration..."
                    sleep $SLEEP_BETWEEN_ITERATIONS
                fi
                ;;
        esac
    done

    log "WARN" "=========================================="
    log "WARN" "Max iterations reached ($MAX_ITERATIONS)"
    log "WARN" "Project may not be complete"
    log "WARN" "=========================================="
    final_report
    exit 0
}

final_report() {
    log "INFO" "Generating final report..."

    local calls_made=$(cat "$CALL_COUNT_FILE" 2>/dev/null || echo "0")

    echo ""
    echo "==============================================================================="
    echo "                        RALPH SESSION SUMMARY"
    echo "==============================================================================="
    echo "Log file: $LOG_FILE"
    echo "API calls made: $calls_made"
    echo ""
    echo "Git commits this session:"
    git log --oneline -10 --grep="\[Ralph\]" 2>/dev/null || echo "No Ralph commits found"
    echo ""
    echo "==============================================================================="
}

#-------------------------------------------------------------------------------
# Argument Parsing
#-------------------------------------------------------------------------------

while [[ $# -gt 0 ]]; do
    case $1 in
        -i|--iterations)
            MAX_ITERATIONS="$2"
            shift 2
            ;;
        -p|--prompt)
            PROMPT_FILE="$2"
            shift 2
            ;;
        -t|--timeout)
            CLAUDE_TIMEOUT_MINUTES="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -h|--help)
            show_help
            ;;
        *)
            log "ERROR" "Unknown option: $1"
            show_help
            ;;
    esac
done

#-------------------------------------------------------------------------------
# Entry Point
#-------------------------------------------------------------------------------

# Change to project root
cd "$PROJECT_ROOT"

# Banner
echo ""
echo -e "${PURPLE}===============================================================================${NC}"
echo -e "${PURPLE}    ____        __      __       _       ___                                  ${NC}"
echo -e "${PURPLE}   / __ \____ _/ /___  / /_     | |     / (_)___ _____ ___  ______ ___        ${NC}"
echo -e "${PURPLE}  / /_/ / __ \`/ / __ \/ __ \    | | /| / / / __ \`/ __ \`/ / / / __ \`__ \      ${NC}"
echo -e "${PURPLE} / _, _/ /_/ / / /_/ / / / /    | |/ |/ / / /_/ / /_/ / /_/ / / / / / /       ${NC}"
echo -e "${PURPLE}/_/ |_|\__,_/_/ .___/_/ /_/     |__/|__/_/\__, /\__, /\__,_/_/ /_/ /_/        ${NC}"
echo -e "${PURPLE}             /_/                         /____//____/                        ${NC}"
echo -e "${PURPLE}===============================================================================${NC}"
echo -e "${CYAN}       Autonomous AI Development Loop for Truck Command${NC}"
echo -e "${PURPLE}===============================================================================${NC}"
echo ""

# Initialize and run
init
main_loop
