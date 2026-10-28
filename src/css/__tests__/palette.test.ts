import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

/**
 * Palette : les couleurs passent par les tokens de _variables.scss, qui
 * suivent le thème clair / sombre. Restent en dur les seules couleurs qui ne
 * doivent pas changer avec le thème.
 */

const SRC = join(__dirname, '..', '..')

const ALLOWED: Record<string, string[]> = {
  // Définition des tokens.
  'css/_variables.scss': ['*'],
  // QR code de la double authentification : fond blanc dans les deux thèmes, sinon illisible.
  'css/two-factor-card.scss': ['#fff'],
  // Texte du point « retourné » : sombre sur l'ambre de --warning, dans les deux thèmes.
  'css/payments.scss': ['#1f1f1f'],
  // Couleurs des marques Google et Discord.
  'views/auth/OAuthButtons.vue': ['#5865f2'],
  'css/settings.scss': ['#4285f4', '#5865f2'],
}

function styleFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : styleFiles(path)
    return /\.(scss|vue)$/.test(name) ? [path] : []
  })
}

/** Feuilles de style seules : pour un composant, ses blocs `<style>`. */
function styles(file: string): string {
  const source = readFileSync(file, 'utf8')
  return file.endsWith('.vue') ? (source.match(/<style[\s\S]*?<\/style>/g) ?? []).join('\n') : source
}

describe('palette', () => {
  it('aucune couleur hexadécimale en dur hors tokens', () => {
    const offenders = styleFiles(SRC).flatMap((file) => {
      const name = relative(SRC, file).split('\\').join('/')
      const allowed = ALLOWED[name] ?? []
      if (allowed.includes('*')) return []
      return (styles(file).match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) ?? [])
        .map((hex) => hex.toLowerCase())
        .filter((hex) => !allowed.includes(hex))
        .map((hex) => `${name}: ${hex}`)
    })

    expect(offenders).toEqual([])
  })
})
