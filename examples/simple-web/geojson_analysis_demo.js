/**
 * NexaMap Open Source GIS Platform
 * Issue #43: Beginner-friendly Backend GIS Sample Workflow
 * * This script demonstrates how to read a GeoJSON object, validate its structure,
 * and extract basic spatial metadata (Feature Count, Geometry Types, and Bounding Box).
 */

// 1. Sample GeoJSON Data (A Point in Islamabad and a Polygon area)
const sampleGeoJSON = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": { "name": "Faisal Mosque", "category": "Landmark" },
            "geometry": { "type": "Point", "coordinates": [73.0372, 33.7297] }
        },
        {
            "type": "Feature",
            "properties": { "name": "Sample Park Area", "category": "Parks" },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [73.0400, 33.7200],
                    [73.0500, 33.7200],
                    [73.0500, 33.7300],
                    [73.0400, 33.7300],
                    [73.0400, 33.7200]
                ]]
            }
        }
    ]
};

// 2. The GIS Analysis Workflow Function
function analyzeGeoJSON(data) {
    console.log("🌍 Starting Geospatial Data Analysis Workflow...\n");

    if (!data || data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
        console.error("❌ Invalid GeoJSON: Must be a FeatureCollection.");
        return;
    }

    const totalFeatures = data.features.length;
    const geometryTypes = new Set();
    
    // Variables to calculate the Bounding Box (BBOX) [minLng, minLat, maxLng, maxLat]
    let minLng = Infinity, minLat = Infinity;
    let maxLng = -Infinity, maxLat = -Infinity;

    data.features.forEach((feature) => {
        // Track unique geometry types
        if (feature.geometry && feature.geometry.type) {
            geometryTypes.add(feature.geometry.type);
        }

        // Helper function to evaluate coordinate arrays for the bounding box
        const processCoords = (coords) => {
            if (typeof coords[0] === 'number') {
                const [lng, lat] = coords;
                if (lng < minLng) minLng = lng;
                if (lat < minLat) minLat = lat;
                if (lng > maxLng) maxLng = lng;
                if (lat > maxLat) maxLat = lat;
            } else {
                coords.forEach(processCoords);
            }
        };

        if (feature.geometry && feature.geometry.coordinates) {
            processCoords(feature.geometry.coordinates);
        }
    });

    // 3. Display the Results
    console.log("📊 Spatial Metadata Summary:");
    console.log(`🔹 Total Features Found: ${totalFeatures}`);
    console.log(`🔹 Geometry Types Present: ${Array.from(geometryTypes).join(', ')}`);
    console.log(`🔹 Calculated Bounding Box (BBOX): [${minLng}, ${minLat}, ${maxLng}, ${maxLat}]`);
    console.log("\n💡 Why BBOX matters: The frontend uses this bounding box to instantly auto-zoom and center the map on the loaded data.");
}

// Run the script
analyzeGeoJSON(sampleGeoJSON);