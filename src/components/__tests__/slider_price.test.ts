import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import SliderPrice from '../slider_price.vue'

/** Fourchette de prix du panneau de filtres (curseurs natifs, sans PrimeVue). */

function lastEmitted(wrapper: ReturnType<typeof mount>, event: string) {
  const calls = wrapper.emitted(event) ?? []
  return calls[calls.length - 1]?.[0]
}

describe('slider_price', () => {
  it('émet les deux bornes, en nombres, quand on déplace un curseur', async () => {
    const wrapper = mount(SliderPrice)
    const [minRange] = wrapper.findAll('input[type="range"]')

    await minRange.setValue('30')

    expect(lastEmitted(wrapper, 'changeMinPrice')).toBe(30)
    // Maximum en bout de piste : pas de plafond, les annonces > 100 € restent visibles.
    expect(lastEmitted(wrapper, 'changeMaxPrice')).toBeNull()
  })

  it('fixe un plafond quand la poignée du maximum quitte le bout de piste', async () => {
    const wrapper = mount(SliderPrice)
    const [, maxRange] = wrapper.findAll('input[type="range"]')

    await maxRange.setValue('60')
    expect(lastEmitted(wrapper, 'changeMaxPrice')).toBe(60)

    await maxRange.setValue('100')
    expect(lastEmitted(wrapper, 'changeMaxPrice')).toBeNull()
  })

  it('empêche les curseurs de se croiser', async () => {
    const wrapper = mount(SliderPrice)
    const [minRange, maxRange] = wrapper.findAll('input[type="range"]')

    await maxRange.setValue('40')
    await minRange.setValue('70')

    expect(lastEmitted(wrapper, 'changeMinPrice')).toBe(40)
    expect((minRange.element as HTMLInputElement).value).toBe('40')
  })

  it('accepte un maximum saisi au-delà de la piste', async () => {
    const wrapper = mount(SliderPrice)
    const [, maxField] = wrapper.findAll('input[type="number"]')

    await maxField.setValue('250')
    await maxField.trigger('change')

    expect(lastEmitted(wrapper, 'changeMaxPrice')).toBe(250)
  })

  it('remplace un minimum négatif par 0 et lit un maximum vide comme « pas de plafond »', async () => {
    const wrapper = mount(SliderPrice)
    const [minField, maxField] = wrapper.findAll('input[type="number"]')

    await minField.setValue('-5')
    await minField.trigger('change')
    expect(lastEmitted(wrapper, 'changeMinPrice')).toBe(0)

    await maxField.setValue('80')
    await maxField.trigger('change')
    await maxField.setValue('')
    await maxField.trigger('change')
    expect(lastEmitted(wrapper, 'changeMaxPrice')).toBeNull()
  })

  it('nomme chaque curseur pour les lecteurs d\'écran', () => {
    const wrapper = mount(SliderPrice)
    const labels = wrapper.findAll('input[type="range"]').map((input) => input.attributes('aria-label'))

    expect(labels).toEqual(['Prix minimum', 'Prix maximum'])
  })
})
