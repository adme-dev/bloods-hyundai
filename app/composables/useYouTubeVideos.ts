/**
 * Composable for fetching and filtering Hyundai YouTube videos by vehicle model
 * Uses strict matching to ensure only related videos are shown
 */

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
}

// Hyundai model names - only show videos for these models
const HYUNDAI_MODELS = [
  'i30', 'i20', 'i40',
  'tucson', 'kona', 'venue',
  'santa fe', 'santafe',
  'palisade', 'staria',
  'ioniq', 'ioniq 5', 'ioniq 6', 'ioniq5', 'ioniq6',
  'elantra', 'sonata', 'accent',
  'nexo', 'inster'
]

// Normalize text for matching
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Extract the primary model name from vehicle model string
function extractModelName(model: string): string | null {
  const normalized = normalizeText(model)

  // Find the Hyundai model in the string
  for (const hyundaiModel of HYUNDAI_MODELS) {
    if (normalized.includes(hyundaiModel)) {
      return hyundaiModel
    }
  }

  return null
}

// Check if a video title/description contains the model name
function videoMatchesModel(video: YouTubeVideo, modelName: string): boolean {
  const titleNormalized = normalizeText(video.title)
  const descNormalized = normalizeText(video.description)

  // Must contain the model name in title or description
  return titleNormalized.includes(modelName) || descNormalized.includes(modelName)
}

export function useYouTubeVideos(
  modelName: Ref<string> | ComputedRef<string>,
  options: UseYouTubeVideosOptions = {}
) {
  const { maxResults = 6 } = options

  const videos = ref<YouTubeVideo[]>([])
  const allVideos = ref<YouTubeVideo[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

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

  // Filter videos by model - strict matching
  const filterByModel = () => {
    const model = unref(modelName)
    if (!model || allVideos.value.length === 0) {
      videos.value = []
      return
    }

    // Extract the Hyundai model name
    const hyundaiModel = extractModelName(model)
    if (!hyundaiModel) {
      // Not a recognized Hyundai model, don't show any videos
      videos.value = []
      return
    }

    // Filter videos that match the model
    const matchedVideos = allVideos.value.filter(video =>
      videoMatchesModel(video, hyundaiModel)
    )

    // Sort by publish date (newest first) and limit results
    videos.value = matchedVideos
      .sort((a, b) => {
        const dateA = new Date(a.publishedAt).getTime()
        const dateB = new Date(b.publishedAt).getTime()
        return dateB - dateA
      })
      .slice(0, maxResults)
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
