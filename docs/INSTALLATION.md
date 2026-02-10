# Installation Guide

Complete instructions for installing Desktop GIS Map Viewer on your system.

## Table of Contents

- [System Requirements](#system-requirements)
- [Release Package Installation](#release-package-installation)
- [Building from Source](#building-from-source)
- [Docker Installation](#docker-installation)
- [Troubleshooting](#troubleshooting)

## System Requirements

### Minimum Requirements

- **Operating System**:
  - Windows 10 or later
  - macOS 10.14 or later
  - Linux (Ubuntu 18.04+, Fedora 28+, Debian 10+)
- **Processor**: Dual-core 2.0 GHz or higher
- **Memory**: 4 GB RAM minimum
- **Storage**: 500 MB free disk space
- **Display**: 1280 × 720 minimum resolution
- **Internet**: Optional (required for web services and data warehouses)

### Recommended Requirements

- **Operating System**:
  - Windows 11
  - macOS 12 or later
  - Ubuntu 20.04 LTS or later
- **Processor**: Quad-core 2.5 GHz or higher
- **Memory**: 16 GB RAM
- **Storage**: SSD with 2+ GB available space
- **GPU**: Dedicated graphics card for large datasets
- **Display**: 1920 × 1080 or higher

### Network Requirements

- **Optional**: Internet connection for web services
- **Optional**: Cloud service credentials (Snowflake, Databricks, etc.)
- **Supported**: HTTPS connections

## Release Package Installation

### Windows Installation

#### Using Installer

1. **Download** `gis-map-viewer-setup.exe` from [releases page](https://github.com/yourusername/gis-map-viewer/releases)
2. **Run** the installer by double-clicking it
3. **Accept** the license agreement
4. **Choose** installation directory (default: `C:\Program Files\GIS Map Viewer`)
5. **Select** additional components:
   - [x] Create Start Menu shortcuts
   - [x] Create Desktop shortcut
   - [x] Add to PATH (optional)
6. **Click** "Install"
7. **Finish** - application is ready to launch

#### Running from Command Line

```powershell
# Launch application
"C:\Program Files\GIS Map Viewer\gis-map-viewer.exe"

# Or if added to PATH
gis-map-viewer
```

#### Uninstalling

1. **Settings** → **Apps** → **Apps & features**
2. Find **GIS Map Viewer**
3. Click → **Uninstall**
4. Follow uninstallation wizard

### macOS Installation

#### Using DMG Installer

1. **Download** `gis-map-viewer.dmg` from releases page
2. **Open** the DMG file (double-click)
3. **Drag** GIS Map Viewer icon to Applications folder
4. **Wait** for copy process to complete
5. **Eject** the DMG
6. **Launch** from Applications folder

#### Command Line Installation

```bash
# Mount DMG
hdiutil mount gis-map-viewer.dmg

# Copy to Applications
cp -r /Volumes/GIS\ Map\ Viewer/GIS\ Map\ Viewer.app /Applications/

# Unmount
hdiutil unmount /Volumes/GIS\ Map\ Viewer
```

#### Running from Terminal

```bash
# Launch application
/Applications/GIS\ Map\ Viewer.app/Contents/MacOS/GIS\ Map\ Viewer

# Or create alias
alias gis-map-viewer="/Applications/GIS\ Map\ Viewer.app/Contents/MacOS/GIS\ Map\ Viewer"
gis-map-viewer
```

#### Uninstalling

1. Open **Finder**
2. Go to **Applications**
3. Find **GIS Map Viewer**
4. **Right-click** → **Move to Trash**
5. Empty trash

### Linux Installation

#### AppImage (Recommended)

```bash
# Download
wget https://github.com/yourusername/gis-map-viewer/releases/download/v1.0.0/gis-map-viewer.AppImage

# Make executable
chmod +x gis-map-viewer.AppImage

# Run
./gis-map-viewer.AppImage

# Optional: Install to system
sudo mv gis-map-viewer.AppImage /usr/local/bin/gis-map-viewer
sudo chmod +x /usr/local/bin/gis-map-viewer

# Launch from anywhere
gis-map-viewer
```

#### Debian/Ubuntu Package

```bash
# Download
wget https://github.com/yourusername/gis-map-viewer/releases/download/v1.0.0/gis-map-viewer.deb

# Install
sudo dpkg -i gis-map-viewer.deb

# Resolve dependencies
sudo apt-get install -f

# Launch
gis-map-viewer
```

#### Fedora/RHEL Package

```bash
# Download
wget https://github.com/yourusername/gis-map-viewer/releases/download/v1.0.0/gis-map-viewer.rpm

# Install
sudo dnf install gis-map-viewer.rpm

# Launch
gis-map-viewer
```

#### Uninstalling

```bash
# For AppImage
rm ~/gis-map-viewer.AppImage

# For Debian/Ubuntu
sudo apt-get remove gis-map-viewer

# For Fedora/RHEL
sudo dnf remove gis-map-viewer
```

## Building from Source

### Prerequisites

#### For JavaScript/Electron Build

```bash
# Node.js 16+ and npm 8+
node --version    # v16.0.0 or higher
npm --version     # v8.0.0 or higher

# Git
git --version     # 2.20 or higher
```

#### For Python Build

```bash
# Python 3.8+
python --version  # 3.8.0 or higher

# Git
git --version
```

### Clone Repository

```bash
git clone https://github.com/yourusername/gis-map-viewer.git
cd gis-map-viewer
```

### JavaScript/Electron Build

```bash
# Install dependencies
npm install

# Run development server (with hot reload)
npm run dev

# Build application
npm run build

# Create distribution packages (all platforms)
npm run dist

# Create Windows installer only
npm run dist:win

# Create macOS installer only
npm run dist:mac

# Create Linux package only
npm run dist:linux
```

Built installers are in `dist/` directory.

### Python Build

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate          # macOS/Linux
# or
venv\Scripts\activate              # Windows

# Install dependencies
pip install -r requirements.txt

# Install development dependencies
pip install -e ".[dev]"

# Run application
python -m gis_viewer

# Build executable
pyinstaller gis_viewer.spec

# Create Python wheel
python setup.py bdist_wheel
```

Built executable is in `dist/gis_viewer/` directory.

## Docker Installation

### Using Docker Container

```bash
# Build Docker image
docker build -t gis-map-viewer .

# Run container with X11 forwarding (Linux)
docker run -it \
  -e DISPLAY=$DISPLAY \
  -v /tmp/.X11-unix:/tmp/.X11-unix \
  -v $HOME/maps:/data \
  gis-map-viewer

# Run container (macOS)
docker run -it \
  -e DISPLAY=host.docker.internal:0 \
  -v /tmp/.X11-unix:/tmp/.X11-unix \
  -v $HOME/maps:/data \
  gis-map-viewer
```

### Docker Compose

```yaml
# docker-compose.yml
version: "3.8"
services:
  gis-viewer:
    build: .
    environment:
      - DISPLAY=host.docker.internal:0
    volumes:
      - ~/maps:/data
    ports:
      - "5000:5000" # If using web interface
```

Run with:

```bash
docker-compose up
```

## Post-Installation

### First Run

1. **Launch** the application
2. **Welcome screen** appears
3. **Create new project** or **Open recent project**
4. **Configure** basic settings in Preferences
5. **Start loading** data

### Initial Configuration

1. **Edit** → **Preferences**
2. Configure:
   - **Display**: Theme, zoom level, labels
   - **Performance**: Feature limits, caching
   - **Data**: Default formats, CRS, precision
3. **Click Apply**

### Verify Installation

1. **File** → **Open Data Layer**
2. Navigate to example data
3. **Load sample GeoJSON file**
4. Verify map displays correctly
5. Test zoom, pan, and identify tools

## Updating

### Check Current Version

```bash
# Windows
gis-map-viewer --version

# macOS/Linux
gis-map-viewer --version
```

### Update Application

#### Windows

1. Download latest installer
2. Run installer
3. Select "Update existing installation"
4. Follow prompts

#### macOS

1. Download latest DMG
2. Drag to Applications (overwrites old version)
3. Empty Trash

#### Linux

```bash
# AppImage
wget https://github.com/yourusername/gis-map-viewer/releases/download/v1.1.0/gis-map-viewer.AppImage
chmod +x gis-map-viewer.AppImage
./gis-map-viewer.AppImage

# Debian/Ubuntu
sudo apt-get update
sudo apt-get install --only-upgrade gis-map-viewer
```

## Troubleshooting

### Installation Issues

#### "Installation failed with error code..."

- Ensure you have administrator rights
- Check available disk space
- Try running installer as administrator
- Disable antivirus temporarily
- Download installer again (file may be corrupted)

#### "Cannot find application after installation"

- Windows: Check Start Menu for GIS Map Viewer
- macOS: Check Applications folder
- Linux: Type `gis-map-viewer` in terminal

#### "Missing dependencies error"

- Linux: Run `sudo apt-get install -f` (Ubuntu)
- Windows: Install Visual C++ Redistributable
- macOS: Install Xcode Command Line Tools: `xcode-select --install`

### Launch Issues

#### Application won't start

1. Check system requirements
2. Update graphics drivers
3. Disable hardware acceleration: Set `HARDWARE_ACCELERATION=false` environment variable
4. Run with debug logging: `DEBUG=* gis-map-viewer`

#### "Cannot connect to display" (Linux)

- Ensure X11 is running
- Check DISPLAY variable: `echo $DISPLAY`
- Use Xvfb for headless systems

#### Very slow startup

- Check available RAM
- Disable startup plugins in preferences
- Check disk space
- Look for disk errors in logs

### Feature Issues

#### Data won't load

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for data loading issues

#### Spatial operations fail

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for spatial analysis issues

## Getting Help

- **Documentation**: See [docs/](docs/) directory
- **Issues**: [GitHub Issues](https://github.com/yourusername/gis-map-viewer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/gis-map-viewer/discussions)
- **Email**: support@example.com

---

See also: [USAGE.md](USAGE.md) for getting started with the application.
