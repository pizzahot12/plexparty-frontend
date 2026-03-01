import { Hono } from 'hono'
import * as mediaController from '../controllers/mediaController.js'

const routes = new Hono()

routes.get('/list', mediaController.getMediaList)
routes.get('/:id', mediaController.getMediaDetails)

export default routes
