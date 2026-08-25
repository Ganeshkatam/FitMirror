const fs = require('fs');
const path = require('path');

const directories = [
    'd:/websites/fitmirror/components',
    'd:/websites/fitmirror/app'
];

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

let modifiedFiles = 0;

directories.forEach(dir => {
    const files = walk(dir);
    files.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        let originalContent = content;

        // Replace .images?.[0] with something that handles both string and object
        // Actually, let's look at specific patterns from the grep
        
        // Pattern 1: x.images?.[0] -> (typeof x.images?.[0] === 'string' ? x.images[0] : x.images?.[0]?.src)
        content = content.replace(/(\w+(?:\.\w+)?)\.images\?\s*\.\s*\[0\]/g, "(typeof $1.images?.[0] === 'string' ? $1.images[0] : ($1.images?.[0] as any)?.src)");
        
        // Pattern 2: x.images[0] (without ?.)
        content = content.replace(/(\w+(?:\.\w+)?)\.images\[0\]/g, "(typeof $1.images?.[0] === 'string' ? $1.images[0] : ($1.images?.[0] as any)?.src)");
        
        // Pattern 3: x.images?.[1] -> (typeof x.images?.[1] === 'string' ? x.images[1] : x.images?.[1]?.src)
        content = content.replace(/(\w+(?:\.\w+)?)\.images\?\s*\.\s*\[1\]/g, "(typeof $1.images?.[1] === 'string' ? $1.images[1] : ($1.images?.[1] as any)?.src)");
        
        // Pattern 4: x.images[1]
        content = content.replace(/(\w+(?:\.\w+)?)\.images\[1\]/g, "(typeof $1.images?.[1] === 'string' ? $1.images[1] : ($1.images?.[1] as any)?.src)");

        if (content !== originalContent) {
            fs.writeFileSync(file, content);
            console.log(`Updated: ${file}`);
            modifiedFiles++;
        }
    });
});

console.log(`Total files modified: ${modifiedFiles}`);
