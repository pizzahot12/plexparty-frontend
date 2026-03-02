import type {
  JellyfinItem,
  JellyfinMediaStream,
  MediaItem,
  MediaDetails,
} from '../types/index.js'
import logger from '../utils/logger.js'
import { getMockMediaList, getMockMediaDetails } from './mock-media.service.js'

const JELLYFIN_URL = process.env.JELLYFIN_URL || ''
const JELLYFIN_API_KEY = process.env.JELLYFIN_API_KEY || ''

const USE_MOCK = !JELLYFIN_URL || !JELLYFIN_API_KEY

if (USE_MOCK) {
  logger.info('Jellyfin not configured - using mock data')
}

async function jellyfinFetch<T>(path: string): Promise<T> {
  if (USE_MOCK) {
    throw new Error('Jellyfin not configured')
  }

  const url = `${JELLYFIN_URL}${path}`
  const separator = path.includes('?') ? '&' : '?'

  const response = await fetch(`${url}${separator}api_key=${JELLYFIN_API_KEY}`)

  if (!response.ok) {
    logger.error(`Jellyfin API error: ${response.status} ${response.statusText} for ${path}`)
    throw new Error(`Jellyfin API error: ${response.status}`)
  }

  return response.json() as Promise<T>
}

function ticksToSeconds(ticks: number): number {
  return Math.floor(ticks / 10_000_000)
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
    duration: item.RunTimeTicks ? ticksToSeconds(item.RunTimeTicks) : 0,
    synopsis: item.Overview || '',
    genres: item.Genres || [],
  }
}

export async function getMediaList(
  type: string = 'movies',
  skip: number = 0,
  limit: number = 20
): Promise<MediaItem[]> {
  if (USE_MOCK) {
    return getMockMediaList(type, skip, limit)
  }

  try {
    const itemTypes = type === 'series' ? 'Series' : type === 'all' ? 'Movie,Series' : 'Movie'

    const data = await jellyfinFetch<{ Items: JellyfinItem[] }>(
      `/Items?IncludeItemTypes=${itemTypes}&Recursive=true&SortBy=SortName&SortOrder=Ascending&StartIndex=${skip}&Limit=${limit}&Fields=Overview,Genres`
    )

    return data.Items.map(mapJellyfinToMedia)
  } catch (error) {
    logger.warn('Jellyfin unavailable, falling back to mock data')
    return getMockMediaList(type, skip, limit)
  }
}

export async function getMediaDetails(mediaId: string): Promise<MediaDetails> {
  if (USE_MOCK) {
    const mock = getMockMediaDetails(mediaId)
    if (mock) return mock
    throw new Error('Media not found')
  }

  try {
    const item = await jellyfinFetch<JellyfinItem>(
      `/Items/${mediaId}?Fields=Overview,Genres,People,MediaStreams`
    )

    const base = mapJellyfinToMedia(item)

    const cast = (item.People || [])
      .filter((p) => p.Type === 'Actor')
      .slice(0, 20)
      .map((p) => ({
        name: p.Name,
        role: p.Role || '',
      }))

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
  } catch (error) {
    logger.warn('Jellyfin unavailable, falling back to mock data')
    const mock = getMockMediaDetails(mediaId)
    if (mock) return mock
    throw new Error('Media not found')
  }
}

export interface SubtitleInfo {
  index: number
  language: string
  displayTitle: string
  codec: string
  isExternal: boolean
}

export interface AudioInfo {
  index: number
  language: string
  displayTitle: string
  codec: string
  isDefault: boolean
}

export interface MediaStreamInfo {
  subtitles: SubtitleInfo[]
  audio: AudioInfo[]
}

export async function getMediaStreams(mediaId: string): Promise<MediaStreamInfo> {
  if (USE_MOCK) {
    return {
      subtitles: [
        { index: 0, language: 'spa', displayTitle: 'Spanish', codec: 'subrip', isExternal: false },
        { index: 1, language: 'eng', displayTitle: 'English', codec: 'subrip', isExternal: false },
      ],
      audio: [
        { index: 0, language: 'spa', displayTitle: 'Spanish', codec: 'aac', isDefault: true },
        { index: 1, language: 'eng', displayTitle: 'English', codec: 'aac', isDefault: false },
      ],
    }
  }

  try {
    const data = await jellyfinFetch<{
      MediaSources: Array<{ MediaStreams: JellyfinMediaStream[] }>
    }>(`/Items/${mediaId}/PlaybackInfo`)

    const streams = data.MediaSources?.[0]?.MediaStreams || []

    const subtitles: SubtitleInfo[] = streams
      .filter((s) => s.Type === 'Subtitle')
      .map((s) => ({
        index: s.Index,
        language: s.Language || 'und',
        displayTitle: s.DisplayTitle || s.Language || 'Unknown',
        codec: s.Codec || 'unknown',
        isExternal: s.IsExternal || false,
      }))

    const audio: AudioInfo[] = streams
      .filter((s) => s.Type === 'Audio')
      .map((s) => ({
        index: s.Index,
        language: s.Language || 'und',
        displayTitle: s.DisplayTitle || s.Language || 'Unknown',
        codec: s.Codec || 'unknown',
        isDefault: s.IsDefault || false,
      }))

    return { subtitles, audio }
  } catch (error) {
    logger.error('Error fetching media streams:', (error as Error).message)
    return { subtitles: [], audio: [] }
  }
}

