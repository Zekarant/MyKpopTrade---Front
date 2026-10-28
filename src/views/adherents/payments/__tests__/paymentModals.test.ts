import { describe, it, expect, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import RefundModal from '../RefundModal.vue'
import ShipmentModal from '../ShipmentModal.vue'

/** Modales du vendeur : saisie de l'expédition et remboursement. */

let wrapper: VueWrapper

afterEach(() => wrapper?.unmount())

const confirmButton = () => wrapper.find('.btn-primary, .btn-danger')

describe('ShipmentModal', () => {
  it('n\'autorise l\'envoi qu\'avec transporteur et numéro de suivi', async () => {
    wrapper = mount(ShipmentModal, { attachTo: document.body })
    const [carrier, tracking] = wrapper.findAll('input')

    await carrier.setValue('Colissimo')
    expect(confirmButton().attributes('disabled')).toBeDefined()

    await tracking.setValue('6A123')
    expect(confirmButton().attributes('disabled')).toBeUndefined()
  })

  it('n\'envoie pas d\'URL de suivi vide', async () => {
    wrapper = mount(ShipmentModal, { attachTo: document.body })
    const [carrier, tracking] = wrapper.findAll('input')
    await carrier.setValue('Colissimo')
    await tracking.setValue('6A123')

    await confirmButton().trigger('click')

    expect(wrapper.emitted('submit')).toEqual([[{ carrier: 'Colissimo', trackingNumber: '6A123' }]])
  })
})

describe('RefundModal', () => {
  async function fillRefund(amount?: string) {
    wrapper = mount(RefundModal, { props: { maxAmount: 10, currency: 'EUR' }, attachTo: document.body })
    await wrapper.find('textarea').setValue('Article abîmé')
    await wrapper.find('input[type="password"]').setValue('secret')
    if (amount !== undefined) await wrapper.find('input[type="number"]').setValue(amount)
  }

  it('refuse un montant supérieur au restant remboursable', async () => {
    await fillRefund('10.01')

    expect(wrapper.find('.modal-error').text()).toContain('dépasse le restant')
    expect(confirmButton().attributes('disabled')).toBeDefined()
  })

  it('arrondit le montant saisi au centime', async () => {
    await fillRefund('4.567')

    await confirmButton().trigger('click')

    expect(wrapper.emitted('submit')).toEqual([[{ reason: 'Article abîmé', password: 'secret', amount: 4.57 }]])
  })

  it('n\'envoie pas de montant quand le champ est vide (remboursement du restant)', async () => {
    await fillRefund()

    await confirmButton().trigger('click')

    expect(wrapper.emitted('submit')).toEqual([[{ reason: 'Article abîmé', password: 'secret' }]])
  })
})
