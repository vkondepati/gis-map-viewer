// # Extracted from DATA_WAREHOUSES.md (fence #20, lang='javascript')
// List saved connections
connectorManager.listConnections();

// Remove connection
connectorManager.removeConnection("profile_name");

// Test connection
connector
  .testConnection()
  .then(() => console.log("Connected!"))
  .catch((err) => console.error("Failed:", err));
