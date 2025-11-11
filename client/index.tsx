import { createRoot } from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routes } from './routes.tsx'

const queryClient = new QueryClient()

const router = createBrowserRouter(routes)

const metaEnv = (import.meta as any).env as Record<string, string | undefined>
const domain = metaEnv.VITE_AUTH0_DOMAIN
const clientId = metaEnv.VITE_AUTH0_CLIENT_ID
const audience = metaEnv.VITE_AUTH0_AUDIENCE
const redirectUri =
  metaEnv.VITE_AUTH0_CALLBACK_URL ?? window.location.origin

if (!domain || !clientId || !audience) {
  throw new Error('Missing Auth0 configuration environment variables')
}

const root = createRoot(document.getElementById('app') as HTMLElement)
root.render(
  <Auth0Provider
    domain={domain}
    clientId={clientId}
    redirectUri={redirectUri}
    audience={audience}
  >
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </Auth0Provider>
)
