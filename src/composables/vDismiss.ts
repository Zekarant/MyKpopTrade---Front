import type { Directive } from 'vue'
import { confirmDiscard } from './useDialogFocus'

interface DismissState {
  close: () => void
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
      onClick(event) {
        if (event.target === el && confirmDiscard(el)) state.close()
      }
    }
    states.set(el, state)
    el.addEventListener('click', state.onClick)
  },
  updated(el, { value }) {
    const state = states.get(el)
    if (state) state.close = value
  },
  unmounted(el) {
    const state = states.get(el)
    if (state) el.removeEventListener('click', state.onClick)
    states.delete(el)
  }
}
