import { API_URL } from '@/config/api'

type Verb = 'get' | 'post' | 'put' | 'patch' | 'delete'
type FakeHttp = Partial<Record<Verb, (url: string, ...rest: unknown[]) => unknown>>

/**
 * Remplace `createApiClient` dans les tests de vues : tous les clients des
 * services renvoient leurs appels vers les mêmes fonctions simulées, avec le
 * chemin complet (`/api/auth/profile`, base du service comprise). Les tests
 * vérifient ainsi la vraie route, quel que soit le service qui l'appelle.
 *
 *   vi.mock('@/services/http', async () => ({
 *     createApiClient: (await import('@/test-utils/routedApiClient')).routedApiClient(http)
 *   }))
 */
export function routedApiClient(http: FakeHttp) {
  return ({ baseURL = '' }: { baseURL?: string } = {}) => {
    const prefix = baseURL.startsWith(API_URL) ? baseURL.slice(API_URL.length) : baseURL
    const route = (verb: Verb) => (url = '', ...rest: unknown[]) => {
      const call = http[verb]
      if (!call) throw new Error(`${verb.toUpperCase()} ${prefix}${url} : non simulé dans ce test`)
      return call(`${prefix}${url}`, ...rest)
    }
    return { get: route('get'), post: route('post'), put: route('put'), patch: route('patch'), delete: route('delete') }
  }
}
