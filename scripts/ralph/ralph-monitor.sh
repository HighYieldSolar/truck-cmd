#!/bin/bash
#===============================================================================
# Ralph Monitor - Live Dashboard for Ralph Wiggum Loop
#===============================================================================
# Displays real-time status of the Ralph autonomous development loop.
# Run this in a separate terminal alongside ralph.sh
#
# Usage: ./ralph-monitor.sh
#===============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATUS_FILE="$SCRIPT_DIR/status.json"
LOG_DIR="$SCRIPT_DIR/logs"
PROGRESS_FILE="$SCRIPT_DIR/progress.txt"
PRD_FILE="$SCRIPT_DIR/prd.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

clear_screen() {
    clear
    echo -e "${PURPLE}${BOLD}"
    echo "==============================================================================="
    echo "                    RALPH WIGGUM - LIVE MONITOR"
    echo "                      Truck Command Development"
    echo "==============================================================================="
    echo -e "${NC}"
}

get_status() {
    if [[ -f "$STATUS_FILE" ]]; then
        cat "$STATUS_FILE"
    else
        echo '{"status": "not running", "loop_count": 0}'
    fi
}

get_latest_log() {
    local latest_log=$(ls -t "$LOG_DIR"/ralph-*.log 2>/dev/null | head -1)
    if [[ -n "$latest_log" ]]; then
        echo "$latest_log"
    fi
}

count_stories() {
    if [[ -f "$PRD_FILE" ]] && command -v jq &> /dev/null; then
        local total=$(jq '.stories | length' "$PRD_FILE" 2>/dev/null || echo "0")
        local completed=$(jq '[.stories[] | select(.passes == true)] | length' "$PRD_FILE" 2>/dev/null || echo "0")
        echo "$completed/$total"
    else
        echo "N/A"
    fi
}

display_status() {
    local status_json=$(get_status)

    if command -v jq &> /dev/null; then
        local status=$(echo "$status_json" | jq -r '.status // "unknown"')
        local loop=$(echo "$status_json" | jq -r '.loop_count // 0')
        local max_iter=$(echo "$status_json" | jq -r '.max_iterations // 20')
        local calls=$(echo "$status_json" | jq -r '.calls_made_this_hour // 0')
        local max_calls=$(echo "$status_json" | jq -r '.max_calls_per_hour // 50')
        local last_action=$(echo "$status_json" | jq -r '.last_action // "N/A"')
        local timestamp=$(echo "$status_json" | jq -r '.timestamp // "N/A"')
    else
        local status="Check jq installation"
        local loop="?"
        local max_iter="?"
        local calls="?"
        local max_calls="?"
        local last_action="N/A"
        local timestamp="N/A"
    fi

    local stories=$(count_stories)

    # Status color
    local status_color=$YELLOW
    case $status in
        "running") status_color=$GREEN ;;
        "complete") status_color=$CYAN ;;
        "error") status_color=$RED ;;
        "not running") status_color=$YELLOW ;;
    esac

    echo -e "${BOLD}Current Status:${NC}"
    echo "----------------------------------------"
    echo -e "  Status:      ${status_color}${status}${NC}"
    echo -e "  Iteration:   ${BLUE}${loop}/${max_iter}${NC}"
    echo -e "  API Calls:   ${BLUE}${calls}/${max_calls}${NC} this hour"
    echo -e "  Stories:     ${BLUE}${stories}${NC} complete"
    echo -e "  Last Action: ${last_action}"
    echo -e "  Updated:     ${timestamp}"
    echo ""
}

display_recent_logs() {
    local log_file=$(get_latest_log)

    echo -e "${BOLD}Recent Activity:${NC}"
    echo "----------------------------------------"

    if [[ -n "$log_file" && -f "$log_file" ]]; then
        tail -15 "$log_file" | while read line; do
            if echo "$line" | grep -q "\[ERROR\]"; then
                echo -e "${RED}$line${NC}"
            elif echo "$line" | grep -q "\[SUCCESS\]"; then
                echo -e "${GREEN}$line${NC}"
            elif echo "$line" | grep -q "\[WARN\]"; then
                echo -e "${YELLOW}$line${NC}"
            elif echo "$line" | grep -q "\[LOOP\]"; then
                echo -e "${PURPLE}$line${NC}"
            else
                echo "$line"
            fi
        done
    else
        echo "  No logs available yet"
    fi
    echo ""
}

display_git_status() {
    echo -e "${BOLD}Recent Git Commits:${NC}"
    echo "----------------------------------------"
    cd "$SCRIPT_DIR/../.."
    git log --oneline -5 2>/dev/null || echo "  No commits yet"
    echo ""
}

display_stories() {
    echo -e "${BOLD}Story Status:${NC}"
    echo "----------------------------------------"

    if [[ -f "$PRD_FILE" ]] && command -v jq &> /dev/null; then
        jq -r '.stories[] | "  [\(if .passes then "X" else " " end)] \(.id): \(.title)"' "$PRD_FILE" 2>/dev/null || echo "  Unable to parse PRD"
    else
        echo "  Install jq for story tracking"
    fi
    echo ""
}

display_help() {
    echo -e "${BOLD}Controls:${NC}"
    echo "----------------------------------------"
    echo "  q     - Quit monitor"
    echo "  r     - Refresh now"
    echo "  l     - Show full log"
    echo "  s     - Show all stories"
    echo ""
    echo -e "${YELLOW}Auto-refreshes every 5 seconds${NC}"
}

main() {
    while true; do
        clear_screen
        display_status
        display_recent_logs
        display_git_status
        display_help

        # Wait for input or timeout
        read -t 5 -n 1 key 2>/dev/null || true

        case $key in
            q|Q)
                echo -e "\n${GREEN}Monitor stopped.${NC}"
                exit 0
                ;;
            r|R)
                continue
                ;;
            l|L)
                local log_file=$(get_latest_log)
                if [[ -n "$log_file" ]]; then
                    less "$log_file"
                fi
                ;;
            s|S)
                clear_screen
                display_stories
                echo "Press any key to continue..."
                read -n 1
                ;;
        esac
    done
}

main
