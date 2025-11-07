import { auth } from 'express-oauth2-jwt-bearer'
import * as jose from 'jose'
import express from 'express'
import * as oidc from 'express-openid-connect'
import dotenv from 'dotenv'

dotenv.config()

const DEFAULT_AUTH0_DOMAIN = 'pohutukawa-2023-ricky.au.auth0.com'
const DEFAULT_AUTH0_AUDIENCE = 'https://travels/api'
const DEFAULT_AUTH0_CLIENT_ID = 'Ouo4yhNha6QVHJd1XeV3rKaLe0dmGsvM'

export const AUTH0_DOMAIN =
  process.env.VITE_AUTH0_DOMAIN || DEFAULT_AUTH0_DOMAIN
export const AUTH0_AUDIENCE =
  process.env.VITE_AUTH0_AUDIENCE || DEFAULT_AUTH0_AUDIENCE
export const AUTH0_CLIENT_ID =
  process.env.VITE_AUTH0_CLIENT_ID || DEFAULT_AUTH0_CLIENT_ID
export const AUTH0_CLIENT_SECRET = process.env.VITE_AUTH0_CLIENT_SECRET

export const oidcConfig: oidc.ConfigParams = {
  authorizationParams: {
    response_type: 'code',
    scope: 'openid profile email create:orders update:users',
    audience: AUTH0_AUDIENCE,
  },
  authRequired: false,
  auth0Logout: true,

  baseURL: 'http://localhost:3000',
  clientID: AUTH0_CLIENT_ID,
  clientSecret: AUTH0_CLIENT_SECRET,
  issuerBaseURL: `https://${AUTH0_DOMAIN}`,
  secret: 'LONG_RANDOM_STRING',
  routes: {
    login: false,
    postLogoutRedirect: '/moderator/home',
  },
}

const authConfig = {
  issuerBaseURL: `https://${AUTH0_DOMAIN}`,
  audience: AUTH0_AUDIENCE,
}

export const validateAccessToken = auth(authConfig)

export function requiresPermission(requiredPermission: string) {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    // Safely extract the access token
    const accessToken =
      req.oidc && req.oidc.accessToken
        ? req.oidc.accessToken.access_token
        : null

    if (!accessToken || typeof accessToken !== 'string') {
      return res.status(403).send('Forbidden: no or invalid access token')
    }

    try {
      const decoded = jose.decodeJwt(accessToken) as { permissions: string[] }
      const permissions = decoded && (decoded.permissions || [])

      if (!permissions.includes(requiredPermission)) {
        return res.status(403).send('Forbidden: insufficient scope')
      }

      next()
    } catch (err) {
      if (err instanceof Error) {
        return res.status(403).send(`Forbidden: invalid token (${err.message})`)
      }
    }
  }
}
