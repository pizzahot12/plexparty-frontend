import type { Context } from 'hono'
import * as jellyfinService from '../services/jellyfin.service.js'
import { mediaListQuerySchema } from '../utils/validators.js'

export async function getMediaList(c: Context) {
  const query = mediaListQuerySchema.safeParse({
    type: c.req.query('type'),
    skip: c.req.query('skip'),
    limit: c.req.query('limit'),
  })

  if (!query.success) {
    return c.json({ error: query.error.errors[0].message }, 400)
  }

  try {
    const media = await jellyfinService.getMediaList(
      query.data.type,
      query.data.skip,
      query.data.limit
    )
    return c.json(media)
  } catch (err) {
    return c.json({ error: 'Error al obtener peliculas' }, 500)
  }
}

export async function getMediaDetails(c: Context) {
  const id = c.req.param('id')

  try {
    const details = await jellyfinService.getMediaDetails(id)
    return c.json(details)
  } catch (err) {
    return c.json({ error: 'Pelicula no encontrada' }, 404)
  }
}
