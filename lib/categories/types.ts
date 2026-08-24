export type SubCategory = {
    id: string
    name: string
    slug: string
    icon?: string | null
    image_url?: string | null
    parent_id?: string | null
    main_category_id?: string | null
}

export type MainCategory = {
    id: string
    name: string
    slug: string
    description?: string | null
    image_url?: string | null
    is_active?: boolean
    sort_order?: number
    sub_categories?: SubCategory[]
}

export interface Category {
    id: string
    name: string
    slug: string
    description?: string | null
    image_url?: string | null
    icon?: string | null
    parent_id?: string | null
    is_active?: boolean
    sort_order?: number
    children?: Category[]
}

export interface CategoryWithSubs extends Category {
    sub_categories: Category[]
}
