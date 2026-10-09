// @vitest-environment node
// Aucun DOM utile ici, et jsdom ne fournit pas ReadableStream (corps des réponses fetch).
import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'
import {
  createSseParser,
  computeReconnectDelay,
  createRealtimeClient,
  RECONNECT_MAX_DELAY_MS,
  type SseEvent,
  type RealtimeClientOptions,
  type RealtimeMessage
} from '../realtime'

/** Client SSE : analyse du flux, reconnexion avec backoff, renouvellement du token. */

function parseAll(chunks: string[]): SseEvent[] {
  const events: SseEvent[] = []
  const push = createSseParser((event) => events.push(event))
  chunks.forEach(push)
  return events
}

describe('createSseParser', () => {
  it('lit un événement nommé', () => {
    expect(parseAll(['event: unread:update\ndata: {"messages":1}\n\n']))
      .toEqual([{ event: 'unread:update', data: '{"messages":1}' }])
  })

  it('reconstitue un événement coupé n\'importe où, y compris au milieu d\'un \\r\\n', () => {
    expect(parseAll(['eve', 'nt: message:new\r', '\ndata: {"a"', ':1}\r\n\r', '\n']))
      .toEqual([{ event: 'message:new', data: '{"a":1}' }])
  })

  it('ignore les commentaires et les blocs sans données (battement, retry)', () => {
    expect(parseAll(['retry: 5000\n\n: heartbeat\n\n'])).toEqual([])
  })

  it('joint les lignes data multiples et nomme « message » un événement sans nom', () => {
    expect(parseAll(['data: un\ndata:deux\n\n'])).toEqual([{ event: 'message', data: 'un\ndeux' }])
  })

  it('sépare plusieurs événements d\'un même morceau', () => {
    expect(parseAll(['event: a\ndata: 1\n\nevent: b\ndata: 2\n\n']).map((e) => e.event)).toEqual(['a', 'b'])
  })
})

describe('computeReconnectDelay', () => {
  it('double à chaque tentative, avec une gigue sur la moitié haute', () => {
    expect(computeReconnectDelay(0, () => 0)).toBe(500)
    expect(computeReconnectDelay(0, () => 1)).toBe(1000)
    expect(computeReconnectDelay(3, () => 1)).toBe(8000)
  })

  it('plafonne à 30 s', () => {
    expect(computeReconnectDelay(20, () => 1)).toBe(RECONNECT_MAX_DELAY_MS)
    expect(computeReconnectDelay(20, () => 0)).toBe(RECONNECT_MAX_DELAY_MS / 2)
  })
})

type FakeResponse = { status: number; ok: boolean; body: ReadableStream<Uint8Array> | null }

/** Réponse simulée : `chunks` puis fin du flux, ou flux laissé ouvert. */
function aResponse(status: number, chunks: string[] = [], { keepOpen = false } = {}): FakeResponse {
  const encoder = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)))
      if (!keepOpen) controller.close()
    }
  })
  return { status, ok: status >= 200 && status < 300, body }
}

