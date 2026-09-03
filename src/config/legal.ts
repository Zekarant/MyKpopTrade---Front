export type PublisherType = 'individual' | 'soleTrader' | 'company'

export const publisherType: PublisherType = 'individual'

export interface LegalIdentity {
  /** Nom du service, tel qu'il apparaît dans les documents. */
  siteName: string
  /** URL publique canonique, sans slash final. */
  siteUrl: string

  /**
   * Éditeur. Pour une personne physique : « Prénom NOM ». Pour une société :
   * la dénomination sociale exacte figurant sur le Kbis.
   */
  companyName: string
  /** Forme juridique : SAS, SARL, micro-entreprise… Sans objet pour un particulier. */
  legalForm: string
  /** Capital social, ex. « 1 000 € ». Sans objet hors société. */
  capital: string
  /** Adresse de contact de l'éditeur (siège social, ou domicile pour un particulier). */
  headquarters: string
  /** Ville du greffe d'immatriculation. Sans objet tant qu'il n'y a pas d'immatriculation. */
  rcsCity: string
  /** Numéro SIREN ou SIRET. Sans objet tant qu'il n'y a pas d'immatriculation. */
  siren: string
  /** N° de TVA intracommunautaire, ou « Non assujetti ». */
  vatNumber: string
  /** Directeur de la publication (représentant légal, ou l'éditeur lui-même). */
  publicationDirector: string
  /** Email de contact général. Sert aussi de point de contact unique au sens du DSA. */
  contactEmail: string
  /** Email dédié à l'exercice des droits RGPD. */
  dpoEmail: string
  /** Ville du tribunal compétent (ressort du domicile ou du siège de l'éditeur). */
  courtCity: string

  /** Hébergeur : nom, adresse, téléphone (art. 6-III-1 LCEN). */
  hostName: string
  hostAddress: string
  hostPhone: string

  /** Concepteur / développeur du site. */
  designer: string

  /** Médiateur de la consommation : nom, adresse, site. */
  mediatorName: string
  mediatorAddress: string
  mediatorWebsite: string
}

export const legalIdentity: LegalIdentity = {
  siteName: 'MyKpopTrade',
  siteUrl: 'https://mykpoptrade.com',
  companyName: 'MyKpopTrade',
  headquarters: 'Saint-Etienne, 42100',
  publicationDirector: 'CHOMEL Colin, THOMAS Yannis',
  courtCity: 'France',

  // Sans objet tant que l'activité n'est pas immatriculée : `legalApplies()`
  // masque ces lignes. À remplir le jour de l'immatriculation, en basculant
  // `publisherType` ci-dessus.
  legalForm: '',
  capital: '',
  rcsCity: '',
  siren: '',
  vatNumber: '',

  // ── Contacts ───────────────────────────────────────────────────────────────
  // Alignés sur SUPPORT_EMAIL / FROM_EMAIL côté API (cf. .env.example).
  // ⚠️ Ces deux boîtes doivent réellement être relevées : le RGPD impose de
  // répondre à une demande de droits sous un mois.
  contactEmail: 'support@mykpoptrade.com',
  dpoEmail: 'privacy@mykpoptrade.com',

  // ── Hébergeur ──────────────────────────────────────────────────────────────
  // ⚠️ À COMPLÉTER : adresse postale et téléphone de Nexgate, à recopier depuis
  // le contrat d'hébergement ou les mentions légales de l'hébergeur. Ne pas
  // inventer ces valeurs : elles engagent un tiers.
  hostName: 'Nexgate',
  hostAddress: 'Suisse',
  hostPhone: 'Inconnu',

  designer: 'L\'équipe MyKpopTrade',

  // ── Médiation de la consommation ───────────────────────────────────────────
  // ⚠️ Obligatoire (art. L.616-1 du Code de la consommation) dès que le service
  // est fourni à des consommateurs à titre professionnel. Suppose d'adhérer à
  // un médiateur agréé, puis de recopier ses coordonnées ici.
  mediatorName: '//',
  mediatorAddress: '//',
  mediatorWebsite: '//'
}

