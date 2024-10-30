#!/bin/bash

# Exit on error
set -e

# Check if version number is provided
if [ -z "$1" ]; then
    echo "Please provide a version number (e.g. 1.2.3)"
    exit 1
fi

VERSION=$1

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
zip text-mapper-$VERSION.zip main.js manifest.json styles.css
cd ..

# Commit changes
git add manifest.json releases/text-mapper-$VERSION.zip
git commit -m "Release version $VERSION"

# Create and push tag
git tag -a $VERSION -m "Release version $VERSION"
git push origin main --tags

echo "Release $VERSION prepared and pushed!"
echo "Now go to GitHub and:"
echo "1. Create a new release using tag $VERSION"
echo "2. Upload releases/text-mapper-$VERSION.zip"
echo "3. Add release notes describing the changes"
