import type { Page, Route } from '@playwright/test'

/** Outillage des tests visuels : API simulée, horloge et session fixes, images remplacées. */

export const API = 'http://localhost:3999'

// PNG 1x1 gris : remplace toutes les images (avatars, produits, pièces jointes).
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  'base64'
)

export const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

/** Réponse d'API pour un chemin donné ; `undefined` = réponse vide `{}`. */
export type ApiHandler = (path: string, method: string, url: URL) => unknown | Promise<unknown>

/**
 * Horloge qui avance depuis `now` : figée, elle casse la garde anti double-traitement
 * de Vue et les `@click.stop` imbriqués. Session ouverte, cookies acceptés.
 */
export async function setupSession(page: Page, { now, userId }: { now: Date; userId: string }) {
  await page.clock.install({ time: now })
  await page.clock.resume()
  await page.context().addCookies([
    { name: 'id_user', value: userId, domain: 'localhost', path: '/' },
    { name: 'sessionToken', value: 'test-access', domain: 'localhost', path: '/' },
    { name: 'refreshToken', value: 'test-refresh', domain: 'localhost', path: '/' },
    {
      name: 'cookie_consent',
      value: encodeURIComponent(JSON.stringify({ analytics: false, version: 1, decidedAt: now.toISOString() })),
      domain: 'localhost',
      path: '/'
    }
  ])
}

export async function mockApi(page: Page, handler: ApiHandler) {
  await page.route(/fonts\.(googleapis|gstatic)\.com|googletagmanager\.com/, (route) => route.abort())
  await page.route(/mykpoptrade\.com\/images\//, (route) => route.fulfill({ contentType: 'image/png', body: PNG }))

  await page.route(`${API}/**`, async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    if (path.startsWith('/uploads/') || path.includes('/attachments/')) {
      return route.fulfill({ contentType: 'image/png', body: PNG })
    }
    if (path.startsWith('/api/notifications')) return json(route, { notifications: [], unreadCount: 0 })
    if (path.startsWith('/api/cart')) return json(route, { cart: { items: [] }, items: [] })

    const body = await handler(path, route.request().method(), url)
    if (body && typeof body === 'object' && '__status' in body) {
      const { __status, ...rest } = body as { __status: number }
      return json(route, rest, __status)
    }
    return json(route, body ?? {})
  })
}
