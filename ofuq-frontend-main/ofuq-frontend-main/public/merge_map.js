const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'world-topology.json');

try {
    const topojson = require(filePath);
    const countries = topojson.objects.countries.geometries;

    console.log("Total geometries before:", countries.length);

    // Find Somaliland (704)
    const somaliland = countries.find(c => c.id == 704 || c.id == "704");
    const somalia = countries.find(c => c.id == 706 || c.id == "706");

    if (somaliland) {
        console.log("Found Somaliland (704). Merging into Somalia (706)...");

        // Simplest approach: Change ID to 706. 
        // This makes them logically the same country for coloring/stats.
        // Ideally we would merge geometries but changing ID is often sufficient for stats maps.
        somaliland.id = 706; // or "706" depending on type, let's keep type consistent
        if (typeof somalia.id === 'string') somaliland.id = "706";

        // Just to be sure, we can also try to update properties if they exist
        if (somaliland.properties) {
            somaliland.properties.name = "Somalia";
        }

        fs.writeFileSync(filePath, JSON.stringify(topojson));
        console.log("Successfully updated world-topology.json");
    } else {
        console.log("Somaliland (704) not found. Maybe it has a different ID?");
        // Print all IDs to be sure
        // console.log(countries.map(c => c.id));
    }

} catch (e) {
    console.error("Error modifying map data:", e);
}
