/**
 * Erreurs de l'API, sous une forme unique pour toute l'application.
 *
 * L'API répond à toute erreur par un corps à plat :
 * `{ message, code?, ...détails, requestId? }`. Les services la rejettent sous
 * forme d'`ApiError` (cf. `apiClient`) : les appelants lisent `status`, `code`
 * ou les détails sans fouiller une erreur axios, et `message` est toujours
 * affichable — celui de l'API, sinon un texte de repli en français.
 *
 * Les lecteurs (`apiErrorMessage`, `apiErrorStatus`...) acceptent aussi une
 * erreur axios brute : quelques écrans appellent encore `createApiClient`
 * directement, et leurs tests simulent des rejets `{ response: { status, data } }`.
 */

/** Corps d'erreur de l'API. Les détails (`errors`, `approvalUrl`...) dépendent du code. */
export interface ApiErrorBody {
  message?: string;
  code?: string;
  requestId?: string;
  [detail: string]: unknown;
}

/** Code posé quand aucune réponse n'est arrivée (réseau coupé, API injoignable, délai dépassé). */
export const NETWORK_ERROR_CODE = 'NETWORK_ERROR';

const DEFAULT_MESSAGE = 'Une erreur est survenue.';
const NETWORK_MESSAGE = 'Impossible de joindre le serveur. Vérifiez votre connexion.';

interface ApiErrorInit {
  message: string;
  status?: number;
  code?: string;
  body?: ApiErrorBody;
  cause?: unknown;
}

export class ApiError extends Error {
  override name = 'ApiError';
  /** Statut HTTP ; absent quand aucune réponse n'est arrivée. */
  readonly status?: number;
  readonly code?: string;
  readonly requestId?: string;
  /** Message rédigé par l'API, prêt à afficher ; absent si elle n'en a fourni aucun. */
  readonly serverMessage?: string;
  /** Champs du corps autres que `message`, `code` et `requestId`. */
  readonly details: Readonly<Record<string, unknown>>;
  /** Erreur d'origine (axios), pour le débogage. */
  readonly cause?: unknown;

  constructor({ message, status, code, body, cause }: ApiErrorInit) {
    super(message);
    const { message: serverMessage, code: bodyCode, requestId, ...details } = body ?? {};
    this.cause = cause;
    this.status = status;
    this.code = typeof bodyCode === 'string' ? bodyCode : code;
    this.requestId = typeof requestId === 'string' ? requestId : undefined;
    this.serverMessage = typeof serverMessage === 'string' && serverMessage ? serverMessage : undefined;
    this.details = details;
  }

  /** Corps tel que l'API l'a renvoyé, sans les clés absentes. */
  get body(): ApiErrorBody {
    const body: ApiErrorBody = { ...this.details };
    if (this.serverMessage) body.message = this.serverMessage;
    if (this.code) body.code = this.code;
    if (this.requestId) body.requestId = this.requestId;
    return body;
  }
}

interface ResponseLike {
  status?: number;
  data?: unknown;
}

/** Réponse portée par une erreur axios (ou un double de test qui en a la forme). */
function responseOf(error: unknown): ResponseLike | undefined {
  const response = (error as { response?: unknown } | null)?.response;
  return response && typeof response === 'object' ? (response as ResponseLike) : undefined;
}

function isBody(data: unknown): data is ApiErrorBody {
  return Boolean(data) && typeof data === 'object' && !(data instanceof Blob);
}

/**
 * Convertit n'importe quelle erreur en `ApiError`. Une `ApiError` est rendue
 * telle quelle ; `fallback` remplace alors le message seulement quand l'API
 * n'en a fourni aucun (même règle que pour une erreur brute).
 */
export function toApiError(error: unknown, fallback?: string): ApiError {
  if (error instanceof ApiError) {
    if (!fallback || error.serverMessage) return error;
    return new ApiError({ message: fallback, status: error.status, code: error.code, body: error.body, cause: error.cause });
  }

  const response = responseOf(error);
  if (response) {
    const body = isBody(response.data) ? response.data : undefined;
    const serverMessage = typeof body?.message === 'string' ? body.message : '';
    return new ApiError({
      message: serverMessage || fallback || DEFAULT_MESSAGE,
      status: typeof response.status === 'number' ? response.status : undefined,
      body,
      cause: error
    });
  }

  if ((error as { isAxiosError?: unknown } | null)?.isAxiosError === true) {
    return new ApiError({ message: fallback || NETWORK_MESSAGE, code: NETWORK_ERROR_CODE, cause: error });
  }

  // Erreur levée hors réseau (validation locale, code applicatif) : le repli
  // de l'appelant prime, comme le faisaient les services avant normalisation.
  const message = fallback || (error instanceof Error && error.message) || DEFAULT_MESSAGE;
  return new ApiError({ message, cause: error });
}

/**
 * Corps d'erreur de l'API, ou `undefined` pour une erreur sans réponse.
 * `T` précise les détails attendus pour un code donné (`approvalUrl`...).
 */
export function apiErrorBody<T = ApiErrorBody>(error: unknown): T | undefined {
  if (error instanceof ApiError) return error.status === undefined ? undefined : (error.body as T);
  const data = responseOf(error)?.data;
  return isBody(data) ? (data as T) : undefined;
}

/** Statut HTTP de l'erreur, `undefined` sans réponse. */
export function apiErrorStatus(error: unknown): number | undefined {
  if (error instanceof ApiError) return error.status;
  const status = responseOf(error)?.status;
  return typeof status === 'number' ? status : undefined;
}

/** Code métier renvoyé par l'API (`BLOCKED`, `TOKEN_EXPIRED`...). */
export function apiErrorCode(error: unknown): string | undefined {
  if (error instanceof ApiError) return error.code;
  const code = apiErrorBody(error)?.code;
  return typeof code === 'string' ? code : undefined;
}

/** Message d'erreur renvoyé par l'API, sinon `fallback`. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.serverMessage || fallback;
  const message = apiErrorBody(error)?.message;
  return (typeof message === 'string' && message) || fallback;
}
