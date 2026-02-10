# # Extracted from INSTALLATION.md (fence #12, lang='bash')
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
