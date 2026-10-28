import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StarRatingInput from '../StarRatingInput.vue'

/** Note en étoiles : clic, clavier et annonce aux lecteurs d'écran. */

/** Monte la note en v-model : chaque émission redescend comme nouvelle prop. */
function mountRating(modelValue = 3) {
  const wrapper = mount(StarRatingInput, {
    props: {
      modelValue,
      'onUpdate:modelValue': (value: number) => wrapper.setProps({ modelValue: value }),
    },
    attachTo: document.body,
  })
  return wrapper
}

describe('StarRatingInput', () => {
  it('allume les étoiles jusqu\'à la note et l\'affiche sur 5', () => {
    const wrapper = mountRating(3)

    expect(wrapper.findAll('.star-btn.active')).toHaveLength(3)
    expect(wrapper.find('.rating-text').text()).toBe('3/5')
    wrapper.unmount()
  })

  it('change la note au clic', async () => {
    const wrapper = mountRating(3)

    await wrapper.findAll('.star-btn')[4].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([[5]])
    wrapper.unmount()
  })

  it('expose un groupe radio avec une seule étoile tabulable', () => {
    const wrapper = mountRating(2)
    const stars = wrapper.findAll('[role="radio"]')

    expect(wrapper.find('[role="radiogroup"]').exists()).toBe(true)
    expect(stars.map((star) => star.attributes('aria-checked'))).toEqual(['false', 'true', 'false', 'false', 'false'])
    expect(stars.map((star) => star.attributes('tabindex'))).toEqual(['-1', '0', '-1', '-1', '-1'])
    expect(stars[0].attributes('aria-label')).toBe('1 étoile')
    wrapper.unmount()
  })

  it('suit les flèches du clavier sans sortir de 1 à 5', async () => {
    const wrapper = mountRating(5)
    const stars = wrapper.findAll('.star-btn')

    await stars[4].trigger('keydown', { key: 'ArrowRight' })
    await stars[4].trigger('keydown', { key: 'ArrowLeft' })

    // Déjà à 5 : la flèche droite ne change rien, donc n'émet rien.
    expect(wrapper.emitted('update:modelValue')).toEqual([[4]])
    expect(document.activeElement).toBe(stars[3].element)
    wrapper.unmount()
  })
})
