import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { vKeyboardClick } from '../vKeyboardClick'

/** Élément cliquable non interactif : utilisable au clavier comme un bouton. */

function mountRow(enabled = true) {
  const onClick = vi.fn()
  const active = ref(enabled)
  const wrapper = mount(defineComponent({
    directives: { keyboardClick: vKeyboardClick },
    setup: () => ({ onClick, active }),
    template: '<div v-keyboard-click="active" class="row" @click="onClick"><input class="field" /></div>'
  }))
  return { wrapper, onClick, active, row: wrapper.find('.row') }
}

describe('vKeyboardClick', () => {
  it('annonce un bouton atteignable au clavier, déclenché par Entrée et Espace', async () => {
    const { row, onClick } = mountRow()

    expect(row.attributes()).toMatchObject({ role: 'button', tabindex: '0' })
    await row.trigger('keydown', { key: 'Enter' })
    await row.trigger('keydown', { key: ' ' })
    await row.trigger('keydown', { key: 'a' })

    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it('ignore les touches tapées dans un champ imbriqué', async () => {
    const { wrapper, onClick } = mountRow()

    await wrapper.find('.field').trigger('keydown', { key: 'Enter' })

    expect(onClick).not.toHaveBeenCalled()
  })

  it('se retire quand la ligne devient inactive', async () => {
    const { wrapper, row, onClick, active } = mountRow()

    active.value = false
    await wrapper.vm.$nextTick()
    await row.trigger('keydown', { key: 'Enter' })

    expect(row.attributes('tabindex')).toBeUndefined()
    expect(row.attributes('role')).toBeUndefined()
    expect(onClick).not.toHaveBeenCalled()
  })
})
