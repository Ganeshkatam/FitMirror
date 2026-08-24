export interface TryOnAsset {
    id: string | number
    url: string // Texture URL
    layer: number // 0=Shoes, 1=Bottoms, 2=Tops, 3=Outerwear
    type: 'closet' | 'catalog' | 'demo'
    metadata?: any
}

export interface MannequinState {
    gender: 'female' | 'male'
    skinColor: string
    rotation: number
    zoom: number
}

export type GarmentStack = Record<number, TryOnAsset>
