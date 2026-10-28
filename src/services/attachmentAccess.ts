import { ref } from 'vue'
import { getAccessToken } from '@/services/http'
import { apiClient } from '@/services/apiClient'
import { apiErrorStatus } from '@/services/apiError'

/**
 * Jeton de lecture des pièces jointes, placé dans leurs URL (`<img src>` ne porte pas d'en-tête).
 * Distinct du jeton d'accès : une adresse d'image partagée n'ouvre pas le compte.
 */

const REFRESH_MARGIN_MS = 5 * 60 * 1000

const api = apiClient()

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
    .catch((error: unknown) => {
      if (apiErrorStatus(error) === 404) legacyApi = true
    })
    .finally(() => {
      inFlight = null
    })
  return inFlight
}

/** Paramètre `?token=` d'une URL de pièce jointe ; vide (et demande lancée) tant que le jeton manque. */
export function attachmentTokenParam(): string {
  if (legacyApi) {
    const accessToken = getAccessToken()
    return accessToken ? `?token=${encodeURIComponent(accessToken)}` : ''
  }
  const token = current.value && current.value.expiresAt > Date.now() ? current.value.token : null
  if (!isFresh()) void ensureAttachmentToken()
  return token ? `?token=${encodeURIComponent(token)}` : ''
}
