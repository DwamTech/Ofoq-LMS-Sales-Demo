const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'world-topology.json');
const topojson = require(filePath);
const countries = topojson.objects.countries.geometries;

console.log("Total geometries:", countries.length);

// Print all with their properties to find Somaliland
countries.forEach(c => {
    const name = c.properties ? c.properties.name : "Unknown";
    console.log(`ID: ${c.id}, Name: ${name}`);
});