describe('createRealtimeClient', () => {
  let fetchImpl: ReturnType<typeof vi.fn>
  let options: RealtimeClientOptions & { onEvent: Mock<(message: RealtimeMessage) => void> }

  const authorizationOfCall = (index: number) =>
    (fetchImpl.mock.calls[index][1] as RequestInit & { headers: Record<string, string> }).headers.Authorization

  beforeEach(() => {
    vi.useFakeTimers()
    fetchImpl = vi.fn()
    options = {
      url: 'http://api/realtime/stream',
      getToken: vi.fn(async () => 'token-1'),
      refreshToken: vi.fn(async () => 'token-2'),
      onEvent: vi.fn<(message: RealtimeMessage) => void>(),
      fetchImpl: fetchImpl as unknown as typeof fetch,
      // Gigue au maximum : délais exacts 1 s, 2 s, 4 s...
      random: () => 1
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('transmet les événements du flux, données JSON décodées, avec le token en en-tête', async () => {
    fetchImpl.mockResolvedValueOnce(aResponse(200, ['event: unread:update\ndata: {"messages":2,"notifications":1}\n\n'], { keepOpen: true }))
    const client = createRealtimeClient(options)

    client.start()
    await vi.advanceTimersByTimeAsync(0)

    expect(authorizationOfCall(0)).toBe('Bearer token-1')
    expect(options.onEvent).toHaveBeenCalledWith({ event: 'unread:update', data: { messages: 2, notifications: 1 } })
    client.stop()
  })

  it('se reconnecte avec un délai qui double à chaque échec', async () => {
    fetchImpl.mockResolvedValue(aResponse(503))
    const client = createRealtimeClient(options)

    client.start()
    await vi.advanceTimersByTimeAsync(0)
    expect(fetchImpl).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(999)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(fetchImpl).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(2000)
    expect(fetchImpl).toHaveBeenCalledTimes(3)
    await vi.advanceTimersByTimeAsync(4000)
    expect(fetchImpl).toHaveBeenCalledTimes(4)
    client.stop()
  })

  it('repart du délai minimal après une connexion réussie (fin du flux à l\'expiration du token)', async () => {
    fetchImpl
      .mockResolvedValueOnce(aResponse(503))
      .mockResolvedValueOnce(aResponse(503))
      .mockResolvedValueOnce(aResponse(200))
      .mockResolvedValue(aResponse(200, [], { keepOpen: true }))
    const client = createRealtimeClient(options)

    client.start()
    await vi.advanceTimersByTimeAsync(1000 + 2000)
    expect(fetchImpl).toHaveBeenCalledTimes(3)

    await vi.advanceTimersByTimeAsync(1000)
    expect(fetchImpl).toHaveBeenCalledTimes(4)
    client.stop()
  })

  it('renouvelle le token sur un 401 puis se reconnecte aussitôt', async () => {
    vi.mocked(options.getToken).mockResolvedValueOnce('expired').mockResolvedValue('token-2')
    fetchImpl
      .mockResolvedValueOnce(aResponse(401))
      .mockResolvedValueOnce(aResponse(200, [], { keepOpen: true }))
    const client = createRealtimeClient(options)

    client.start()
    await vi.advanceTimersByTimeAsync(0)

    expect(options.refreshToken).toHaveBeenCalledTimes(1)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(authorizationOfCall(1)).toBe('Bearer token-2')
    client.stop()
  })

  it('s\'arrête quand la session ne peut pas être renouvelée', async () => {
    vi.mocked(options.refreshToken).mockResolvedValue(null)
    fetchImpl.mockResolvedValue(aResponse(401))
    const client = createRealtimeClient(options)

    client.start()
    await vi.advanceTimersByTimeAsync(60_000)

    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(client.isRunning()).toBe(false)
  })

  it('s\'arrête si même un token tout juste renouvelé est refusé', async () => {
    fetchImpl.mockResolvedValue(aResponse(401))
    const client = createRealtimeClient(options)

    client.start()
    await vi.advanceTimersByTimeAsync(60_000)

    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(client.isRunning()).toBe(false)
  })

  it('ne se connecte pas sans session', async () => {
    vi.mocked(options.getToken).mockResolvedValue(null)
    const client = createRealtimeClient(options)

    client.start()
    await vi.advanceTimersByTimeAsync(60_000)

    expect(fetchImpl).not.toHaveBeenCalled()
    expect(client.isRunning()).toBe(false)
  })

  it('stop() annule la reconnexion programmée', async () => {
    fetchImpl.mockRejectedValue(new TypeError('Failed to fetch'))
    const client = createRealtimeClient(options)

    client.start()
    await vi.advanceTimersByTimeAsync(0)
    client.stop()
    await vi.advanceTimersByTimeAsync(60_000)

    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('ignore un événement aux données illisibles sans couper le flux', async () => {
    fetchImpl.mockResolvedValueOnce(aResponse(200, ['data: pas du json\n\n', 'event: ok\ndata: 1\n\n'], { keepOpen: true }))
    const client = createRealtimeClient(options)

    client.start()
    await vi.advanceTimersByTimeAsync(0)

    expect(options.onEvent).toHaveBeenCalledTimes(1)
    expect(options.onEvent).toHaveBeenCalledWith({ event: 'ok', data: 1 })
    client.stop()
  })
})
