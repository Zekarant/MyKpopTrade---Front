import type { Directive } from 'vue'

interface KeyboardClickState {
  enabled: boolean
  onKeydown: (event: KeyboardEvent) => void
}

const states = new WeakMap<HTMLElement, KeyboardClickState>()

function sync(el: HTMLElement, enabled: boolean): void {
  if (enabled) {
    if (!el.hasAttribute('role')) el.setAttribute('role', 'button')
    el.tabIndex = 0
  } else {
    el.removeAttribute('tabindex')
    if (el.getAttribute('role') === 'button') el.removeAttribute('role')
  }
}

/**
 * Élément non interactif (ligne, carte) qui réagit au clic : il est annoncé
 * comme bouton, atteignable au clavier, et Entrée ou Espace le déclenchent.
 * `v-keyboard-click="false"` le rend inactif (ex. compte déjà lié).
 *
 *   <div class="setting-row" v-keyboard-click @click="open">…</div>
 */
export const vKeyboardClick: Directive<HTMLElement, boolean | undefined> = {
  mounted(el, { value }) {
    const state: KeyboardClickState = {
      enabled: value !== false,
      onKeydown(event) {
        // Une touche dans un champ ou un bouton imbriqué ne déclenche pas la ligne.
        if (!state.enabled || event.target !== el) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          el.click()
        }
      }
    }
    states.set(el, state)
    el.addEventListener('keydown', state.onKeydown)
    sync(el, state.enabled)
  },
  updated(el, { value }) {
    const state = states.get(el)
    if (!state) return
    state.enabled = value !== false
    sync(el, state.enabled)
  },
  unmounted(el) {
    const state = states.get(el)
    if (state) el.removeEventListener('keydown', state.onKeydown)
    states.delete(el)
  }
}
