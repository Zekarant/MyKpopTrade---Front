import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { vDismiss } from '../vDismiss'
import { DISCARD_TEXT_QUESTION } from '../useDialogFocus'

/** Fond d'une boîte de dialogue : un clic dessus la ferme, sauf texte tapé que l'utilisateur veut garder. */

let wrapper: VueWrapper | undefined

function mountDialog() {
  const close = vi.fn()
  wrapper = mount(defineComponent({
    directives: { dismiss: vDismiss },
    setup: () => ({ close }),
    template: `
      <div v-dismiss="close" class="overlay">
        <div class="box"><textarea class="field"></textarea></div>
      </div>`
  }), { attachTo: document.body })
  const field = wrapper.find('.field').element as HTMLTextAreaElement
  return { close, overlay: wrapper.find('.overlay'), box: wrapper.find('.box'), field }
}

/** Clic souris : appui puis relâchement au même endroit. */
async function clickOn(target: DOMWrapper<Element>) {
  await target.trigger('mousedown')
  await target.trigger('click')
}

/** Saisie au clavier : la valeur change et le champ émet `input`. */
function typeInto(field: HTMLTextAreaElement, value: string) {
  field.value = value
  field.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('vDismiss', () => {
  afterEach(() => {
    wrapper?.unmount()
    vi.restoreAllMocks()
  })

  it('ferme sur un clic sur le fond, pas sur un clic dans la boîte', async () => {
    const { close, overlay, box } = mountDialog()

    await clickOn(box)
    await clickOn(overlay)

    expect(close).toHaveBeenCalledOnce()
  })

  it('ne ferme pas sur une sélection de texte partie de la boîte et relâchée sur le fond', async () => {
    const { close, overlay, box } = mountDialog()

    await box.trigger('mousedown')
    await overlay.trigger('click')

    expect(close).not.toHaveBeenCalled()
  })

  it('demande confirmation avant de perdre un texte tapé, et garde la boîte si on refuse', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    const { close, overlay, field } = mountDialog()

    typeInto(field, 'Annonce frauduleuse')
    await clickOn(overlay)
    expect(close).not.toHaveBeenCalled()

    await clickOn(overlay)
    expect(confirmSpy).toHaveBeenCalledWith(DISCARD_TEXT_QUESTION)
    expect(close).toHaveBeenCalledOnce()
  })

  it('ne demande rien pour un texte pré-rempli par le code', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm')
    const { close, overlay, field } = mountDialog()

    field.value = 'Réponse déjà publiée'
    await clickOn(overlay)

    expect(confirmSpy).not.toHaveBeenCalled()
    expect(close).toHaveBeenCalledOnce()
  })
})
