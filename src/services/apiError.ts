import axios, { type AxiosResponse } from 'axios';

/** Corps d'une réponse d'erreur de l'API. */
export interface ApiErrorBody {
  message?: string;
  code?: string;
}

/** Réponse d'erreur portée par une erreur axios, sinon `undefined`. */
export function apiErrorResponse(error: unknown): AxiosResponse<ApiErrorBody> | undefined {
  return axios.isAxiosError<ApiErrorBody>(error) ? error.response : undefined;
}

/** Message d'erreur renvoyé par l'API, sinon `fallback`. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  return apiErrorResponse(error)?.data?.message || fallback;
}
