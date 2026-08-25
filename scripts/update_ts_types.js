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

directories.forEach(dir => {
    const files = walk(dir);
    files.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        let originalContent = content;

        // Pattern: images: string[] or images?: string[] or images?: string[] | null
        content = content.replace(/images\s*\??\s*:\s*string\[\](\s*\|\s*null)?/g, "images?: any[]");

        if (content !== originalContent) {
            fs.writeFileSync(file, content);
            console.log(`Updated TS types: ${file}`);
        }
    });
});
