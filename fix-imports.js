const fs = require('fs'); 
const files = [
    'components/account/return-request-form.tsx', 
    'components/home/continue-shopping.tsx', 
    'components/home/recommended-products.tsx', 
    'components/mobile/story-swiper.tsx', 
    'components/personalization/for-you-grid.tsx', 
    'components/product/luxury-product-card.tsx', 
    'components/product/product-card.tsx', 
    'components/product/tabbed-recommendations.tsx', 
    'components/reviews/review-list.tsx'
]; 
files.forEach(f => { 
    let content = fs.readFileSync(f, 'utf8'); 
    if (!content.includes('import { ProductImage }')) { 
        fs.writeFileSync(f, `import { ProductImage } from '@/lib/service/media';\n` + content); 
    } 
});
