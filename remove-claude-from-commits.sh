#!/bin/bash
# Script to remove Claude Code co-author tags from git commit messages
# WARNING: This rewrites git history!

set -e

echo "======================================"
echo "REMOVE CLAUDE FROM GIT COMMITS"
echo "======================================"
echo ""
echo "WARNING: This will rewrite git history!"
echo "This script will:"
echo "  1. Remove '🤖 Generated with [Claude Code]...' lines"
echo "  2. Remove 'Co-Authored-By: Claude <noreply@anthropic.com>' lines"
echo "  3. Rewrite all commits in the repository"
echo ""
echo "Before proceeding:"
echo "  - Make sure you have a backup"
echo "  - This will require force push to remote"
echo "  - All collaborators will need to re-clone"
echo ""
read -p "Do you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Creating backup of current branch..."
CURRENT_BRANCH=$(git branch --show-current)
git branch backup-before-claude-removal-$(date +%Y%m%d-%H%M%S)

echo ""
echo "Rewriting commit messages..."

# Use git filter-branch to rewrite commit messages
git filter-branch --msg-filter '
    sed -e "/🤖 Generated with \[Claude Code\]/d" \
        -e "/Co-Authored-By: Claude <noreply@anthropic.com>/d" \
        -e "/^$/N;/^\n$/D"
' --tag-name-filter cat -- --all

echo ""
echo "Cleaning up..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "======================================"
echo "✅ COMPLETED"
echo "======================================"
echo ""
echo "Next steps:"
echo "  1. Review the changes: git log -10"
echo "  2. Force push to remote: git push --force --all"
echo "  3. Force push tags: git push --force --tags"
echo ""
echo "If something went wrong, restore from backup:"
echo "  git checkout backup-before-claude-removal-*"
echo ""
