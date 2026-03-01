import type { Context } from 'hono'
import supabase from '../lib/database.js'
import type { AppVariables, Friend } from '../types/index.js'

export async function getFriends(c: Context<{ Variables: AppVariables }>) {
  const userId = c.get('userId')

  try {
    const { data, error } = await supabase
      .from('friends')
      .select(`
        friend_id,
        profiles!friends_friend_id_fkey (id, name, avatar)
      `)
      .eq('user_id', userId)

    if (error) throw error

    const friends: Friend[] = (data || []).map((f) => {
      const profile = f.profiles as unknown as { id: string; name: string; avatar?: string }
      return {
        id: profile.id,
        name: profile.name,
        avatar: profile.avatar,
        status: 'offline' as const, // TODO: implement online tracking
      }
    })

    return c.json(friends)
  } catch (err) {
    return c.json({ error: 'Error al obtener amigos' }, 500)
  }
}

export async function addFriend(c: Context<{ Variables: AppVariables }>) {
  const userId = c.get('userId')
  const friendUserId = c.req.param('userId')

  if (userId === friendUserId) {
    return c.json({ error: 'No puedes agregarte a ti mismo' }, 400)
  }

  try {
    // Check if user exists
    const { data: friendProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', friendUserId)
      .single()

    if (!friendProfile) {
      return c.json({ error: 'Usuario no encontrado' }, 404)
    }

    // Check if already friends
    const { data: existing } = await supabase
      .from('friends')
      .select('id')
      .eq('user_id', userId)
      .eq('friend_id', friendUserId)
      .single()

    if (existing) {
      return c.json({ error: 'Ya son amigos' }, 400)
    }

    // Add friendship (bidirectional)
    await supabase.from('friends').insert([
      { user_id: userId, friend_id: friendUserId },
      { user_id: friendUserId, friend_id: userId },
    ])

    return c.json({ success: true }, 201)
  } catch (err) {
    return c.json({ error: 'Error al agregar amigo' }, 500)
  }
}

export async function removeFriend(c: Context<{ Variables: AppVariables }>) {
  const userId = c.get('userId')
  const friendUserId = c.req.param('userId')

  try {
    // Remove bidirectional friendship
    await supabase
      .from('friends')
      .delete()
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendUserId}),and(user_id.eq.${friendUserId},friend_id.eq.${userId})`)

    return c.json({ success: true })
  } catch (err) {
    return c.json({ error: 'Error al eliminar amigo' }, 500)
  }
}
