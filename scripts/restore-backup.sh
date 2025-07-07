#!/bin/bash

# Supabase Database Restore Script
# This script helps restore database backups created by the GitHub Actions workflow

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🗄️  Supabase Database Restore Tool${NC}"
echo "=================================="
echo ""

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: No backup file specified${NC}"
    echo "Usage: ./restore-backup.sh <backup-file.tar.gz> [--roles-only|--schema-only|--data-only]"
    echo ""
    echo "Options:"
    echo "  --roles-only   : Restore only database roles"
    echo "  --schema-only  : Restore only database schema"
    echo "  --data-only    : Restore only database data"
    echo "  (default)      : Restore everything"
    exit 1
fi

BACKUP_FILE=$1
RESTORE_TYPE=${2:-"full"}

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}Warning: DATABASE_URL environment variable not set${NC}"
    echo "Please set it to your Supabase database connection string:"
    echo "export DATABASE_URL='postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres'"
    exit 1
fi

# Create temporary directory
TEMP_DIR=$(mktemp -d)
echo "Extracting backup to temporary directory..."

# Extract backup
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Find the extracted directory
BACKUP_DIR=$(find "$TEMP_DIR" -maxdepth 1 -type d | grep -v "^$TEMP_DIR$" | head -1)

if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}Error: Could not find extracted backup directory${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Display backup info if available
if [ -f "$BACKUP_DIR/backup_info.json" ]; then
    echo ""
    echo "Backup Information:"
    cat "$BACKUP_DIR/backup_info.json" | jq '.' 2>/dev/null || cat "$BACKUP_DIR/backup_info.json"
    echo ""
fi

echo -e "${YELLOW}⚠️  WARNING: This will restore data to your database!${NC}"
echo -e "${YELLOW}Make sure you have a current backup before proceeding.${NC}"
echo ""
read -p "Continue with restore? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    rm -rf "$TEMP_DIR"
    exit 0
fi

# Function to run psql command
run_psql() {
    psql "$DATABASE_URL" -f "$1" -v ON_ERROR_STOP=1
}

echo ""
echo "Starting restore process..."

# Restore based on type
case "$RESTORE_TYPE" in
    "--roles-only")
        if [ -f "$BACKUP_DIR/roles.sql" ]; then
            echo "Restoring roles..."
            run_psql "$BACKUP_DIR/roles.sql"
            echo -e "${GREEN}✅ Roles restored successfully${NC}"
        else
            echo -e "${RED}Error: roles.sql not found in backup${NC}"
            exit 1
        fi
        ;;
    
    "--schema-only")
        if [ -f "$BACKUP_DIR/schema.sql" ]; then
            echo "Restoring schema..."
            run_psql "$BACKUP_DIR/schema.sql"
            echo -e "${GREEN}✅ Schema restored successfully${NC}"
        else
            echo -e "${RED}Error: schema.sql not found in backup${NC}"
            exit 1
        fi
        ;;
    
    "--data-only")
        if [ -f "$BACKUP_DIR/data.sql" ]; then
            echo "Restoring data..."
            run_psql "$BACKUP_DIR/data.sql"
            echo -e "${GREEN}✅ Data restored successfully${NC}"
        else
            echo -e "${RED}Error: data.sql not found in backup${NC}"
            exit 1
        fi
        ;;
    
    *)
        # Full restore
        RESTORE_SUCCESS=true
        
        if [ -f "$BACKUP_DIR/roles.sql" ]; then
            echo "Restoring roles..."
            run_psql "$BACKUP_DIR/roles.sql" || RESTORE_SUCCESS=false
            if [ "$RESTORE_SUCCESS" = true ]; then
                echo -e "${GREEN}✅ Roles restored${NC}"
            fi
        fi
        
        if [ "$RESTORE_SUCCESS" = true ] && [ -f "$BACKUP_DIR/schema.sql" ]; then
            echo "Restoring schema..."
            run_psql "$BACKUP_DIR/schema.sql" || RESTORE_SUCCESS=false
            if [ "$RESTORE_SUCCESS" = true ]; then
                echo -e "${GREEN}✅ Schema restored${NC}"
            fi
        fi
        
        if [ "$RESTORE_SUCCESS" = true ] && [ -f "$BACKUP_DIR/data.sql" ]; then
            echo "Restoring data..."
            run_psql "$BACKUP_DIR/data.sql" || RESTORE_SUCCESS=false
            if [ "$RESTORE_SUCCESS" = true ]; then
                echo -e "${GREEN}✅ Data restored${NC}"
            fi
        fi
        
        if [ "$RESTORE_SUCCESS" = false ]; then
            echo -e "${RED}Error: Restore process failed${NC}"
            rm -rf "$TEMP_DIR"
            exit 1
        fi
        ;;
esac

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo -e "${GREEN}🎉 Database restore completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Verify your application is working correctly"
echo "2. Check that all data has been restored properly"
echo "3. Consider running any necessary migrations"