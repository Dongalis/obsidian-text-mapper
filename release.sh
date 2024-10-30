#!/bin/bash

# Exit on error
set -e

# Check if version number is provided
if [ -z "$1" ]; then
    echo "Please provide a version number (e.g. 1.2.3)"
    exit 1
fi

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "gh (GitHub CLI) could not be found, please install it."
    exit 1
fi

VERSION=$1
RELEASE_NAME="text-mapper-$VERSION"
RELEASE_ZIP="$RELEASE_NAME.zip"
CHANGELOG="CHANGELOG.md"

# Ensure we're on main branch
git checkout main
git pull origin main

# Update version number in manifest.json and commit it first
echo "Updating version in manifest.json to $VERSION..."
sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" manifest.json

# Commit and push version change first
git add manifest.json
git commit -m "Update version to $VERSION"
git push origin main

# Now do the build
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

if [ ! -f "manifest.json" ]; then
    echo "Error: manifest.json not found"
    exit 1
fi

# Create release files directory if it doesn't exist
mkdir -p releases

# Copy required files to release directory
echo "Copying release files..."
cp main.js manifest.json styles.css releases/

# Verify files were copied
if [ ! -f "releases/main.js" ] || [ ! -f "releases/styles.css" ] || [ ! -f "releases/manifest.json" ]; then
    echo "Error: Failed to copy some files to releases directory"
    exit 1
fi

# Create ZIP file for release
cd releases
zip $RELEASE_ZIP main.js manifest.json styles.css
cd ..

# Verify zip file was created
if [ ! -f "releases/$RELEASE_ZIP" ]; then
    echo "Error: Failed to create release zip file"
    exit 1
fi

# Gather release notes through prompts
echo "Enter release notes (press Ctrl+D when done):"
echo "## Changes in $VERSION" > release_notes.md
echo "" >> release_notes.md
echo "### New Features" >> release_notes.md
cat >> release_notes.md
echo "" >> release_notes.md
echo "### Notes" >> release_notes.md
echo "- Please report any issues on the GitHub repository" >> release_notes.md

# Update CHANGELOG.md
if [ ! -f $CHANGELOG ]; then
    echo "# Changelog" > $CHANGELOG
    echo "" >> $CHANGELOG
fi

# Add new release notes at the top of the changelog
echo "$(cat release_notes.md)" $'\n'"$(cat $CHANGELOG)" > $CHANGELOG

# Commit release files and changelog
git add releases/$RELEASE_ZIP $CHANGELOG
git commit -m "Release version $VERSION"

# Create and push tag
git tag -a $VERSION -m "Release version $VERSION"
git push origin main --tags

# Create GitHub release using gh cli
echo "Creating GitHub release..."
gh release create "$VERSION" \
    --title "Text Mapper v$VERSION" \
    --notes-file release_notes.md \
    "releases/$RELEASE_ZIP"

# Cleanup
rm release_notes.md

echo "Release $VERSION completed!"
echo "Release has been created on GitHub with the specified assets."
echo "Changelog has been updated in $CHANGELOG"
