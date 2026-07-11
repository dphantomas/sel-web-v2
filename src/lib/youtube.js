const API_BASE = 'https://www.googleapis.com/youtube/v3'
const CHANNEL_HANDLE = 'SanacionEnLuz'

function getApiKey() {
  return typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
    : process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
}

/**
 * Fetch JSON from YouTube Data API v3
 */
async function ytFetch(endpoint, params = {}) {
  const apiKey = getApiKey()
  if (!apiKey) {
    console.warn('[YouTube] No API key configured')
    return null
  }

  const url = new URL(`${API_BASE}/${endpoint}`)
  url.searchParams.set('key', apiKey)
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }

  try {
    const res = await fetch(url.toString())
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error(`[YouTube] API error ${res.status}:`, err?.error?.message || res.statusText)
      return null
    }
    return await res.json()
  } catch (error) {
    console.error('[YouTube] Fetch error:', error.message)
    return null
  }
}

/**
 * Get channel info by handle (@SanacionEnLuz)
 */
export async function getChannelInfo() {
  const data = await ytFetch('channels', {
    part: 'snippet,contentDetails,statistics',
    forHandle: CHANNEL_HANDLE,
  })

  if (!data?.items?.length) {
    console.warn(`[YouTube] Channel @${CHANNEL_HANDLE} not found`)
    return null
  }

  const channel = data.items[0]
  return {
    channelId: channel.id,
    uploadsPlaylistId: channel.contentDetails.relatedPlaylists.uploads,
    title: channel.snippet.title,
    description: channel.snippet.description,
    thumbnail: channel.snippet.thumbnails?.medium?.url || channel.snippet.thumbnails?.default?.url,
    subscriberCount: channel.statistics?.subscriberCount,
    videoCount: channel.statistics?.videoCount,
    channelUrl: `https://www.youtube.com/@${CHANNEL_HANDLE}`,
  }
}

/**
 * Get all video IDs from the uploads playlist
 */
async function getUploadIds(uploadsPlaylistId, maxResults = 50) {
  const ids = []
  let pageToken = ''

  for (let i = 0; i < 2; i++) {
    const params = {
      part: 'contentDetails',
      playlistId: uploadsPlaylistId,
      maxResults: String(maxResults),
    }
    if (pageToken) params.pageToken = pageToken

    const data = await ytFetch('playlistItems', params)
    if (!data?.items) break

    for (const item of data.items) {
      ids.push(item.contentDetails.videoId)
    }

    pageToken = data.nextPageToken || ''
    if (!pageToken) break
  }

  return ids
}

/**
 * Get video details for a batch of IDs
 */
async function getVideoDetails(videoIds) {
  if (!videoIds.length) return []

  const videos = []

  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50)
    const data = await ytFetch('videos', {
      part: 'snippet,contentDetails,statistics',
      id: batch.join(','),
    })

    if (!data?.items) continue

    for (const item of data.items) {
      videos.push({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails?.maxres?.url
          || item.snippet.thumbnails?.high?.url
          || item.snippet.thumbnails?.medium?.url
          || item.snippet.thumbnails?.default?.url,
        thumbnailMedium: item.snippet.thumbnails?.medium?.url
          || item.snippet.thumbnails?.default?.url,
        duration: item.contentDetails.duration,
        viewCount: item.statistics?.viewCount || '0',
        likeCount: item.statistics?.likeCount || '0',
      })
    }
  }

  return videos
}

/**
 * Parse ISO 8601 duration (PT1M30S) to seconds
 */
export function parseDuration(iso) {
  if (!iso) return 0
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)
  return hours * 3600 + minutes * 60 + seconds
}

/**
 * Format seconds to human-readable
 */
export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * Format view count
 */
export function formatViews(count) {
  const n = parseInt(count, 10)
  if (isNaN(n)) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}
/**
 * Check if a video is a YouTube Short by testing the /shorts/ URL.
 * YouTube redirects /shorts/VIDEO_ID → /watch?v=VIDEO_ID for regular videos (303).
 * For actual Shorts, it serves the page directly (200, no redirect).
 *
 * Using mode:'no-cors' + redirect:'manual':
 *   - 'opaqueredirect' → YouTube redirected → NOT a Short
 *   - 'opaque'         → YouTube served it  → IS a Short
 */
async function isYouTubeShort(videoId) {
  try {
    const res = await fetch(`https://www.youtube.com/shorts/${videoId}`, {
      method: 'HEAD',
      mode: 'no-cors',
      redirect: 'manual',
    })
    // 'opaqueredirect' means YouTube redirected to /watch → regular video
    // 'opaque' means YouTube served /shorts/ page → it IS a Short
    return res.type === 'opaque'
  } catch {
    return false
  }
}

/**
 * Main function: get all videos from channel, separated into videos and shorts
 * Uses YouTube's oEmbed endpoint to correctly identify Shorts vs regular videos.
 */
export async function getChannelVideos() {
  const channel = await getChannelInfo()
  if (!channel) return { channel: null, videos: [], shorts: [] }

  const videoIds = await getUploadIds(channel.uploadsPlaylistId)
  if (!videoIds.length) return { channel, videos: [], shorts: [] }

  const allVideos = await getVideoDetails(videoIds)

  // Check each video against YouTube's Shorts detection
  const shortChecks = await Promise.all(
    allVideos.map((v) => isYouTubeShort(v.id))
  )

  const videos = []
  const shorts = []

  for (let i = 0; i < allVideos.length; i++) {
    const video = allVideos[i]
    const seconds = parseDuration(video.duration)
    const enriched = { ...video, durationSeconds: seconds }

    if (shortChecks[i]) {
      shorts.push(enriched)
    } else {
      videos.push(enriched)
    }
  }

  videos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
  shorts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))

  return { channel, videos, shorts }
}

