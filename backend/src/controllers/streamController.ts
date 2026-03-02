import type { Context } from 'hono'
import { stream } from 'hono/streaming'
import * as ffmpegService from '../services/ffmpeg.service.js'
import { qualitySchema } from '../utils/validators.js'
import type { Quality, AppVariables } from '../types/index.js'
import logger from '../utils/logger.js'

export async function getStream(c: Context<{ Variables: AppVariables }>) {
  const mediaId = c.req.param('mediaId')
  const qualityInput = c.req.query('quality') || '720p'
  const audioIndex = c.req.query('audioIndex')
  const subtitleIndex = c.req.query('subtitleIndex')
  const userId = c.get('userId')

  const parsed = qualitySchema.safeParse(qualityInput)
  if (!parsed.success) {
    return c.json({ error: 'Calidad invalida. Opciones: 360p, 480p, 720p, 1080p' }, 400)
  }

  const quality: Quality = parsed.data

  try {
    const streamOptions = {
      audioStreamIndex: audioIndex ? parseInt(audioIndex, 10) : undefined,
      subtitleStreamIndex: subtitleIndex ? parseInt(subtitleIndex, 10) : undefined,
    }

    const { stream: videoStream, sessionId } = await ffmpegService.getTranscodedStream(
      mediaId,
      quality,
      userId,
      streamOptions
    )

    c.header('Content-Type', 'video/mp2t')
    c.header('Cache-Control', 'no-cache')
    c.header('Transfer-Encoding', 'chunked')

    return stream(c, async (s) => {
      const reader = videoStream

      reader.on('data', async (chunk: Buffer) => {
        try {
          await s.write(chunk)
        } catch {
          ffmpegService.stopStream(userId, mediaId)
        }
      })

      reader.on('end', () => {
        logger.info(`Stream ended: session=${sessionId}`)
      })

      reader.on('error', (err) => {
        logger.error(`Stream error: session=${sessionId}`, err.message)
      })

      await new Promise<void>((resolve) => {
        reader.on('end', resolve)
        reader.on('error', resolve)
      })
    })
  } catch (err) {
    logger.error('Stream failed:', (err as Error).message)
    return c.json({ error: 'Error al iniciar stream' }, 500)
  }
}
