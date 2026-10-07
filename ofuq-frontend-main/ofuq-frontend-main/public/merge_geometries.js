const fs = require('fs');
const path = require('path');
const topojsonClient = require('topojson-client');
const topojsonServer = require('topojson-server');

const filePath = path.join(__dirname, 'world-topology.json');

try {
    const topology = require(filePath);

    // 1. Convert to GeoJSON FeatureCollection
    const geojson = topojsonClient.feature(topology, topology.objects.countries);

    console.log("Total features:", geojson.features.length);

    // 2. Separate features
    const somalia = geojson.features.find(f => f.id == 706 || f.id == "706");
    const somaliland = geojson.features.find(f => f.properties.name === "Somaliland");

    if (somalia && somaliland) {
        console.log("Found both Somalia (706) and Somaliland. Merging...");

        // 3. Create a merged geometry using topojson.merge
        // topojson.merge takes (topology, objects)
        // We need to pass the *original* topology and the list of geometries we want to merge
        // BUT we need to reference them from the topology itself.

        const geometries = topology.objects.countries.geometries;
        const somaliaGeo = geometries.find(g => g.id == 706 || g.id == "706");
        const somalilandGeo = geometries.find(g => g.properties && g.properties.name === "Somaliland");

        // Union them
        const mergedGeo = topojsonClient.merge(topology, [somaliaGeo, somalilandGeo]);

        // mergedGeo is a GeoJSON MultiPolygon object.
        // We want to replace the two original features with this one new feature in the FeatureCollection.

        const newFeatures = geojson.features.filter(f =>
            (f.id != 706 && f.id != "706") &&
            (f.properties.name !== "Somaliland")
        );

        // Create new merged feature
        const newFeature = {
            type: "Feature",
            id: 706,
            properties: {
                name: "Somalia",
                // preserve other properties if needed?
                ISO_A3: "SOM" // ensure this exists
            },
            geometry: mergedGeo
        };

        newFeatures.push(newFeature);

        // 4. Convert back to TopoJSON
        const newTopology = topojsonServer.topology({
            countries: {
                type: "FeatureCollection",
                features: newFeatures
            }
        });

        // Preserve old transform/scale if possible? 
        // topojson-server re-quantizes. It might change the quality slightly but usually fine.

        fs.writeFileSync(filePath, JSON.stringify(newTopology));
        console.log("Successfully merged geometries and saved new TopoJSON.");

    } else {
        console.log("Could not find both entities to merge.");
        if (!somalia) console.log("Missing Somalia");
        if (!somaliland) console.log("Missing Somaliland");
    }

} catch (e) {
    console.error("Error merging map data:", e);
}
