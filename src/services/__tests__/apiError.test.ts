import { describe, it, expect } from 'vitest'
import { AxiosError, type AxiosResponse } from 'axios'
import {
  ApiError,
  NETWORK_ERROR_CODE,
  apiErrorBody,
  apiErrorCode,
  apiErrorMessage,
  apiErrorStatus,
  toApiError
} from '../apiError'

/** Normalisation des erreurs : corps à plat de l'API → ApiError, lecteurs tolérants aux erreurs brutes. */

function axiosError(status: number, data?: unknown) {
  return new AxiosError('Request failed', 'ERR_BAD_RESPONSE', undefined, null, { status, data } as AxiosResponse)
}

describe('toApiError', () => {
  it('lit le corps à plat : message, code, détails et requestId', () => {
    const error = toApiError(axiosError(409, {
      message: 'Article déjà vendu',
      code: 'PRODUCT_SOLD',
      productId: 'p1',
      requestId: 'req-42'
    }))

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toBeInstanceOf(Error)
    expect(error).toMatchObject({
      status: 409,
      code: 'PRODUCT_SOLD',
      message: 'Article déjà vendu',
      serverMessage: 'Article déjà vendu',
      requestId: 'req-42',
      details: { productId: 'p1' }
    })
    expect(error.body).toEqual({ message: 'Article déjà vendu', code: 'PRODUCT_SOLD', productId: 'p1', requestId: 'req-42' })
  })

  it('donne un message affichable quand l\'API n\'en fournit pas', () => {
    const error = toApiError(axiosError(500))

    expect(error.status).toBe(500)
    expect(error.serverMessage).toBeUndefined()
    expect(error.message).toBe('Une erreur est survenue.')
  })

  it('signale une coupure réseau, sans statut', () => {
    const error = toApiError(new AxiosError('Network Error', 'ERR_NETWORK'))

    expect(error.status).toBeUndefined()
    expect(error.code).toBe(NETWORK_ERROR_CODE)
    expect(error.message).toContain('Impossible de joindre le serveur')
  })

  it('préfère le repli de l\'appelant au message technique, jamais à celui de l\'API', () => {
    expect(toApiError(axiosError(500), 'Connexion impossible.').message).toBe('Connexion impossible.')
    expect(toApiError(axiosError(401, { message: 'Identifiants invalides' }), 'Connexion impossible.').message)
      .toBe('Identifiants invalides')
    expect(toApiError(new Error('boom'), 'Connexion impossible.').message).toBe('Connexion impossible.')
  })

  it('rend une ApiError telle quelle, ou avec le repli si elle n\'a pas de message serveur', () => {
    const withMessage = toApiError(axiosError(400, { message: 'Prix invalide', code: 'VALIDATION_ERROR' }))
    expect(toApiError(withMessage, 'Repli')).toBe(withMessage)

    const silent = toApiError(axiosError(503))
    const relabelled = toApiError(silent, 'Service indisponible')
    expect(relabelled.message).toBe('Service indisponible')
    expect(relabelled.status).toBe(503)
  })
})

describe('lecteurs d\'erreur', () => {
  const apiError = toApiError(axiosError(403, { message: 'Bloqué', code: 'BLOCKED' }))
  // Forme simulée par les tests des écrans qui appellent encore createApiClient directement.
  const rawLike = { response: { status: 404, data: { message: 'Introuvable', code: 'NOT_FOUND' } } }

  it('comprennent une ApiError', () => {
    expect(apiErrorStatus(apiError)).toBe(403)
    expect(apiErrorCode(apiError)).toBe('BLOCKED')
    expect(apiErrorMessage(apiError, 'Repli')).toBe('Bloqué')
    expect(apiErrorBody(apiError)).toEqual({ message: 'Bloqué', code: 'BLOCKED' })
  })

  it('comprennent une erreur axios brute', () => {
    expect(apiErrorStatus(rawLike)).toBe(404)
    expect(apiErrorCode(rawLike)).toBe('NOT_FOUND')
    expect(apiErrorMessage(rawLike, 'Repli')).toBe('Introuvable')
  })

  it('rendent le repli ou rien pour une erreur sans réponse', () => {
    const network = toApiError(new AxiosError('Network Error', 'ERR_NETWORK'))

    expect(apiErrorMessage(network, 'Repli')).toBe('Repli')
    expect(apiErrorMessage(new Error('boom'), 'Repli')).toBe('Repli')
    expect(apiErrorBody(network)).toBeUndefined()
    expect(apiErrorStatus(null)).toBeUndefined()
  })
})
