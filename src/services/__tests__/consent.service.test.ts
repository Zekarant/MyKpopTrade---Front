import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Cookies from 'js-cookie'
import {
  getConsent,
  hasDecided,
  setConsent,
  resetConsent,
  onConsentChange,
  applyStoredConsent
} from '../consent.service'

/**
 * Ces tests verrouillent l'exigence RGPD / ePrivacy centrale : aucun script de
 * mesure d'audience ne doit être chargé avant un consentement explicite.
 *
 * Régression historique : Google Tag Manager était injecté directement dans
 * index.html, donc exécuté au premier chargement de page, sans consentement.
 */

/** Compte les balises <script> pointant vers Google Tag Manager. */
function gtmScriptCount(): number {
  return document.querySelectorAll('script[src*="googletagmanager.com"]').length
}

describe('consent.service', () => {
  beforeEach(() => {
    Cookies.remove('cookie_consent')
    document.querySelectorAll('script[src*="googletagmanager.com"]').forEach((s) => s.remove())
    delete (window as unknown as Record<string, unknown>).dataLayer
  })

  afterEach(() => {
    Cookies.remove('cookie_consent')
  })

  describe('état initial', () => {
    it('ne considère aucun choix comme exprimé', () => {
      expect(getConsent()).toBeNull()
      expect(hasDecided()).toBe(false)
    })

    it("ne charge aucun script de mesure d'audience", () => {
      applyStoredConsent()
      expect(gtmScriptCount()).toBe(0)
    })
  })

  describe('refus', () => {
    it('enregistre le refus sans charger de traceur', () => {
      setConsent({ analytics: false })

      expect(hasDecided()).toBe(true)
      expect(getConsent()?.analytics).toBe(false)
      expect(gtmScriptCount()).toBe(0)
    })
  })

  describe('acceptation', () => {
    it('enregistre le choix et injecte le conteneur une seule fois', () => {
      setConsent({ analytics: true })

      expect(getConsent()?.analytics).toBe(true)
      expect(gtmScriptCount()).toBe(1)

      // Idempotence : un second accord ne doit pas dupliquer le conteneur.
      setConsent({ analytics: true })
      expect(gtmScriptCount()).toBe(1)
    })

    it('horodate le choix (preuve du consentement)', () => {
      setConsent({ analytics: true })

      const decidedAt = getConsent()?.decidedAt
      expect(decidedAt).toBeTruthy()
      expect(Number.isNaN(Date.parse(decidedAt as string))).toBe(false)
    })
  })

  describe('persistance', () => {
    it('ignore un cookie illisible et redemande le choix', () => {
      Cookies.set('cookie_consent', 'pas-du-json')
      expect(getConsent()).toBeNull()
      expect(hasDecided()).toBe(false)
    })

    it('ignore un choix exprimé sur un périmètre de version différent', () => {
      Cookies.set(
        'cookie_consent',
        JSON.stringify({ analytics: true, version: 999, decidedAt: new Date().toISOString() })
      )
      expect(getConsent()).toBeNull()
    })
  })

  describe('retrait du consentement', () => {
    it('efface le choix et notifie les abonnés', () => {
      setConsent({ analytics: true })

      const received: Array<unknown> = []
      const unsubscribe = onConsentChange((consent) => received.push(consent))

      resetConsent()

      expect(hasDecided()).toBe(false)
      expect(received).toEqual([null])

      unsubscribe()
    })

    it('cesse de notifier après désabonnement', () => {
      const received: Array<unknown> = []
      const unsubscribe = onConsentChange((consent) => received.push(consent))
      unsubscribe()

      resetConsent()

      expect(received).toHaveLength(0)
    })
  })
})
