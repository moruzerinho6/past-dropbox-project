
import express from 'express'
const router = express.Router()
import * as controller from '../controller.js'

router.get('/', controller.home) // home route
router.get('/auth', controller.auth) // redirect route

export default router