# # Extracted from DATA_WAREHOUSES.md (fence #1, lang='python')
from gis_viewer.connectors import DuckDBConnector

# File-based
duckdb = DuckDBConnector(database="~/spatial_data.db")

# In-memory
duckdb = DuckDBConnector(memory=True)
