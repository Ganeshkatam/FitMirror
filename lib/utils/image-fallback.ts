export const FALLBACK_IMAGES: Record<string, string> = {
    // Using the Google URL for Classic White Top to match the Database/PDP
    'Classic White Top': 'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRo2O0E1x7SAJH1VpkUHQHRmrjbeRpNy5bsA5MwHQLSpye5ezVi-xb40OM6Y8oNK4nn6I3gkxvVBzb5YnXydS7QyLRxu_8bj_oxWpE8Ki8',
    'Elegant Evening Gown': 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=1000&auto=format&fit=crop',
    'High Waist Jeans': 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=1000&auto=format&fit=crop'
}

export function getProductImage(productName: string, dbImage: string | null | undefined): string {
    // Prefer hardcoded fallback for known shaky products
    if (FALLBACK_IMAGES[productName]) {
        return FALLBACK_IMAGES[productName]
    }
    // Otherwise use DB image
    return dbImage || ''
}