export interface EpisodeInfo {
  id: string
  title: string
  season: number
  episode: number
  synopsis: string
  duration: number
  poster: string
}

export async function getSeasons(seriesId: string): Promise<Array<{ id: string; name: string; number: number }>> {
  if (USE_MOCK) {
    return [
      { id: `${seriesId}-s1`, name: 'Temporada 1', number: 1 },
      { id: `${seriesId}-s2`, name: 'Temporada 2', number: 2 },
    ]
  }

  try {
    const data = await jellyfinFetch<{ Items: JellyfinItem[] }>(
      `/Shows/${seriesId}/Seasons`
    )

    return data.Items.map((item) => ({
      id: item.Id,
      name: item.Name,
      number: item.IndexNumber || 0,
    }))
  } catch (error) {
    logger.error('Error fetching seasons:', (error as Error).message)
    return []
  }
}

export async function getEpisodes(
  seriesId: string,
  seasonId?: string
): Promise<EpisodeInfo[]> {
  if (USE_MOCK) {
    return Array.from({ length: 10 }, (_, i) => ({
      id: `${seriesId}-ep-${i + 1}`,
      title: `Episodio ${i + 1}`,
      season: 1,
      episode: i + 1,
      synopsis: `Sinopsis del episodio ${i + 1}`,
      duration: 45,
      poster: '',
    }))
  }

  try {
    const params = seasonId ? `&SeasonId=${seasonId}` : ''
    const data = await jellyfinFetch<{ Items: JellyfinItem[] }>(
      `/Shows/${seriesId}/Episodes?Fields=Overview${params}`
    )

    return data.Items.map((item) => ({
      id: item.Id,
      title: item.Name,
      season: item.ParentIndexNumber || 1,
      episode: item.IndexNumber || 0,
      synopsis: item.Overview || '',
      duration: item.RunTimeTicks ? ticksToSeconds(item.RunTimeTicks) : 0,
      poster: item.ImageTags?.['Primary']
        ? `${JELLYFIN_URL}/Items/${item.Id}/Images/Primary?api_key=${JELLYFIN_API_KEY}`
        : '',
    }))
  } catch (error) {
    logger.error('Error fetching episodes:', (error as Error).message)
    return []
  }
}

export function getStreamUrl(
  mediaId: string,
  options: {
    audioStreamIndex?: number
    subtitleStreamIndex?: number
  } = {}
): string {
  if (USE_MOCK) {
    return 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
  }

  const params = new URLSearchParams({
    Static: 'true',
    api_key: JELLYFIN_API_KEY,
  })

  if (options.audioStreamIndex !== undefined) {
    params.set('AudioStreamIndex', String(options.audioStreamIndex))
  }
  if (options.subtitleStreamIndex !== undefined) {
    params.set('SubtitleStreamIndex', String(options.subtitleStreamIndex))
  }

  return `${JELLYFIN_URL}/Videos/${mediaId}/stream?${params}`
}

export function getImageUrl(
  itemId: string,
  imageType: 'Primary' | 'Backdrop' | 'Logo' | 'Thumb' = 'Primary',
  maxWidth?: number
): string {
  if (USE_MOCK || !JELLYFIN_URL) {
    return ''
  }

  const params = new URLSearchParams({
    api_key: JELLYFIN_API_KEY,
  })

  if (maxWidth) {
    params.set('maxWidth', String(maxWidth))
  }

  return `${JELLYFIN_URL}/Items/${itemId}/Images/${imageType}?${params}`
}

export interface JellyfinStatus {
  connected: boolean
  serverName?: string
  version?: string
  error?: string
}

export async function checkConnection(): Promise<JellyfinStatus> {
  if (USE_MOCK) {
    return {
      connected: false,
      error: 'Jellyfin not configured (using mock data)',
    }
  }

  try {
    const data = await jellyfinFetch<{
      ServerName: string
      Version: string
    }>('/System/Info/Public')

    return {
      connected: true,
      serverName: data.ServerName,
      version: data.Version,
    }
  } catch (error) {
    return {
      connected: false,
      error: (error as Error).message,
    }
  }
}

export function isConfigured(): boolean {
  return !USE_MOCK
}
