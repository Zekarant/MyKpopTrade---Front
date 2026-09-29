import { ref } from 'vue'
import { API_URL } from '@/config/api'
import { createApiClient, getAccessToken } from '@/services/http'

/**
 * Jeton de lecture des pièces jointes, placé dans leurs URL (`<img src>` ne
 * peut pas porter d'en-tête). Il ne permet que de lire les pièces jointes des
 * conversations de l'utilisateur : contrairement au jeton d'accès qu'on y
 * mettait avant, un « copier l'adresse de l'image » partagé n'ouvre pas le
 * compte.
 *
 * Réactif : les URL des pièces jointes se mettent à jour d'elles-mêmes quand
 * le jeton arrive ou se renouvelle.
 */

/** Renouvellement cinq minutes avant l'expiration. */
const REFRESH_MARGIN_MS = 5 * 60 * 1000

const api = createApiClient({ baseURL: API_URL })

const current = ref<{ token: string; expiresAt: number } | null>(null)
let inFlight: Promise<void> | null = null
let refreshTimer: ReturnType<typeof setTimeout> | undefined
/** API antérieure au jeton de lecture : on retombe sur le jeton d'accès. */
let legacyApi = false

function isFresh(): boolean {
  return current.value !== null && current.value.expiresAt - Date.now() > REFRESH_MARGIN_MS
}

/** Obtient (ou renouvelle) le jeton ; sans effet s'il est encore frais. */
export function ensureAttachmentToken(): Promise<void> {
  if (isFresh() || legacyApi) return Promise.resolve()
  if (inFlight) return inFlight

  inFlight = api
    .post<{ token?: string; expiresIn?: number }>('/api/messaging/attachment-token')
    .then(({ data }) => {
      if (!data?.token || !data.expiresIn) return
      const lifetimeMs = data.expiresIn * 1000
      current.value = { token: data.token, expiresAt: Date.now() + lifetimeMs }
      clearTimeout(refreshTimer)
      refreshTimer = setTimeout(() => void ensureAttachmentToken(), Math.max(lifetimeMs - REFRESH_MARGIN_MS, 0))
    })
    .catch((error: { response?: { status?: number } }) => {
      if (error?.response?.status === 404) legacyApi = true
    })
    .finally(() => {
      inFlight = null
    })
  return inFlight
}

/**
 * Paramètre `?token=` à ajouter à l'URL d'une pièce jointe, vide tant que le
 * jeton n'est pas arrivé (sa demande est alors lancée).
 */
export function attachmentTokenParam(): string {
  if (legacyApi) {
    const accessToken = getAccessToken()
    return accessToken ? `?token=${encodeURIComponent(accessToken)}` : ''
  }
  const token = current.value && current.value.expiresAt > Date.now() ? current.value.token : null
  if (!isFresh()) void ensureAttachmentToken()
  return token ? `?token=${encodeURIComponent(token)}` : ''
}
