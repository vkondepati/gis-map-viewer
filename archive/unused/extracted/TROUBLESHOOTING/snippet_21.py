# # Extracted from TROUBLESHOOTING.md (fence #21, lang='python')
     # In Python
     from iceberg.catalog import load_catalog
     catalog = load_catalog(...)
     tables = catalog.list_namespaces()
