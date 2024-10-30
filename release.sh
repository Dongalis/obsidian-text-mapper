#!/bin/bash

# Exit on error
set -e

# Check if version number is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <version-number> [minimum-obsidian-version]"
    echo "Example: $0 1.0.1"
    echo "Or: $0 1.0.1 1.1.0"
    exit 1
fi

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "gh (GitHub CLI) could not be found, please install it."
    exit 1
fi

VERSION=$1

# Get current minAppVersion from manifest.json if not provided
if [ -z "$2" ]; then
    MIN_OBSIDIAN_VERSION=$(grep -o '"minAppVersion": *"[^"]*"' manifest.json | cut -d'"' -f4)
    echo "Using existing minimum Obsidian version: $MIN_OBSIDIAN_VERSION"
else
    MIN_OBSIDIAN_VERSION=$2
    echo "Setting new minimum Obsidian version: $MIN_OBSIDIAN_VERSION"
fi

CHANGELOG="CHANGELOG.md"

# Ensure we're on main branch
git checkout main
git pull origin main

# 1. Update manifest.json with new version number and minimum Obsidian version
echo "Updating manifest.json..."
sed -i '' \
    -e "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" \
    -e "s/\"minAppVersion\": \".*\"/\"minAppVersion\": \"$MIN_OBSIDIAN_VERSION\"/" \
    manifest.json

# 2. Update versions.json
echo "Updating versions.json..."
if [ ! -f "versions.json" ]; then
    echo "{}" > versions.json
fi
# Create a temporary file with updated versions
jq --arg ver "$VERSION" --arg min "$MIN_OBSIDIAN_VERSION" '. + {($ver): $min}' versions.json > versions.json.tmp
mv versions.json.tmp versions.json

# Commit manifest and versions changes first
git add manifest.json versions.json
git commit -m "Update versions to $VERSION"
git push origin main

# Build the plugin
echo "Installing dependencies and building..."
npm install
npm run build

# Check if build files exist
if [ ! -f "main.js" ]; then
    echo "Error: main.js not found after build"
    exit 1
fi

if [ ! -f "styles.css" ]; then
    echo "Error: styles.css not found"
    exit 1
fi

# Gather release notes
echo "Enter release notes (press Ctrl+D when done):"
echo "## Changes in $VERSION" > release_notes.md
echo "" >> release_notes.md
echo "### New Features" >> release_notes.md
cat >> release_notes.md
echo "" >> release_notes.md
echo "### Notes" >> release_notes.md
echo "- Minimum Obsidian version: $MIN_OBSIDIAN_VERSION" >> release_notes.md
echo "- Please report any issues on the GitHub repository" >> release_notes.md

# Update CHANGELOG.md
if [ ! -f $CHANGELOG ]; then
    echo "# Changelog" > $CHANGELOG
    echo "" >> $CHANGELOG
fi

# Add new release notes at the top of the changelog
echo "$(cat release_notes.md)" $'\n'"$(cat $CHANGELOG)" > $CHANGELOG

# Commit changelog
git add $CHANGELOG
git commit -m "Update changelog for $VERSION"
git push origin main

# Create GitHub release
echo "Creating GitHub release..."
gh release create "$VERSION" \
    --title "Text Mapper $VERSION" \
    --notes-file release_notes.md \
    main.js \
    manifest.json \
    styles.css

# Cleanup
rm release_notes.md

echo "Release $VERSION completed!"
echo "Don't forget to verify the release on GitHub: https://github.com/modality/obsidian-text-mapper/releases"
