import { describe, it, expect, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { formatPrice } from '@/utils/format'

/** Achat direct : total exact, boîte de dialogue accessible, charge utile inchangée pour l'API. */

const paymentService = vi.hoisted(() => ({ initPayPal: vi.fn() }))

vi.mock('@/services/payment.service', () => ({ default: paymentService }))
vi.mock('@/services/address.service', () => ({ default: { lookup: vi.fn().mockResolvedValue([]) } }))

import CheckoutDialog from '../CheckoutDialog.vue'

type DialogProps = Partial<InstanceType<typeof CheckoutDialog>['$props']>

function mountDialog(props: DialogProps = {}) {
  return mount(CheckoutDialog, {
    attachTo: document.body,
    props: {
      productId: 'p1',
      productTitle: 'Photocard Jimin',
      productPrice: 19.99,
      shippingOptions: { nationalOnly: true, nationalCost: 4.99, localPickup: true },
      ...props
    }
  })
}

const totalLine = (wrapper: ReturnType<typeof mountDialog>) => wrapper.find('.line.total span:last-child').text()

describe('CheckoutDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  it('additionne produit et livraison au centime près', () => {
    const wrapper = mountDialog({ productPrice: 0.1, shippingOptions: { nationalOnly: true, nationalCost: 0.2 } })

    expect(totalLine(wrapper)).toBe(formatPrice(0.3))
    wrapper.unmount()
  })

  it('recalcule le total quand l\'acheteur choisit la remise en main propre', async () => {
    const wrapper = mountDialog()
    expect(totalLine(wrapper)).toBe(formatPrice(24.98))

    await wrapper.find('input[value="localPickup"]').setValue()

    expect(totalLine(wrapper)).toBe(formatPrice(19.99))
    wrapper.unmount()
  })

  it('s\'annonce comme une boîte de dialogue modale titrée et prend le focus', async () => {
    const wrapper = mountDialog()
    // Le focus est posé une fois la boîte rendue (useDialogFocus attend le tick suivant).
    await flushPromises()

    const dialog = wrapper.find('[role="dialog"]')
    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(wrapper.find(`#${dialog.attributes('aria-labelledby')}`).text()).toBe('Finaliser votre achat')
    expect(document.activeElement).toBe(dialog.element)
    wrapper.unmount()
  })

  it('émet cancel sur Échap et rend le focus au bouton qui l\'a ouverte', async () => {
    const opener = document.createElement('button')
    document.body.appendChild(opener)
    opener.focus()
    const wrapper = mountDialog()

    await wrapper.find('.popup-overlay').trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('cancel')).toHaveLength(1)

    wrapper.unmount()
    expect(document.activeElement).toBe(opener)
  })

  it('transmet le confirm de l\'API sans montant recalculé côté client', async () => {
    const result = { success: true, payment: { id: 'pay1', paypalOrderId: 'ORDER-1', approvalUrl: 'https://www.paypal.com/x' } }
    paymentService.initPayPal.mockResolvedValue(result)
    const wrapper = mountDialog()

    await wrapper.find('input[value="localPickup"]').setValue()
    await wrapper.find('.btn-pay').trigger('click')
    await flushPromises()

    expect(paymentService.initPayPal).toHaveBeenCalledWith({ productId: 'p1', shippingMethod: 'localPickup' })
    expect(wrapper.emitted('confirm')).toEqual([[result]])
    wrapper.unmount()
  })

  it('n\'autorise le paiement livré qu\'une fois l\'adresse remplie, et l\'envoie nettoyée', async () => {
    paymentService.initPayPal.mockResolvedValue({ success: true, payment: { id: 'pay1', paypalOrderId: 'O1' } })
    const wrapper = mountDialog()
    expect(wrapper.find('.btn-pay').attributes('disabled')).toBeDefined()

    const field = (label: string) => wrapper.find(`#${wrapper.findAll('label').find((l) => l.text().startsWith(label))!.attributes('for')}`)
    await field('Nom du destinataire').setValue(' Jimin ')
    await field('Adresse').setValue('1 rue de Séoul')
    await field('Code postal').setValue('75001')
    await field('Ville').setValue('Paris')
    await wrapper.find('.btn-pay').trigger('click')
    await flushPromises()

    expect(paymentService.initPayPal).toHaveBeenCalledWith({
      productId: 'p1',
      shippingMethod: 'national',
      shippingAddress: {
        recipientName: 'Jimin',
        streetLine1: '1 rue de Séoul',
        streetLine2: undefined,
        postalCode: '75001',
        city: 'Paris',
        country: 'FR',
        phone: undefined
      }
    })
    wrapper.unmount()
  })
})
