import { spawn, type ChildProcess } from 'child_process'
import type { Readable } from 'stream'
import type { Quality } from '../types/index.js'

const qualityMap: Record<Quality, { scale: string; bitrate: string }> = {
  '360p': { scale: '640:360', bitrate: '500k' },
  '480p': { scale: '854:480', bitrate: '1000k' },
  '720p': { scale: '1280:720', bitrate: '2500k' },
  '1080p': { scale: '1920:1080', bitrate: '5000k' },
}

// Store active FFmpeg processes so we can clean them up
const activeProcesses = new Map<string, ChildProcess>()

export function startTranscode(
  inputUrl: string,
  quality: Quality,
  sessionId: string
): Readable {
  const settings = qualityMap[quality]

  // Kill existing process for this session if any
  stopTranscode(sessionId)

  const args = [
    '-user_agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    '-re',
    '-i', inputUrl,
    '-c', 'copy',
    '-f', 'mpegts',
    '-movflags', 'frag_keyframe+empty_moov',
    'pipe:1',
  ]

  const ffmpeg = spawn('ffmpeg', args)

  activeProcesses.set(sessionId, ffmpeg)

  ffmpeg.stderr.on('data', (data: Buffer) => {
    // FFmpeg logs to stderr (not an error)
    const msg = data.toString()
    if (msg.includes('Error') || msg.includes('error')) {
      console.error(`[FFmpeg ${sessionId}] Error:`, msg)
    }
  })

  ffmpeg.on('close', () => {
    activeProcesses.delete(sessionId)
  })

  ffmpeg.on('error', (err) => {
    console.error(`[FFmpeg ${sessionId}] Process error:`, err.message)
    activeProcesses.delete(sessionId)
  })

  return ffmpeg.stdout
}

export function stopTranscode(sessionId: string): void {
  const proc = activeProcesses.get(sessionId)
  if (proc) {
    proc.kill('SIGTERM')
    activeProcesses.delete(sessionId)
  }
}

export function getActiveTranscodes(): number {
  return activeProcesses.size
}
