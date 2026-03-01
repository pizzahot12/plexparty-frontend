import { createMiddleware } from 'hono/factory'
import logger from '../utils/logger.js'

const errorHandler = createMiddleware(async (c, next) => {
  try {
    await next()
  } catch (err) {
    const error = err as Error
    logger.error(`Unhandled error: ${error.message}`, error.stack)

    const status = (err as { status?: number }).status || 500
    return c.json(
      {
        error: status === 500 ? 'Error interno del servidor' : error.message,
      },
      status as 500
    )
  }
})

export default errorHandler