/** Libellé affiché tant qu'une information n'est pas renseignée. */
const PLACEHOLDER_LABELS: Record<keyof LegalIdentity, string> = {
  siteName: 'MyKpopTrade',
  siteUrl: 'mykpoptrade.com',
  companyName: 'CHOMEL Colin, THOMAS Yannis',
  legalForm: 'FORME_JURIDIQUE',
  capital: 'CAPITAL',
  headquarters: 'ADRESSE_ÉDITEUR',
  rcsCity: 'VILLE_RCS',
  siren: 'SIREN',
  vatNumber: 'TVA',
  publicationDirector: 'NOM_DIRECTEUR',
  contactEmail: 'EMAIL_CONTACT',
  dpoEmail: 'EMAIL_DPO',
  courtCity: 'VILLE_TRIBUNAL',
  hostName: 'NOM_HÉBERGEUR',
  hostAddress: 'ADRESSE_HÉBERGEUR',
  hostPhone: 'TÉLÉPHONE_HÉBERGEUR',
  designer: 'ÉQUIPE_OU_PRESTATAIRE',
  mediatorName: 'NOM_MÉDIATEUR',
  mediatorAddress: 'ADRESSE_MÉDIATEUR',
  mediatorWebsite: 'SITE_MÉDIATEUR'
}

/** Informations qui n'existent que pour une activité immatriculée. */
const REGISTERED_ONLY_KEYS: ReadonlySet<keyof LegalIdentity> = new Set([
  'rcsCity',
  'siren',
  'vatNumber'
])

/** Informations propres aux sociétés (une entreprise individuelle n'a pas de capital). */
const COMPANY_ONLY_KEYS: ReadonlySet<keyof LegalIdentity> = new Set([
  'legalForm',
  'capital'
])

/**
 * Indique si une information a un sens pour le type d'éditeur courant.
 * Les pages légales s'en servent pour masquer une ligne plutôt que d'afficher
 * un blanc : un particulier non immatriculé n'a pas de « capital social ».
 */
export function legalApplies(key: keyof LegalIdentity): boolean {
  if (publisherType === 'company') return true
  if (publisherType === 'soleTrader') return !COMPANY_ONLY_KEYS.has(key)
  return !REGISTERED_ONLY_KEYS.has(key) && !COMPANY_ONLY_KEYS.has(key)
}

/**
 * Rend la valeur légale, ou son marqueur `[NOM_DU_CHAMP]` si elle est absente.
 * Utilisé dans les templates des pages légales.
 */
export function legal(key: keyof LegalIdentity): string {
  const value = legalIdentity[key]?.trim()
  return value ? value : `[${PLACEHOLDER_LABELS[key]}]`
}

/** Indique si une information est encore à renseigner (pour le style visuel). */
export function isLegalMissing(key: keyof LegalIdentity): boolean {
  return legalApplies(key) && !legalIdentity[key]?.trim()
}

/**
 * Liste les informations légales manquantes, en ignorant celles sans objet pour
 * le type d'éditeur courant. À appeler dans une vérification de pré-production
 * pour s'assurer qu'aucun marqueur ne part en ligne.
 */
export function missingLegalKeys(): Array<keyof LegalIdentity> {
  return (Object.keys(legalIdentity) as Array<keyof LegalIdentity>).filter(isLegalMissing)
}

/**
 * Avertit en console, en développement uniquement, tant que des mentions
 * obligatoires manquent. Évite de découvrir les marqueurs roses en production.
 */
export function warnIfLegalIncomplete(): void {
  if (!import.meta.env.DEV) return

  const missing = missingLegalKeys()
  if (missing.length === 0) return

  console.warn(
    `[legal] ${missing.length} mention(s) légale(s) obligatoire(s) non renseignée(s) ` +
      `dans src/config/legal.ts : ${missing.join(', ')}. ` +
      'Elles s\'affichent en rose sur /legal, /cgu, /privacy et /cookies. ' +
      'Voir docs/MENTIONS-LEGALES.md.'
  )
}

/** Outil de mesure d'audience effectivement utilisé (cf. consent.service.ts). */
export const analyticsToolName = 'Google Tag Manager / Google Analytics'

/**
 * Sous-traitants et destinataires des données, listés dans la politique de
 * confidentialité (RGPD art. 13-1-e). À tenir à jour avec les services
 * réellement appelés par l'application.
 */
export const dataProcessors: ReadonlyArray<{
  name: string
  purpose: string
  location: string
}> = [
  {
    name: 'Nexgate',
    purpose: 'hébergement de l\'application et de la base de données',
    location: 'voir contrat d\'hébergement'
  },
  {
    name: 'PayPal (Europe) S.à r.l. et Cie, S.C.A.',
    purpose: 'encaissement des paiements et versement aux vendeurs',
    location: 'Luxembourg (UE)'
  },
  {
    name: 'Twilio',
    purpose: 'envoi des SMS de vérification du numéro de téléphone',
    location: 'États-Unis'
  },
  {
    name: 'Google Ireland Ltd.',
    purpose: 'mesure d\'audience via Google Tag Manager, sur consentement uniquement',
    location: 'Irlande (UE), transferts possibles vers les États-Unis'
  }
]
