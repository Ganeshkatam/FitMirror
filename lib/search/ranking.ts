import { SearchIntent, ProductCandidate } from './types';

/**
 * LAYER 4: Ranking Engine
 * Re-orders candidates based on "FitMirror Score".
 */
export class RankingEngine {
    static rank(candidates: ProductCandidate[], intent: SearchIntent): ProductCandidate[] {
        // If user explicitly sorted by price/time, honor that primarily.
        // We only "tweak" the order if sort is 'relevance'.
        if (intent.sort !== 'relevance') {
            return candidates; // Pass through
        }

        return candidates.map(candidate => {
            let score = 0;
            const debug: string[] = [];

            // 1. Recency Boost
            // (Simple decay: newer items get small boost)
            const created = new Date(candidate.created_at).getTime();
            const now = Date.now();
            const daysOld = (now - created) / (1000 * 60 * 60 * 24);
            if (daysOld < 30) {
                score += 10;
                debug.push('New Arrival');
            }

            // 2. Image Quality Boost (MVP)
            if (candidate.image_url) {
                score += 5;
            }

            // 3. Price Sensitivity Check
            if (intent.signals.isPriceSensitive) {
                // Boost cheaper items in relevance mode
                if (candidate.price < 5000) { // Arbitrary threshold
                    score += 15;
                    debug.push('Budget Match');
                }
            }

            // 4. Occasion Match (Keyword in name/category)
            if (intent.signals.detectedOccasion) {
                const text = (candidate.name + ' ' + candidate.category).toLowerCase();
                if (text.includes(intent.signals.detectedOccasion)) {
                    score += 20;
                    debug.push(`Occasion: ${intent.signals.detectedOccasion}`);
                }
            }

            return { ...candidate, score, debugScore: debug.join(', ') };
        }).sort((a, b) => (b.score || 0) - (a.score || 0));
    }
}
