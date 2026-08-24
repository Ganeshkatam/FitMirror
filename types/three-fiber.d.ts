import { FC, ReactNode } from 'react'

declare module '@react-three/fiber' {
    export const Canvas: FC<any>
    export function useFrame(callback: (state: any, delta: number) => void, renderPriority?: number): void
    export function useThree<T = any>(selector?: (state: any) => T, equals?: any): T
    export function useLoader<T = any>(loader: any, input: any, extensions?: any): T
    export interface ThreeElements {
        [key: string]: any
    }
}

declare module '@react-three/drei' {
    export const OrbitControls: any
    export const PerspectiveCamera: any
    export const Environment: any
    export const ContactShadows: any
    export const Points: any
    export const PointMaterial: any
    export const Float: any
    export const Center: any
    export const Html: any
    export const useTexture: any
    export const Decal: any
}

declare global {
    namespace React {
        namespace JSX {
            interface IntrinsicElements {
                [elemName: string]: any
            }
        }
    }
    namespace JSX {
        interface IntrinsicElements {
            [elemName: string]: any
        }
    }
}
