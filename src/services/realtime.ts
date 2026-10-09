/**
 * Client temps réel : lit le flux Server-Sent Events de l'API
 * (GET /api/realtime/stream).
 *
 * EventSource ne sait pas envoyer d'en-tête `Authorization` : le flux est lu
 * avec fetch + ReadableStream, et le format SSE est analysé ici. Le serveur
 * ferme le flux à l'expiration du token d'accès (15 min) ; le client se
 * reconnecte alors avec un token frais, avec un backoff exponentiel en cas
 * d'échec. Les événements manqués pendant une coupure ne sont pas rejoués :
 * le serveur renvoie les compteurs de non-lus (`unread:update`) à chaque ouverture.
 */

export interface SseEvent {
  event: string;
  data: string;
}

/**
 * Analyseur SSE incrémental (sous-ensemble de la spécification WHATWG utile
 * ici) : les morceaux reçus coupent les lignes n'importe où. Les champs `id`
 * et `retry` sont ignorés : le serveur ne rejoue rien et le client a son
 * propre backoff.
 */
export function createSseParser(onEvent: (event: SseEvent) => void): (chunk: string) => void {
  let buffer = '';
  let eventName = '';
  let dataLines: string[] = [];

  function dispatch(): void {
    // Un bloc sans `data` (battement de cœur, `retry:` seul) n'est pas un événement.
    if (dataLines.length > 0) {
      onEvent({ event: eventName || 'message', data: dataLines.join('\n') });
    }
    eventName = '';
    dataLines = [];
  }

  function processLine(line: string): void {
    if (line === '') {
      dispatch();
      return;
    }
    if (line.startsWith(':')) return;

    const colon = line.indexOf(':');
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? '' : line.slice(colon + 1);
    if (value.startsWith(' ')) value = value.slice(1);

    if (field === 'event') eventName = value;
    else if (field === 'data') dataLines.push(value);
  }

  return (chunk: string) => {
    buffer += chunk;
    // Un \r en fin de morceau peut être la moitié d'un \r\n : on attend la suite.
    const hasPendingCr = buffer.endsWith('\r');
    const lines = (hasPendingCr ? buffer.slice(0, -1) : buffer).split(/\r\n|\r|\n/);
    buffer = (lines.pop() ?? '') + (hasPendingCr ? '\r' : '');
    lines.forEach(processLine);
  };
}

export const RECONNECT_BASE_DELAY_MS = 1000;
export const RECONNECT_MAX_DELAY_MS = 30_000;

/**
 * Délai avant la tentative n° `attempt` (0 = première) : exponentiel plafonné,
 * avec une gigue sur la moitié haute (« equal jitter ») pour que tous les
 * onglets coupés en même temps (redémarrage de l'API) ne reviennent pas ensemble.
 */
export function computeReconnectDelay(attempt: number, random: () => number = Math.random): number {
  const ceiling = Math.min(RECONNECT_MAX_DELAY_MS, RECONNECT_BASE_DELAY_MS * 2 ** attempt);
  return ceiling / 2 + random() * (ceiling / 2);
}

export interface RealtimeMessage {
  event: string;
  data: unknown;
}

export interface RealtimeClientOptions {
  url: string;
  /** Token d'accès utilisable (renouvelé si le cookie a expiré), `null` sans session. */
  getToken: () => Promise<string | null>;
  /** Renouvellement forcé après un 401 ; `null` si la session est perdue. */
  refreshToken: () => Promise<string | null>;
  onEvent: (message: RealtimeMessage) => void;
  fetchImpl?: typeof fetch;
  random?: () => number;
}

export interface RealtimeClient {
  start(): void;
  stop(): void;
  isRunning(): boolean;
}

/** Issue d'une connexion : réessayer plus tard, tout de suite, ou abandonner. */
type ConnectionOutcome = 'backoff' | 'immediate' | 'stop';

export function createRealtimeClient(options: RealtimeClientOptions): RealtimeClient {
  const fetchImpl = options.fetchImpl ?? ((input, init) => fetch(input, init));
  const random = options.random ?? Math.random;

  let isRunning = false;
  let generation = 0;
  let attempt = 0;
  let hasJustRefreshed = false;
  let abortController: AbortController | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  const parse = createSseParser(({ event, data }) => {
    try {
      options.onEvent({ event, data: JSON.parse(data) });
    } catch {
      // Données illisibles (ou gestionnaire en échec) : on ignore cet événement, pas le flux.
    }
  });

  async function readStream(body: ReadableStream<Uint8Array>): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return;
      parse(decoder.decode(value, { stream: true }));
    }
  }

  async function connect(runGeneration: number): Promise<ConnectionOutcome> {
    const token = await options.getToken();
    if (!token) return 'stop';
    if (!isRunning || runGeneration !== generation) return 'stop';

    abortController = new AbortController();
    const response = await fetchImpl(options.url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
      signal: abortController.signal,
      cache: 'no-store'
    });

    if (response.status === 401) {
      // Un token tout juste renouvelé est refusé : la session n'est plus valable.
      if (hasJustRefreshed) return 'stop';
      hasJustRefreshed = true;
      return (await options.refreshToken()) ? 'immediate' : 'stop';
    }
    hasJustRefreshed = false;
    // Compte suspendu ou supprimé : réessayer ne changera rien.
    if (response.status === 403) return 'stop';
    if (!response.ok || !response.body) return 'backoff';

    attempt = 0;
    await readStream(response.body);
    // Fin normale : expiration du token ou redémarrage de l'API.
    return 'backoff';
  }

  async function run(): Promise<void> {
    retryTimer = null;
    const runGeneration = generation;
    let outcome: ConnectionOutcome;
    try {
      outcome = await connect(runGeneration);
    } catch {
      // Réseau coupé, API injoignable, ou abandon volontaire (stop).
      outcome = 'backoff';
    }
    // Arrêté (ou arrêté puis relancé, pour un autre compte) pendant l'attente :
    // cette boucle n'a plus la main.
    if (!isRunning || runGeneration !== generation) return;

    if (outcome === 'stop') {
      stop();
      return;
    }
    const delayMs = outcome === 'immediate' ? 0 : computeReconnectDelay(attempt++, random);
    retryTimer = setTimeout(() => void run(), delayMs);
  }

  function start(): void {
    if (isRunning) return;
    isRunning = true;
    generation += 1;
    attempt = 0;
    hasJustRefreshed = false;
    void run();
  }

  function stop(): void {
    isRunning = false;
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = null;
    abortController?.abort();
    abortController = null;
  }

  return { start, stop, isRunning: () => isRunning };
}
