import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AdminPagination from '../AdminPagination.vue'

/** Pagination des listes admin : boutons nommés, bornés, et page demandée. */

describe('AdminPagination', () => {
  it('nomme ses boutons et demande la page voisine', async () => {
    const wrapper = mount(AdminPagination, { props: { page: 2, pages: 3 } })
    const [previous, next] = wrapper.findAll('button')

    expect([previous.attributes('aria-label'), next.attributes('aria-label')]).toEqual(['Page précédente', 'Page suivante'])
    await previous.trigger('click')
    await next.trigger('click')

    expect(wrapper.emitted('change')).toEqual([[1], [3]])
    expect(wrapper.text()).toContain('2 / 3')
  })

  it('désactive le bouton qui sortirait des pages', () => {
    const [previous, next] = mount(AdminPagination, { props: { page: 1, pages: 2 } }).findAll('button')

    expect(previous.attributes('disabled')).toBeDefined()
    expect(next.attributes('disabled')).toBeUndefined()
  })

  it('ne s\'affiche pas pour une seule page', () => {
    expect(mount(AdminPagination, { props: { page: 1, pages: 1 } }).find('nav').exists()).toBe(false)
  })
})
