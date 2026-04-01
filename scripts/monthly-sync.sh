#!/bin/bash
# Monthly GitHub sync for BBQ Compare App
# Commits any pending local changes and pushes to GitHub.
# Runs automatically via cron on the 1st of each month.

PROJECT_DIR="/Users/brichardson/Documents/BBQ Compare App"
LOG_DIR="$PROJECT_DIR/logs"
LOG_FILE="$LOG_DIR/monthly-sync.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
MONTH_LABEL=$(date '+%B %Y')

mkdir -p "$LOG_DIR"

echo "" >> "$LOG_FILE"
echo "=== Monthly Sync: $TIMESTAMP ===" >> "$LOG_FILE"

cd "$PROJECT_DIR" || {
  echo "ERROR: Could not navigate to project directory." >> "$LOG_FILE"
  exit 1
}

# Confirm we're on the right branch
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
echo "Branch: $BRANCH" >> "$LOG_FILE"

if [ "$BRANCH" != "main" ]; then
  echo "WARNING: Not on main branch — skipping sync to avoid committing to wrong branch." >> "$LOG_FILE"
  exit 1
fi

# Check for any uncommitted changes (tracked or untracked)
STATUS=$(git status --porcelain 2>/dev/null)

if [ -z "$STATUS" ]; then
  echo "No local changes — nothing to commit." >> "$LOG_FILE"
else
  echo "Changes detected — staging all files..." >> "$LOG_FILE"
  echo "$STATUS" >> "$LOG_FILE"

  git add -A >> "$LOG_FILE" 2>&1
  git commit -m "Monthly sync: $MONTH_LABEL" >> "$LOG_FILE" 2>&1
  echo "Committed. Pushing to origin/$BRANCH..." >> "$LOG_FILE"
fi

# Always push to ensure any previously committed but unpushed work goes up
git push origin "$BRANCH" >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
  echo "Push successful." >> "$LOG_FILE"
else
  echo "ERROR: Push failed. Check your network or GitHub credentials." >> "$LOG_FILE"
fi
