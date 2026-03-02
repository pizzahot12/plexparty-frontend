import type { Readable } from 'stream'
import type { Quality } from '../types/index.js'
import { startTranscode, stopTranscode } from '../lib/ffmpeg.js'
import * as jellyfinService from './jellyfin.service.js'
import logger from '../utils/logger.js'

export interface StreamOptions {
  audioStreamIndex?: number
  subtitleStreamIndex?: number
}

export interface TranscodeResult {
  stream: Readable
  sessionId: string
}

export async function getTranscodedStream(
  mediaId: string,
  quality: Quality,
  userId: string,
  options: StreamOptions = {}
): Promise<TranscodeResult> {
  const sessionId = `${userId}-${mediaId}`

  const inputUrl = jellyfinService.getStreamUrl(mediaId, {
    audioStreamIndex: options.audioStreamIndex,
    subtitleStreamIndex: options.subtitleStreamIndex,
  })

  logger.info(`Starting transcode: media=${mediaId} quality=${quality} session=${sessionId}`)

  const stream = startTranscode(inputUrl, quality, sessionId)

  return { stream, sessionId }
}

export function stopStream(userId: string, mediaId: string): void {
  const sessionId = `${userId}-${mediaId}`
  stopTranscode(sessionId)
  logger.info(`Stopped transcode: session=${sessionId}`)
}
