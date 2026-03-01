import type { Context } from 'hono'
import * as authService from '../services/auth.service.js'
import { loginSchema, registerSchema } from '../utils/validators.js'

export async function login(c: Context) {
  const body = await c.req.json()
  const parsed = loginSchema.safeParse(body)

  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0].message }, 400)
  }

  try {
    const result = await authService.login(parsed.data.email, parsed.data.password)
    return c.json(result)
  } catch (err) {
    return c.json({ error: (err as Error).message }, 401)
  }
}

export async function register(c: Context) {
  const body = await c.req.json()
  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    return c.json({ error: parsed.error.errors[0].message }, 400)
  }

  try {
    const result = await authService.register(
      parsed.data.email,
      parsed.data.password,
      parsed.data.name
    )
    return c.json(result, 201)
  } catch (err) {
    return c.json({ error: (err as Error).message }, 400)
  }
}

export async function logout(c: Context) {
  // JWT is stateless - client just discards the token
  // Could add token blacklisting later if needed
  return c.json({ success: true })
}
