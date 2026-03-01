import { Hono } from 'hono'
import * as friendsController from '../controllers/friendsController.js'

const routes = new Hono()

routes.get('/', friendsController.getFriends)
routes.post('/:userId/add', friendsController.addFriend)
routes.delete('/:userId', friendsController.removeFriend)

export default routes
