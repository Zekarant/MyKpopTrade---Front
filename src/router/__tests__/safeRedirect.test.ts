import { describe, it, expect } from 'vitest'
import { safeRedirect } from '../safeRedirect'

describe('safeRedirect', () => {
  it.each(['/cart', '/adherents/messages/42?tab=offres'])('accepte le chemin interne %s', (path) => {
    expect(safeRedirect(path)).toBe(path)
  })

  it.each(['https://evil.example', '//evil.example', '/\\evil.example', 'cart', '', undefined, ['/cart']])(
    'refuse %p (redirection ouverte ou valeur invalide)',
    (value) => {
      expect(safeRedirect(value)).toBeNull()
    }
  )
})
