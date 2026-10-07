const fs = require('fs');
const topojson = require('./world-topology.json');

const countries = topojson.objects.countries.geometries;
console.log("Total geometries:", countries.length);

const ids = countries.map(c => c.id).sort((a, b) => a - b); // IDs are usually numbers or strings
console.log("IDs found:", ids.join(', '));

// Check for 706 (Somalia) and nearby codes or -99
const somalia = countries.find(c => c.id == 706 || c.id == "706");
console.log("Somalia found:", !!somalia);

// Somaliland is often 704 in some datasets, or -99. 
// Let's check for 704.
const somaliland = countries.find(c => c.id == 704 || c.id == "704");
console.log("Somaliland (704) found:", !!somaliland);
