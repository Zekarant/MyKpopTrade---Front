import type { Directive } from 'vue'
import { confirmDiscard } from './useDialogFocus'

interface DismissState {
  close: () => void
  // Le clic a-t-il commencé sur le fond ? Une sélection de texte partie de la
  // boîte et relâchée sur le fond produit un `click` sur le fond.
  pressedOnBackdrop: boolean
  onMousedown: (event: MouseEvent) => void
  onClick: (event: MouseEvent) => void
}

const states = new WeakMap<HTMLElement, DismissState>()

/**
 * Fond d'une boîte de dialogue : un clic sur le fond (pas dans la boîte) la
 * ferme, après confirmation si du texte tapé serait perdu — même règle
 * qu'Escape (voir `confirmDiscard`).
 *
 *   <div class="popup-overlay" v-dismiss="close">…</div>
 */
export const vDismiss: Directive<HTMLElement, () => void> = {
  mounted(el, { value }) {
    const state: DismissState = {
      close: value,
      pressedOnBackdrop: false,
      onMousedown(event) {
        state.pressedOnBackdrop = event.target === el
      },
      onClick(event) {
        if (event.target === el && state.pressedOnBackdrop && confirmDiscard(el)) state.close()
      }
    }
    states.set(el, state)
    el.addEventListener('mousedown', state.onMousedown)
    el.addEventListener('click', state.onClick)
  },
  updated(el, { value }) {
    const state = states.get(el)
    if (state) state.close = value
  },
  unmounted(el) {
    const state = states.get(el)
    if (state) {
      el.removeEventListener('mousedown', state.onMousedown)
      el.removeEventListener('click', state.onClick)
    }
    states.delete(el)
  }
}
