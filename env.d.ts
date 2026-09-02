/// <reference types="vite/client" />

/**
 * Helpers exposés globalement via `app.config.globalProperties.$func`
 * (cf. src/main.ts et src/function.js). Sans cette déclaration, `this.$func`
 * et `proxy.$func` sont implicitement `any` dans les composants TypeScript.
 */
export interface AppHelpers {
  /** Toast vert — une action a abouti. */
  showToastSuccess(message: unknown): void
  /** Toast rouge — une action a échoué. */
  showToastError(message: unknown): void
  /** Toast bleu — information neutre, sans succès ni échec. */
  showToastInfo(message: unknown): void
  /** Construit le slug combiné utilisé par la route de recherche. */
  buildCombinedSlug(query?: string | null, event?: string | null): string
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $func: AppHelpers
  }
}
