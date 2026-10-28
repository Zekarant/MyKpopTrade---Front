/**
 * URL de base de l'API, centralisée pour éviter les duplications.
 * Utilise VITE_API_URL (ou VITE_API_BASE_URL pour rétrocompat).
 *
 * Le repli sur localhost n'existe qu'en développement et en test : en
 * production, un build sans VITE_API_URL partait silencieusement interroger
 * http://localhost:3000 sur la machine du visiteur, et l'application semblait
 * simplement « vide ». On préfère échouer au démarrage avec un message explicite.
 */
function resolveApiUrl(): string {
  const configured = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (configured) {
    return configured;
  }
  if (import.meta.env.PROD) {
    throw new Error(
      'VITE_API_URL est absente du build de production : définissez-la (cf. .env.example) puis relancez `vite build`.'
    );
  }
  return 'http://localhost:3000';
}

export const API_URL: string = resolveApiUrl();
