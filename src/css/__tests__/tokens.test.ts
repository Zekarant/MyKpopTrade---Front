import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { withoutComments } from './withoutComments'

/**
 * Tokens : chaque `var(--x)` des styles renvoie à une variable définie quelque
 * part (_variables.scss ou localement). Un token supprimé ou mal orthographié
 * ne laisse pas une couleur ou une marge silencieusement vide.
 */

const SRC = join(__dirname, '..', '..')

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : files(path)
    return /\.(scss|vue|ts)$/.test(name) ? [path] : []
  })
}

describe('tokens CSS', () => {
  it('aucune variable CSS utilisée sans être définie', () => {
    const sources = files(SRC).map((file) => ({ name: relative(SRC, file).split('\\').join('/'), code: withoutComments(readFileSync(file, 'utf8')) }))
    // Définitions : `--x:` en CSS, ou `'--x':` / `--x` posé depuis le code (style lié, setProperty).
    const defined = new Set(sources.flatMap(({ code }) => [...code.matchAll(/(--[\w-]+)['"]?\s*:/g)].map((m) => m[1])))

    const undefinedUses = sources.flatMap(({ name, code }) =>
      [...code.matchAll(/var\((--[\w-]+)/g)]
        .map((m) => m[1])
        // `--bs-*` : variables de Bootstrap, définies par sa feuille de style.
        .filter((token) => !defined.has(token) && !token.startsWith('--bs-'))
        .map((token) => `${name}: ${token}`)
    )

    expect([...new Set(undefinedUses)]).toEqual([])
  })
})
