import Cookies from 'js-cookie';

/**
 * Gestion du consentement aux cookies (RGPD / ePrivacy, recommandations CNIL).
 *
 * Principes appliqués :
 * - aucun traceur non essentiel n'est déposé avant un choix explicite ;
 * - refuser est aussi simple qu'accepter (un seul clic, même niveau) ;
 * - le choix est conservé 6 mois, puis le bandeau est réaffiché.
 *
 * Le nom et la durée du cookie sont ceux annoncés dans la politique cookies
 * (`src/views/legal/Cookies.vue`) : les deux doivent rester alignés.
 */

/** Nom du cookie de consentement, tel que documenté dans la politique cookies. */
const CONSENT_COOKIE = 'cookie_consent';

/** Durée de conservation du choix, en jours (6 mois — recommandation CNIL). */
const CONSENT_DURATION_DAYS = 183;

/** Version du périmètre de consentement. À incrémenter si les finalités changent. */
const CONSENT_VERSION = 1;

/** Identifiant du conteneur Google Tag Manager. */
const GTM_CONTAINER_ID = 'GTM-MPKHHGS2';

export interface CookieConsent {
  /** Mesure d'audience (Google Tag Manager / Google Analytics). */
  analytics: boolean;
  /** Version du périmètre au moment du choix. */
  version: number;
  /** Date ISO du choix, conservée comme preuve du consentement. */
  decidedAt: string;
}

/** Entrée poussée dans le dataLayer de Google Tag Manager. */
type DataLayerEvent = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: DataLayerEvent[];
  }
}

/** Diffuse les changements de consentement (bandeau ↔ pied de page). */
const listeners = new Set<(consent: CookieConsent | null) => void>();

let analyticsLoaded = false;

/** Rend le choix enregistré, ou `null` si l'utilisateur n'a pas encore décidé. */
export function getConsent(): CookieConsent | null {
  const raw = Cookies.get(CONSENT_COOKIE);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsent>;
    // Un choix exprimé sur un périmètre obsolète doit être redemandé.
    if (parsed.version !== CONSENT_VERSION) return null;
    return {
      analytics: parsed.analytics === true,
      version: CONSENT_VERSION,
      decidedAt: parsed.decidedAt ?? new Date().toISOString()
    };
  } catch {
    // Cookie corrompu : on repart d'un consentement non exprimé.
    return null;
  }
}

/** Indique si l'utilisateur a déjà fait un choix valide. */
export function hasDecided(): boolean {
  return getConsent() !== null;
}

/**
 * Enregistre le choix et applique immédiatement ses conséquences.
 * Accepter charge la mesure d'audience ; refuser ne charge rien.
 */
export function setConsent(choice: { analytics: boolean }): CookieConsent {
  const consent: CookieConsent = {
    analytics: choice.analytics,
    version: CONSENT_VERSION,
    decidedAt: new Date().toISOString()
  };

  Cookies.set(CONSENT_COOKIE, JSON.stringify(consent), {
    expires: CONSENT_DURATION_DAYS,
    sameSite: 'Lax',
    secure: window.location.protocol === 'https:'
  });

  applyConsent(consent);
  listeners.forEach((listener) => listener(consent));

  return consent;
}

/**
 * Retire le choix enregistré pour réafficher le bandeau.
 * Les traceurs déjà chargés le restent jusqu'au prochain chargement de page :
 * on ne peut pas « décharger » un script tiers, seulement ne plus le charger.
 */
export function resetConsent(): void {
  Cookies.remove(CONSENT_COOKIE);
  listeners.forEach((listener) => listener(null));
}

/** S'abonne aux changements de consentement. Rend la fonction de désabonnement. */
export function onConsentChange(listener: (consent: CookieConsent | null) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Applique un consentement déjà enregistré (appelé au démarrage de l'application).
 * Sans consentement analytics, aucun script de mesure n'est injecté.
 */
export function applyStoredConsent(): void {
  const consent = getConsent();
  if (consent) applyConsent(consent);
}

function applyConsent(consent: CookieConsent): void {
  if (consent.analytics) loadGoogleTagManager();
}

/**
 * Injecte Google Tag Manager. Idempotent : plusieurs appels ne chargent qu'une
 * fois le conteneur.
 */
function loadGoogleTagManager(): void {
  if (analyticsLoaded) return;
  analyticsLoaded = true;

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_CONTAINER_ID}`;
  document.head.appendChild(script);
}
