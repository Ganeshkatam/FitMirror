import { createClient } from '@supabase/supabase-js'

export type ProductMediaRow = {
    id: string
    product_id: string
    url: string
    media_type: string
    storage_path: string | null
    position: number | null
}

export type ProductImage = {
    id: string
    src: string
    position: number
    mediaType: "image" | "video"
}

export function resolveStorageUrl(storagePath: string): string {
    const BUCKET = 'product-images'
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    
    // Construct public URL
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`
}

function normalizeMediaType(value: string): "image" | "video" {
    if (value === "image" || value === "video") {
        return value;
    }
    throw new Error(`Unsupported product media type: ${value}`);
}

export function normalizeProductMedia(rawMediaData: ProductMediaRow[] | null | undefined): ProductImage[] {
    if (!rawMediaData || !Array.isArray(rawMediaData)) return [];

    return [...rawMediaData]
        // Sort by position ASC, id ASC for deterministic tie-breaking
        .sort((a, b) => {
            const posA = a.position ?? 9999;
            const posB = b.position ?? 9999;
            if (posA !== posB) {
                return posA - posB;
            }
            return a.id.localeCompare(b.id);
        })
        // Map to domain model
        .map(row => {
            if (!row.storage_path) {
                throw new Error(`Data integrity error: missing storage_path for media ${row.id}`);
            }
            return {
                id: row.id,
                src: resolveStorageUrl(row.storage_path),
                position: row.position ?? 9999,
                mediaType: normalizeMediaType(row.media_type)
            };
        });
}

/**
 * Helper to fetch and attach normalized product_media to an array of products.
 * Used for RPC results where product_media cannot be easily joined in the SQL query.
 */
export async function populateMediaForProducts(products: any[]) {
    if (!products || products.length === 0) return products;

    const productIds = products.map(p => p.id || p.product_id).filter(Boolean);
    if (productIds.length === 0) return products;

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: mediaData, error } = await supabase
        .from('product_media')
        .select('*')
        .in('product_id', productIds)

    if (error) {
        console.error('Failed to fetch product media', error);
        return products.map(p => ({ ...p, images: [] }));
    }

    const mediaByProductId = (mediaData || []).reduce((acc: Record<string, ProductMediaRow[]>, row) => {
        if (!acc[row.product_id]) acc[row.product_id] = [];
        acc[row.product_id].push(row);
        return acc;
    }, {});

    return products.map(p => {
        const id = p.id || p.product_id;
        return {
            ...p,
            images: normalizeProductMedia(mediaByProductId[id] || [])
        };
    });
}
