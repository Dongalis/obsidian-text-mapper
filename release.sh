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

# Install dependencies and build
npm install
npm run build

# Update version number in manifest.json
sed -i '' "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" manifest.json

# Create release files directory if it doesn't exist
mkdir -p releases

# Copy required files to release directory
cp main.js manifest.json styles.css releases/

# Create ZIP file for release
cd releases
zip $RELEASE_ZIP main.js manifest.json styles.css
cd ..

# Generate release notes template
cat > release_notes.md << EOL
## Changes in $VERSION

### New Features
-

### Improvements
-

### Bug Fixes
-

### Notes
- Please report any issues on the GitHub repository
EOL

# Open release notes in default editor for editing
if [[ -n $EDITOR ]]; then
    $EDITOR release_notes.md
elif [[ -n $(command -v nano) ]]; then
    nano release_notes.md
elif [[ -n $(command -v vim) ]]; then
    vim release_notes.md
else
    echo "No suitable editor found. Please edit release_notes.md manually."
    read -p "Press enter when done editing release notes..."
fi

# Update CHANGELOG.md
if [ ! -f $CHANGELOG ]; then
    echo "# Changelog" > $CHANGELOG
    echo "" >> $CHANGELOG
fi

# Add new release notes at the top of the changelog
echo "$(cat release_notes.md)" $'\n'"$(cat $CHANGELOG)" > $CHANGELOG

# Commit changes
git add manifest.json releases/$RELEASE_ZIP $CHANGELOG
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
