import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('@/config/api', () => ({ API_URL: 'https://api.test' }))

import UserAvatar from '../UserAvatar.vue'

/** Avatar : photo, initiale de repli, et aucun HTML injecté depuis les données. */

describe('UserAvatar', () => {
  it('affiche la photo du membre, avec un texte alternatif', () => {
    const wrapper = mount(UserAvatar, { props: { user: { username: 'minnie', profilePicture: '/uploads/a.jpg' } } })

    const img = wrapper.find('img')
    expect(img.attributes('src')).toBe('https://api.test/uploads/a.jpg')
    expect(img.attributes('alt')).toBe('Avatar de minnie')
    expect(img.attributes('loading')).toBe('lazy')
  })

  it('remplace une photo qui ne se charge pas par l\'initiale', async () => {
    const wrapper = mount(UserAvatar, { props: { user: { username: 'minnie', profilePicture: '/uploads/a.jpg' } } })

    await wrapper.find('img').trigger('error')

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toBe('M')
  })

  it('montre l\'initiale quand le compte n\'a que l\'avatar par défaut', () => {
    const wrapper = mount(UserAvatar, {
      props: { user: { username: 'jimin', profilePicture: 'https://mykpoptrade.com/images/avatar-default.png' } }
    })

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('[role="img"]').attributes('aria-label')).toBe('Avatar de jimin')
  })

  it('affiche l\'avatar par défaut pour un interlocuteur inconnu', () => {
    const wrapper = mount(UserAvatar, { props: { user: null } })

    expect(wrapper.find('img').attributes('src')).toBe('https://mykpoptrade.com/images/avatar-default.png')
  })

  it('n\'interprète jamais le pseudo ni l\'URL comme du HTML', async () => {
    const wrapper = mount(UserAvatar, {
      props: { user: { username: '<img src=x onerror=alert(1)>', profilePicture: '"><script>alert(1)</script>' } }
    })

    expect(wrapper.find('script').exists()).toBe(false)
    await wrapper.find('img').trigger('error')
    expect(wrapper.findAll('img')).toHaveLength(0)
    expect(wrapper.text()).toBe('<')
  })

  it('redonne sa chance à une nouvelle photo après un échec', async () => {
    const wrapper = mount(UserAvatar, { props: { user: { username: 'minnie', profilePicture: '/uploads/a.jpg' } } })
    await wrapper.find('img').trigger('error')

    await wrapper.setProps({ user: { username: 'minnie', profilePicture: '/uploads/b.jpg' } })

    expect(wrapper.find('img').attributes('src')).toBe('https://api.test/uploads/b.jpg')
  })

  it('prend la taille demandée', () => {
    const wrapper = mount(UserAvatar, { props: { user: { username: 'minnie' }, size: 32 } })

    expect(wrapper.attributes('style')).toContain('width: 32px')
  })
})
