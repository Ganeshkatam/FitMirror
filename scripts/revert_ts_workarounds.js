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

        // Revert types
        content = content.replace(/images\s*\??\s*:\s*any\[\](\s*\|\s*null)?/g, "images?: ProductImage[]");

        // Add import if ProductImage is used but not imported
        if (content.includes('ProductImage[]') && !content.includes('ProductImage') && !content.includes('@/lib/service/media')) {
            // we'll just prepend it to the top
            content = `import { ProductImage } from '@/lib/service/media'\n` + content;
        }

        // Revert inline fallbacks
        // (typeof product.images?.[0] === 'string' ? product.images[0] : (product.images?.[0] as any)?.src) -> product.images?.[0]?.src
        content = content.replace(/\(typeof (\w+(?:\.\w+)?)\.images\?\.\[0\] === 'string' \? \1\.images\[0\] : \(\1\.images\?\.\[0\] as any\)\?\.src\)/g, "$1.images?.[0]?.src");
        
        // Pattern 2 without `?.`
        content = content.replace(/\(typeof (\w+(?:\.\w+)?)\.images\?\.\[0\] === 'string' \? \1\.images\[0\] : \(\1\.images\?\.\[0\] as any\)\?\.src\)/g, "$1.images?.[0]?.src"); // handled by above actually if we just use a looser regex

        content = content.replace(/\(typeof ([^ ]+) === 'string' \? [^ ]+ : \([^ ]+ as any\)\?\.src\)/g, "$1?.src");

        // The exact replacements we did earlier:
        // content = content.replace(/(\w+(?:\.\w+)?)\.images\?\s*\.\s*\[0\]/g, "(typeof $1.images?.[0] === 'string' ? $1.images[0] : ($1.images?.[0] as any)?.src)");
        // Let's replace the exact string
        // We can use a regex that matches the whole string: (typeof obj.images?.[0] === 'string' ? obj.images[0] : (obj.images?.[0] as any)?.src)
        const regex0 = /\(typeof ([a-zA-Z0-9_.]+)\.images\?\s*\.\s*\[0\] === 'string' \? \1\.images\[0\] : \(\1\.images\?\s*\.\s*\[0\] as any\)\?\s*\.\s*src\)/g;
        content = content.replace(regex0, "$1.images?.[0]?.src");

        const regex1 = /\(typeof ([a-zA-Z0-9_.]+)\.images\?\s*\.\s*\[1\] === 'string' \? \1\.images\[1\] : \(\1\.images\?\s*\.\s*\[1\] as any\)\?\s*\.\s*src\)/g;
        content = content.replace(regex1, "$1.images?.[1]?.src");

        if (content !== originalContent) {
            fs.writeFileSync(file, content);
            console.log(`Reverted UI code in: ${file}`);
        }
    });
});
