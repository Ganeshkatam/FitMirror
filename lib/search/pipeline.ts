import { QueryUnderstanding } from './query-understanding';
import { RetrievalEngine } from './retrieval';
import { RankingEngine } from './ranking';
import { SearchResult } from './types';

/**
 * THE SEARCH PIPELINE
 * Orchestrates the 4 layers: Query -> Intent -> Retrieval -> Ranking
 */
export class SearchPipeline {
    static async run(request: Request): Promise<SearchResult> {
        // 1. LAYER 1 & 2: Query Intake & Understanding
        const intent = QueryUnderstanding.parse(request.url);

        // Extract limit/offset from url here or pass from intent?
        // Intent handles filters. We'll parse pagination locally for the engine.
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '24');
        const offset = parseInt(url.searchParams.get('offset') || '0');

        // 2. LAYER 3: Retrieval
        const { products: candidates, total } = await RetrievalEngine.fetchCandidates(intent, limit, offset);

        // 3. LAYER 4: Ranking
        const rankedProducts = RankingEngine.rank(candidates, intent);

        // 4. Response Formatting & Explanations
        const explanationHints: string[] = [];
        if (intent.signals.isPriceSensitive) {
            explanationHints.push('Prioritizing budget-friendly options based on your search.');
        }
        if (intent.signals.detectedOccasion) {
            explanationHints.push(`Showing best picks for "${intent.signals.detectedOccasion}".`);
        }
        if (intent.filters.sizes && intent.filters.sizes.length > 0) {
            explanationHints.push(`Filtered to available sizes: ${intent.filters.sizes.join(', ')}`);
        }

        return {
            products: rankedProducts,
            total,
            tryonReady: intent.signals.isTryOnIntent, // Signal to UI to show Try-On prompt
            explanationHints
        };
    }
}
