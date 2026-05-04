/**
 * URL de base de l'API, centralisée pour éviter les duplications.
 * Utilise VITE_API_URL (ou VITE_API_BASE_URL pour rétrocompat) avec fallback localhost.
 */
export const API_URL: string =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:3000';
