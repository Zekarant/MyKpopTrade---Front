import { afterEach, describe, expect, it, vi } from 'vitest'

/** Résolution de l'URL de l'API au chargement du module. */

async function loadApiUrl() {
  vi.resetModules()
  const { API_URL } = await import('../api')
  return API_URL
}

describe('API_URL', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('utilise VITE_API_URL quand elle est définie', async () => {
    vi.stubEnv('VITE_API_URL', 'https://api.mykpoptrade.test')

    await expect(loadApiUrl()).resolves.toBe('https://api.mykpoptrade.test')
  })

  it('retombe sur localhost hors production', async () => {
    vi.stubEnv('VITE_API_URL', '')
    vi.stubEnv('VITE_API_BASE_URL', '')
    vi.stubEnv('PROD', false)

    await expect(loadApiUrl()).resolves.toBe('http://localhost:3000')
  })

  it('refuse de démarrer en production sans VITE_API_URL', async () => {
    vi.stubEnv('VITE_API_URL', '')
    vi.stubEnv('VITE_API_BASE_URL', '')
    vi.stubEnv('PROD', true)

    await expect(loadApiUrl()).rejects.toThrow('VITE_API_URL')
  })
})
