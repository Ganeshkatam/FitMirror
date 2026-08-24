import { createClient } from "@supabase/supabase-js";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateCategories() {
    console.log('Updating Categories for Visual Upgrade...');

    // 1. Update Main Categories (Hero Images & Discounts)
    const updates = [
        {
            slug: 'woman',
            is_featured_home: true,
            featured_discount_text: '50-80% OFF',
            hero_image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=2600&auto=format&fit=crop', // Ethnic
            description: "Discover the latest in women's fashion, from ethnic to western."
        },
        {
            slug: 'man',
            is_featured_home: true,
            featured_discount_text: '30-70% OFF',
            hero_image_url: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=2600&auto=format&fit=crop',
            description: "Upgrade your style with the latest trends in men's clothing."
        },
        {
            slug: 'kids',
            is_featured_home: true,
            featured_discount_text: 'Min 40% OFF',
            hero_image_url: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?q=80&w=2600&auto=format&fit=crop',
            description: "Cute and comfortable clothing for your little ones."
        }
    ];

    for (const update of updates) {
        const { error } = await supabase
            .from('main_categories')
            .update(update)
            .eq('slug', update.slug);

        if (error) console.error(`Error updating ${update.slug}:`, error.message);
        else console.log(`Updated ${update.slug}`);
    }

    // 2. Update Sub Categories (Group Names for Mega Menu)
    const subUpdates = [
        // Women
        { slug: 'dresses', group: 'Western Wear' },
        { slug: 'w-tops', group: 'Western Wear' },
        { slug: 'w-jackets', group: 'Western Wear' },
        { slug: 'w-pants', group: 'Western Wear' },
        // Men
        { slug: 'm-tshirts', group: 'Topwear' },
        { slug: 'm-jackets', group: 'Topwear' },
        { slug: 'm-pants', group: 'Bottomwear' },
        // Kids
        { slug: 'k-clothing', group: 'Boys Clothing' }
    ];

    for (const update of subUpdates) {
        const { error } = await supabase
            .from('sub_categories')
            .update({ group_name: update.group })
            .eq('slug', update.slug);

        if (error) console.error(`Error updating sub ${update.slug}:`, error.message);
        else console.log(`Updated sub category ${update.slug}`);
    }

    console.log('Done!');
}

updateCategories();
