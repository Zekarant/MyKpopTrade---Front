import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

/**
 * Cascade lisible : les styles vivent dans les feuilles de style (pas dans des
 * attributs `style="..."` statiques) et `!important` est réservé aux cas où il
 * faut battre un autre `!important` ou toute règle de composant.
 */

const SRC = join(__dirname, '..', '..')

/** Fichier -> nombre de `!important` admis, avec la raison. */
const IMPORTANT_ALLOWED: Record<string, number> = {
  // « Réduire les animations » (3), son exception pour les indicateurs de chargement (2)
  // et l'anneau de focus (1) : doivent l'emporter sur tout composant ; plus `.text-muted`,
  // qui surcharge celui de Bootstrap (lui-même !important).
  'css/main.scss': 3 + 2 + 1 + 1,
  // Utilitaires d'affichage par taille d'écran (même convention que Bootstrap).
  'css/_responsive.scss': 7,
  // `.text-primary` : surcharge celui de Bootstrap (lui-même !important).
  'css/messaging/message_bubble.scss': 1,
}

function files(dir: string, ext: RegExp): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : files(path, ext)
    return ext.test(name) ? [path] : []
  })
}

const rel = (file: string) => relative(SRC, file).split('\\').join('/')

describe('cascade CSS', () => {
  it('aucun attribut style="..." statique dans les templates', () => {
    const offenders = files(SRC, /\.vue$/).flatMap((file) => {
      const template = readFileSync(file, 'utf8').match(/<template>[\s\S]*<\/template>/)?.[0] ?? ''
      return (template.match(/(^|\s)style="[^"]*"/g) ?? []).map((attr) => `${rel(file)}: ${attr.trim()}`)
    })

    expect(offenders).toEqual([])
  })

  it('!important seulement là où il est justifié', () => {
    const counts = Object.fromEntries(
      files(SRC, /\.(scss|vue)$/)
        .map((file) => {
          const code = readFileSync(file, 'utf8').replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '')
          return [rel(file), (code.match(/!important/g) ?? []).length] as const
        })
        .filter(([, count]) => count > 0)
    )

    expect(counts).toEqual(IMPORTANT_ALLOWED)
  })
})
