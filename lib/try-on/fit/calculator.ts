
export type FitZone = 'chest' | 'waist' | 'hips' | 'shoulders' | 'inseam'

export interface Measurements {
    [key: string]: number // in cm
}

export interface FitResult {
    overallScore: number // 0-100 match
    zoneScores: Record<FitZone, {
        status: 'tight' | 'perfect' | 'loose'
        diff: number
    }>
    recommendation: string
}

const EASE_ALLOWANCES: Record<FitZone, { min: number, max: number }> = {
    chest: { min: 4, max: 10 },    // Need 4-10cm ease
    waist: { min: 2, max: 6 },
    hips: { min: 4, max: 8 },
    shoulders: { min: 0, max: 2 },
    inseam: { min: -2, max: 2 }    // Length matching
}

export class FitCalculator {
    /**
     * Compare Body vs Garment measurements
     * @param body Body measurements (circumference in cm)
     * @param garment Garment measurements (circumference in cm)
     */
    static calculate(body: Measurements, garment: Measurements): FitResult {
        const zones: Partial<Record<FitZone, any>> = {}
        let totalZones = 0
        let passedZones = 0

        // Check each zone
        Object.keys(EASE_ALLOWANCES).forEach((z) => {
            const zone = z as FitZone
            if (body[zone] && garment[zone]) {
                totalZones++
                const bodyVal = body[zone]
                const garmentVal = garment[zone]
                const ease = garmentVal - bodyVal
                const allowance = EASE_ALLOWANCES[zone]

                let status: 'tight' | 'perfect' | 'loose' = 'perfect'

                if (ease < allowance.min) status = 'tight'
                else if (ease > allowance.max) status = 'loose'

                if (status === 'perfect') passedZones++

                zones[zone] = { status, diff: ease }
            }
        })

        // 0 match if no overlapping measurements
        const overallScore = totalZones === 0 ? 0 : Math.round((passedZones / totalZones) * 100)

        // Recommendation Text
        let recommendation = "Fits well"
        if (overallScore < 50) {
            const tightZones = Object.entries(zones).filter(([_, v]) => v.status === 'tight').map(([k]) => k)
            if (tightZones.length > 0) recommendation = `Too tight on ${tightZones.join(', ')}`
            else recommendation = "Too loose or poor fit"
        }

        return {
            overallScore,
            zoneScores: zones as any,
            recommendation
        }
    }
}
