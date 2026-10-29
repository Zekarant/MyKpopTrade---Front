import { describe, it, expect } from 'vitest'
import { withoutComments } from './withoutComments'

/** Retrait des commentaires pour les garde-fous CSS, sans toucher aux URL. */

describe('withoutComments', () => {
  it('retire les commentaires de ligne et de bloc', () => {
    expect(withoutComments('// note !important\na { color: red; }')).toBe('\na { color: red; }')
    expect(withoutComments('a { /* --x: 1 */ color: red; }')).toBe('a {  color: red; }')
    expect(withoutComments('b { x: 1; } // fin')).toBe('b { x: 1; } ')
  })

  it('garde les URL absolues et protocole-relatives', () => {
    expect(withoutComments("a { background: url('https://cdn.test/a.png') !important; }"))
      .toBe("a { background: url('https://cdn.test/a.png') !important; }")
    expect(withoutComments('a { background: url(//cdn.test/a.png) !important; }'))
      .toBe('a { background: url(//cdn.test/a.png) !important; }')
  })
})
