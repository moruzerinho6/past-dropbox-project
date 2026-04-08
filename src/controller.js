import crypto from 'crypto'
import NodeCache from 'node-cache'
import dropbox from 'dropbox'
import fetch from 'isomorphic-fetch'

const OAUTH_REDIRECT_URL = "http://localhost:3000/auth"

const config = {
  fetch: fetch,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
}

var dbx = new dropbox.Dropbox(config)
var mycache = new NodeCache()

export const home = async (req, res, next) => {
  if (!req.session.token) {

    //create a random state value
    let state = crypto.randomBytes(16).toString('hex')

    // Save state and the session id for 10 mins
    mycache.set(state, req.session.id, 6000)

    // get authentication URL and redirect
    authUrl = dbx.getAuthenticationUrl(OAUTH_REDIRECT_URL, state, 'code')
    res.redirect(authUrl)
  } else {
    // if a token exists, it can be used to access Dropbox resources
    dbx.setAccessToken(req.session.token)

    try {
      const account_details = await dbx.usersGetCurrentAccount()
      const display_name = account_details.name.display_name
      dbx.setAccessToken(null); //clean up token

      res.render('index', { name: display_name })
    } catch (error){
      dbx.setAccessToken(null)
      next(error)
    }
  }
}

export const auth = async (req, res, next) => {
  if (req?.query?.error_description) {
    return next(new Error(req.query.error_description))
  }

  let state = req.query.state

  if (!mycache.get(state)) {
    return next(new Error("session expired or invalid state"))
  } 

  if (req.query.code) {
    try {
      const token = await dbx.getAccessTokenFromCode(OAUTH_REDIRECT_URL, req.query.code)

      // store token and invalidate state
      req.session.token = token
      mycache.del(state)
      res.redirect('/')

    } catch(error){
      return next(error)
    }
  }
}