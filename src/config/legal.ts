/**
 * Identité légale de l'éditeur du site — SOURCE UNIQUE.
 *
 * Ces informations sont obligatoires :
 * - mentions légales : art. 6-III de la LCEN ;
 * - responsable de traitement et contact DPO : art. 13 du RGPD ;
 * - médiateur de la consommation : art. L.616-1 du Code de la consommation.
 *
 * ⚠️ À REMPLIR AVANT LA MISE EN PRODUCTION. Toute valeur laissée vide s'affiche
 * comme un marqueur rose visible sur les pages légales : rien ne part
 * silencieusement en blanc. Un contrôle est disponible via `missingLegalKeys()`.
 *
 * Ces valeurs ne peuvent pas être devinées : elles doivent être recopiées depuis
 * l'extrait Kbis, les statuts et le contrat d'hébergement.
 */
export interface LegalIdentity {
  /** Dénomination sociale exacte (Kbis). */
  companyName: string
  /** Forme juridique : SAS, SARL, micro-entreprise… */
  legalForm: string
  /** Capital social, ex. « 1 000 € ». Sans objet pour une entreprise individuelle. */
  capital: string
  /** Adresse complète du siège social. */
  headquarters: string
  /** Ville du greffe d'immatriculation. */
  rcsCity: string
  /** Numéro SIREN ou SIRET. */
  siren: string
  /** N° de TVA intracommunautaire, ou « Non assujetti ». */
  vatNumber: string
  /** Directeur de la publication (représentant légal). */
  publicationDirector: string
  /** Email de contact général. */
  contactEmail: string
  /** Email dédié à l'exercice des droits RGPD. */
  dpoEmail: string
  /** Ville du tribunal compétent. */
  courtCity: string
  /** Hébergeur : nom, adresse, téléphone. */
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
  companyName: '',
  legalForm: '',
  capital: '',
  headquarters: '',
  rcsCity: '',
  siren: '',
  vatNumber: '',
  publicationDirector: '',
  contactEmail: '',
  dpoEmail: '',
  courtCity: '',
  hostName: '',
  hostAddress: '',
  hostPhone: '',
  designer: '',
  mediatorName: '',
  mediatorAddress: '',
  mediatorWebsite: ''
}

/** Libellé affiché tant qu'une information n'est pas renseignée. */
const PLACEHOLDER_LABELS: Record<keyof LegalIdentity, string> = {
  companyName: 'NOM_SOCIÉTÉ',
  legalForm: 'FORME_JURIDIQUE',
  capital: 'CAPITAL',
  headquarters: 'ADRESSE_SIÈGE',
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
  return !legalIdentity[key]?.trim()
}

/**
 * Liste les informations légales manquantes. À appeler dans une vérification de
 * pré-production pour s'assurer qu'aucun marqueur ne part en ligne.
 */
export function missingLegalKeys(): Array<keyof LegalIdentity> {
  return (Object.keys(legalIdentity) as Array<keyof LegalIdentity>).filter(isLegalMissing)
}

/** Outil de mesure d'audience effectivement utilisé (cf. consent.service.ts). */
export const analyticsToolName = 'Google Tag Manager / Google Analytics'
