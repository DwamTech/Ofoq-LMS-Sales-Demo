const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'world-topology.json');

try {
    const topojson = require(filePath);
    const countries = topojson.objects.countries.geometries;

    console.log("Total geometries before:", countries.length);

    // Find Somaliland by name since ID is undefined or -99
    const somaliland = countries.find(c => c.properties && c.properties.name === "Somaliland");
    const somalia = countries.find(c => c.id == 706 || c.id == "706");

    if (somaliland) {
        console.log("Found Somaliland by name. Merging into Somalia (706)...");

        // Assign Somalia's ID to Somaliland
        somaliland.id = 706;
        if (typeof somalia.id === 'string') somaliland.id = "706";

        // Update name
        if (somaliland.properties) {
            somaliland.properties.name = "Somalia";
        }

        fs.writeFileSync(filePath, JSON.stringify(topojson));
        console.log("Successfully merged Somaliland into Somalia.");
    } else {
        console.log("Somaliland not found by name.");
    }

} catch (e) {
    console.error("Error modifying map data:", e);
}
