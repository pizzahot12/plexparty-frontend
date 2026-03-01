import { Hono } from 'hono'
import * as streamController from '../controllers/streamController.js'

const routes = new Hono()

routes.get('/:mediaId', streamController.getStream)

export default routes
