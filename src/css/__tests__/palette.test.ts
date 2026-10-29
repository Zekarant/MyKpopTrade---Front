import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

/**
 * Palette : les couleurs passent par les tokens de _variables.scss. Restent en
 * dur les seules couleurs imposées de l'extérieur (marques).
 */

const SRC = join(__dirname, '..', '..')

const ALLOWED: Record<string, string[]> = {
  // Définition des tokens.
  'css/_variables.scss': ['*'],
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

  it('ni couleur nommée, ni rgba() d\'une couleur de la palette (seuls les noirs et blancs translucides des ombres et voiles)', () => {
    const offenders = styleFiles(SRC).flatMap((file) => {
      const name = relative(SRC, file).split('\\').join('/')
      if (ALLOWED[name]?.includes('*')) return []
      // Les valeurs de propriétés seules, jusqu'au `;` (valeurs sur plusieurs lignes comprises) :
      // pas les noms de classes ni les variables (`--x: …`).
      const values = [...styles(file).matchAll(/(?:^|[;{\s])(?!--)[\w-]+\s*:\s*([^;{}]*)/g)].map((m) => m[1])
      return values.flatMap((value) => [
        ...(value.match(/(?<![\w-])(white|black)(?![\w-])/gi) ?? []),
        ...(value.match(/rgba?\([^)]*\)/g) ?? []).filter(
          (color) => !/^rgba?\(\s*(0\s*,\s*0\s*,\s*0|255\s*,\s*255\s*,\s*255)\s*[,)]/.test(color)
        ),
      ]).map((color) => `${name}: ${color}`)
    })

    expect(offenders).toEqual([])
  })
})
