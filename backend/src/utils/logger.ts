const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

const levels: Record<string, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
}

const currentLevel = levels[LOG_LEVEL] ?? 2

function timestamp(): string {
  return new Date().toISOString()
}

export const logger = {
  error(msg: string, ...args: unknown[]) {
    if (currentLevel >= 0) console.error(`[${timestamp()}] ERROR: ${msg}`, ...args)
  },
  warn(msg: string, ...args: unknown[]) {
    if (currentLevel >= 1) console.warn(`[${timestamp()}] WARN: ${msg}`, ...args)
  },
  info(msg: string, ...args: unknown[]) {
    if (currentLevel >= 2) console.log(`[${timestamp()}] INFO: ${msg}`, ...args)
  },
  debug(msg: string, ...args: unknown[]) {
    if (currentLevel >= 3) console.log(`[${timestamp()}] DEBUG: ${msg}`, ...args)
  },
}

export default logger
