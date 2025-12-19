/**
 * Composable for fetching and filtering Hyundai YouTube videos by vehicle model
 * Uses Fuse.js for fuzzy matching to find related videos based on title and description
 */
import Fuse from 'fuse.js'

interface YouTubeVideo {
  id: string
  title: string
  description: string
  thumbnails: string
  thumbnailmq: string
  publishedAt: string
}

interface UseYouTubeVideosOptions {
  maxResults?: number
  threshold?: number
}

// Common model name variations and aliases for pre-processing
const MODEL_ALIASES: Record<string, string[]> = {
  'i30': ['i30', 'i-30', 'i 30'],
  'i20': ['i20', 'i-20', 'i 20'],
  'i40': ['i40', 'i-40', 'i 40'],
  'tucson': ['tucson'],
  'kona': ['kona'],
  'venue': ['venue'],
  'santa fe': ['santa fe', 'santafe', 'santa-fe'],
  'palisade': ['palisade'],
  'staria': ['staria'],
  'ioniq': ['ioniq', 'ioniq 5', 'ioniq 6', 'ioniq5', 'ioniq6'],
  'ioniq 5': ['ioniq 5', 'ioniq5', 'ioniq 5 n'],
  'ioniq 6': ['ioniq 6', 'ioniq6'],
}

// Normalize text for matching
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Get search terms for a model (for Fuse.js pattern matching)
function getSearchTerms(model: string): string[] {
  const normalized = normalizeText(model)
  const terms = [normalized]

  // Add aliases if they exist
  for (const [key, aliases] of Object.entries(MODEL_ALIASES)) {
    if (normalized.includes(key) || aliases.some(a => normalized.includes(a))) {
      terms.push(...aliases)
    }
  }

  // Also add individual words for compound models (e.g., "i30 N Line" -> ["i30", "n", "line"])
  const words = normalized.split(' ').filter(w => w.length > 1)
  terms.push(...words)

  return [...new Set(terms)]
}

export function useYouTubeVideos(
  modelName: Ref<string> | ComputedRef<string>,
  options: UseYouTubeVideosOptions = {}
) {
  const { maxResults = 6, threshold = 0.4 } = options

  const videos = ref<YouTubeVideo[]>([])
  const allVideos = ref<YouTubeVideo[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Create Fuse instance for fuzzy searching
  const fuseInstance = computed(() => {
    if (allVideos.value.length === 0) return null

    return new Fuse(allVideos.value, {
      keys: [
        { name: 'title', weight: 0.7 },
        { name: 'description', weight: 0.3 }
      ],
      threshold, // 0 = exact match, 1 = match anything
      includeScore: true,
      ignoreLocation: true,
      findAllMatches: true,
      minMatchCharLength: 2,
    })
  })

  // Fetch all videos from CDN
  const fetchVideos = async () => {
    if (allVideos.value.length > 0) return // Already fetched

    loading.value = true
    error.value = null

    try {
      const response = await $fetch<YouTubeVideo[]>(
        'https://driveagent.b-cdn.net/files/shared/oem/hyundai/youtube.json'
      )
      allVideos.value = response || []
    } catch (e) {
      console.error('[useYouTubeVideos] Failed to fetch videos:', e)
      error.value = 'Failed to load videos'
      allVideos.value = []
    } finally {
      loading.value = false
    }
  }

  // Filter videos by model using Fuse.js
  const filterByModel = () => {
    const model = unref(modelName)
    if (!model || allVideos.value.length === 0 || !fuseInstance.value) {
      videos.value = []
      return
    }

    const searchTerms = getSearchTerms(model)
    const allResults: Map<string, { video: YouTubeVideo; score: number }> = new Map()

    // Search for each term and aggregate results
    for (const term of searchTerms) {
      const results = fuseInstance.value.search(term)

      for (const result of results) {
        const existing = allResults.get(result.item.id)
        const newScore = result.score || 1

        // Keep the best (lowest) score for each video
        if (!existing || newScore < existing.score) {
          allResults.set(result.item.id, {
            video: result.item,
            score: newScore
          })
        }
      }
    }

    // Sort by score (lower is better) and limit results
    const sortedResults = Array.from(allResults.values())
      .sort((a, b) => a.score - b.score)
      .slice(0, maxResults)
      .map(item => item.video)

    // Prefer newer videos when scores are similar
    videos.value = sortedResults.sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime()
      const dateB = new Date(b.publishedAt).getTime()
      return dateB - dateA
    })
  }

  // Watch for model changes and re-filter
  watch(
    () => unref(modelName),
    async () => {
      await fetchVideos()
      filterByModel()
    },
    { immediate: true }
  )

  // Also filter when all videos are loaded
  watch(allVideos, () => {
    filterByModel()
  })

  return {
    videos: readonly(videos),
    loading: readonly(loading),
    error: readonly(error),
    hasVideos: computed(() => videos.value.length > 0),
    refetch: fetchVideos,
  }
}
