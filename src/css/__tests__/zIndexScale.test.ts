import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

/**
 * Échelle des z-index (_variables.scss : --z-dropdown … --z-toast) : menus,
 * barres, fenêtres et infobulles passent par les tokens. Seules les petites
 * valeurs, qui ordonnent les éléments à l'intérieur d'un composant, restent en dur.
 */

const SRC = join(__dirname, '..', '..')
const LOCAL_MAX = 20

function styleFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === '__tests__' ? [] : styleFiles(path)
    return /\.(scss|vue)$/.test(name) ? [path] : []
  })
}

describe('échelle des z-index', () => {
  it('aucune couche globale en dur : au-delà de 20, un token --z-*', () => {
    const offenders = styleFiles(SRC).flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .flatMap((line, i) => {
          const value = line.match(/z-index:\s*(\d+)/)?.[1]
          return value && Number(value) > LOCAL_MAX ? [`${relative(SRC, file)}:${i + 1}: ${line.trim()}`] : []
        })
    )

    expect(offenders).toEqual([])
  })
})
