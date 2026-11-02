import { QueryUnderstanding } from './query-understanding'
import { RetrievalEngine } from './retrieval'
import { RankingEngine } from './ranking'
import { SearchResult } from './types'

/**
 * THE SEARCH PIPELINE
 * Orchestrates the search layers: Query -> Intent -> Retrieval -> Ranking
 */
export class SearchPipeline {
    static async run(request: Request): Promise<SearchResult> {
        const intent = QueryUnderstanding.parse(request.url)

        const url = new URL(request.url)
        const limit = parseInt(url.searchParams.get('limit') || '24')
        const offset = parseInt(url.searchParams.get('offset') || '0')

        const { products: candidates, total } = await RetrievalEngine.fetchCandidates(intent, limit, offset)
        const rankedProducts = RankingEngine.rank(candidates, intent)

        const explanationHints: string[] = []
        if (intent.signals.isPriceSensitive) {
            explanationHints.push('Prioritizing budget-friendly options based on your search.')
        }
        if (intent.signals.detectedOccasion) {
            explanationHints.push(`Showing best picks for "${intent.signals.detectedOccasion}".`)
        }
        if (intent.filters.sizes && intent.filters.sizes.length > 0) {
            explanationHints.push(`Filtered to available sizes: ${intent.filters.sizes.join(', ')}`)
        }

        return {
            products: rankedProducts,
            total,
            explanationHints
        }
    }
}
