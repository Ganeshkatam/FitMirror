'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/lib/database.types'

// Types
type Collection = Database['public']['Tables']['collections']['Row']
type CollectionInsert = Database['public']['Tables']['collections']['Insert']
type ProductCategory = Database['public']['Tables']['product_categories']['Row']
type ProductCategoryInsert = Database['public']['Tables']['product_categories']['Insert']

// ============ COLLECTIONS ============

export async function getCollections() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('sort_order', { ascending: true })

    if (error) throw error
    return data as Collection[]
}

export async function getActiveCollections() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

    if (error) throw error
    return data as Collection[]
}

export async function createCollection(data: CollectionInsert) {
    const supabase = await createClient()
    const { error } = await supabase.from('collections').insert(data)

    if (error) throw error
    revalidatePath('/')
    revalidatePath('/platform-admin/cms')
}

export async function updateCollection(id: string, data: Partial<CollectionInsert>) {
    const supabase = await createClient()
    const { error } = await supabase.from('collections').update(data).eq('id', id)

    if (error) throw error
    revalidatePath('/')
    revalidatePath('/platform-admin/cms')
}

export async function deleteCollection(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('collections').delete().eq('id', id)

    if (error) throw error
    revalidatePath('/')
    revalidatePath('/platform-admin/cms')
}

export async function toggleCollectionStatus(id: string, isActive: boolean) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('collections')
        .update({ is_active: isActive })
        .eq('id', id)

    if (error) throw error
    revalidatePath('/')
    revalidatePath('/platform-admin/cms')
}

export async function reorderCollections(orderedIds: string[]) {
    const supabase = await createClient()

    // Update sort_order for each collection
    for (let i = 0; i < orderedIds.length; i++) {
        await supabase
            .from('collections')
            .update({ sort_order: i + 1 })
            .eq('id', orderedIds[i])
    }

    revalidatePath('/')
    revalidatePath('/platform-admin/cms')
}

export async function cleanupDuplicateCollections() {
    const supabase = await createClient()

    // Fetch all collections
    const { data: collections } = await supabase
        .from('collections')
        .select('id, title, created_at')
        .order('created_at', { ascending: true })

    if (!collections) return

    const seenTitles = new Set()
    const idsToDelete: string[] = []

    for (const col of collections) {
        if (seenTitles.has(col.title)) {
            idsToDelete.push(col.id)
        } else {
            seenTitles.add(col.title)
        }
    }

    if (idsToDelete.length > 0) {
        await supabase
            .from('collections')
            .delete()
            .in('id', idsToDelete)

        revalidatePath('/')
        revalidatePath('/platform-admin/cms')
    }
}

// ============ PRODUCT CATEGORIES ============

export async function getProductCategories() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('sort_order', { ascending: true })

    if (error) throw error
    return data as ProductCategory[]
}

export async function getActiveProductCategories() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

    if (error) throw error
    return data as ProductCategory[]
}

export async function createProductCategory(data: ProductCategoryInsert) {
    const supabase = await createClient()
    const { error } = await supabase.from('product_categories').insert(data)

    if (error) throw error
    revalidatePath('/')
    revalidatePath('/platform-admin/cms')
}

export async function updateProductCategory(id: string, data: Partial<ProductCategoryInsert>) {
    const supabase = await createClient()
    const { error } = await supabase.from('product_categories').update(data).eq('id', id)

    if (error) throw error
    revalidatePath('/')
    revalidatePath('/platform-admin/cms')
}

export async function deleteProductCategory(id: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('product_categories').delete().eq('id', id)

    if (error) throw error
    revalidatePath('/')
    revalidatePath('/platform-admin/cms')
}

export async function toggleProductCategoryStatus(id: string, isActive: boolean) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('product_categories')
        .update({ is_active: isActive })
        .eq('id', id)

    if (error) throw error
    revalidatePath('/')
    revalidatePath('/platform-admin/cms')
}

export async function reorderProductCategories(orderedIds: string[]) {
    const supabase = await createClient()

    for (let i = 0; i < orderedIds.length; i++) {
        await supabase
            .from('product_categories')
            .update({ sort_order: i + 1 })
            .eq('id', orderedIds[i])
    }

    revalidatePath('/')
    revalidatePath('/platform-admin/cms')
}
