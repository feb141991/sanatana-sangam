const fs = require('fs');
const path = require('path');

// Extract the raw text from the TS file
const fileContent = fs.readFileSync('src/lib/data/ramayana-complete.ts', 'utf-8');

// Use a simple regex or eval to get the array. Since it's TS, eval is hard.
// I will parse the JS object manually.
const match = fileContent.match(/export const RAMAYANA_COMPLETE_ENTRIES:\s*LibraryEntry\[\]\s*=\s*(\[\s*\{[\s\S]*\}\s*\]);/);
if (!match) {
  console.error("Could not find RAMAYANA_COMPLETE_ENTRIES array.");
  process.exit(1);
}

let entriesString = match[1];
// Replace keys without quotes to keys with quotes to make it valid JSON
entriesString = entriesString.replace(/(\w+): /g, '"$1": ');
// Replace single quotes with double quotes
entriesString = entriesString.replace(/'/g, '"');
// Some strings might have had escaped single quotes. But wait, it's safer to just run it as JS.
