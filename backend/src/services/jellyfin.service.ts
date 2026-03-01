import type { JellyfinItem, MediaItem, MediaDetails } from '../types/index.js'
import logger from '../utils/logger.js'

const JELLYFIN_URL = process.env.JELLYFIN_URL || 'http://localhost:8096'
const JELLYFIN_API_KEY = process.env.JELLYFIN_API_KEY || ''

async function jellyfinFetch<T>(path: string): Promise<T> {
  const url = `${JELLYFIN_URL}${path}`
  const separator = path.includes('?') ? '&' : '?'

  const response = await fetch(`${url}${separator}api_key=${JELLYFIN_API_KEY}`)

  if (!response.ok) {
    logger.error(`Jellyfin API error: ${response.status} ${response.statusText} for ${path}`)
    throw new Error(`Jellyfin API error: ${response.status}`)
  }

  return response.json() as Promise<T>
}

function mapJellyfinToMedia(item: JellyfinItem): MediaItem {
  const posterTag = item.ImageTags?.['Primary']
  const backdropTag = item.BackdropImageTags?.[0]

  return {
    id: item.Id,
    title: item.Name,
    poster: posterTag
      ? `${JELLYFIN_URL}/Items/${item.Id}/Images/Primary?tag=${posterTag}&api_key=${JELLYFIN_API_KEY}`
      : '',
    backdrop: backdropTag
      ? `${JELLYFIN_URL}/Items/${item.Id}/Images/Backdrop?tag=${backdropTag}&api_key=${JELLYFIN_API_KEY}`
      : '',
    rating: item.CommunityRating || 0,
    year: item.ProductionYear || 0,
    duration: item.RunTimeTicks ? Math.floor(item.RunTimeTicks / 10_000_000) : 0,
    synopsis: item.Overview || '',
    genres: item.Genres || [],
  }
}

export async function getMediaList(
  type: string = 'movies',
  skip: number = 0,
  limit: number = 20
): Promise<MediaItem[]> {
  // Map type to Jellyfin IncludeItemTypes
  const itemTypes = type === 'series' ? 'Series' : type === 'all' ? 'Movie,Series' : 'Movie'

  const data = await jellyfinFetch<{ Items: JellyfinItem[] }>(
    `/Items?IncludeItemTypes=${itemTypes}&Recursive=true&SortBy=SortName&SortOrder=Ascending&StartIndex=${skip}&Limit=${limit}&Fields=Overview,Genres`
  )

  return data.Items.map(mapJellyfinToMedia)
}

export async function getMediaDetails(mediaId: string): Promise<MediaDetails> {
  const item = await jellyfinFetch<JellyfinItem>(
    `/Items/${mediaId}?Fields=Overview,Genres,People,MediaStreams`
  )

  const base = mapJellyfinToMedia(item)

  // Extract cast
  const cast = (item.People || [])
    .filter((p) => p.Type === 'Actor')
    .slice(0, 20)
    .map((p) => ({
      name: p.Name,
      role: p.Role || '',
    }))

  // Extract subtitle and audio languages
  const streams = item.MediaStreams || []
  const subtitles = streams
    .filter((s) => s.Type === 'Subtitle' && s.Language)
    .map((s) => s.Language!)
  const audio = streams
    .filter((s) => s.Type === 'Audio' && s.Language)
    .map((s) => s.Language!)

  return {
    ...base,
    cast,
    subtitles: [...new Set(subtitles)],
    audio: [...new Set(audio)],
  }
}

export function getStreamUrl(mediaId: string): string {
  return `${JELLYFIN_URL}/Videos/${mediaId}/stream?Static=true&api_key=${JELLYFIN_API_KEY}`
}
