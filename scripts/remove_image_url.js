const fs = require('fs');

const files = [
    'd:/websites/fitmirror/app/try-on/[id]/try-on-client.tsx',
    'd:/websites/fitmirror/app/try-on/page.tsx',
    'd:/websites/fitmirror/app/api/products/[productId]/related/route.ts',
    'd:/websites/fitmirror/app/api/cron/abandoned-cart/route.ts',
    'd:/websites/fitmirror/app/api/chat/route.ts',
    'd:/websites/fitmirror/app/api/chat/agent/route.ts',
    'd:/websites/fitmirror/app/(shop)/order/[id]/page.tsx',
];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Replace in select() calls
    if (content.match(/\.select\([^)]*image_url[^)]*\)/)) {
        content = content.replace(/(\.select\([^)]*)image_url([^)]*\))/g, (match, p1, p2) => {
            // Check if product_media(*) is already there
            let newStr = p1 + (p1.includes('product_media(*)') ? '' : 'product_media(*), ') + p2;
            newStr = newStr.replace(/, \)/g, ')').replace(/, ,/g, ',');
            return newStr;
        });
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        console.log("Updated selects in: " + file);
    }
});
