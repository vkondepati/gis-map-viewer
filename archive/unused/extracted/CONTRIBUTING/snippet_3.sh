# # Extracted from CONTRIBUTING.md (fence #3, lang='bash')
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install development dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Check code style
flake8 .

# Format code
black .
