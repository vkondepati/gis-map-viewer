# # Extracted from INSTALLATION.md (fence #2, lang='bash')
# Mount DMG
hdiutil mount gis-map-viewer.dmg

# Copy to Applications
cp -r /Volumes/GIS\ Map\ Viewer/GIS\ Map\ Viewer.app /Applications/

# Unmount
hdiutil unmount /Volumes/GIS\ Map\ Viewer
