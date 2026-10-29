import { beforeEach, describe, expect, it, vi } from 'vitest'

/** Formulaire d'inscription partagé par l'accueil et /register. */

const authService = vi.hoisted(() => ({ register: vi.fn() }))
vi.mock('@/services/authentification.service', () => ({ default: authService }))

import { passwordRuleError, useRegisterForm, usernameRuleError, validateRegistration } from '../useRegisterForm'

const VALID = {
  username: 'jimin_fan-95',
  email: 'army@example.com',
  password: 'Secret1!',
  passwordConfirm: 'Secret1!',
  acceptBeta: true,
  acceptPolicy: true
}

function filledForm(overrides: Partial<typeof VALID & { acceptMarketing: boolean }> = {}) {
  const form = useRegisterForm()
  const values = { ...VALID, acceptMarketing: false, ...overrides }
  form.username.value = values.username
  form.email.value = values.email
  form.password.value = values.password
  form.passwordConfirm.value = values.passwordConfirm
  form.acceptBeta.value = values.acceptBeta
  form.acceptPolicy.value = values.acceptPolicy
  form.acceptMarketing.value = values.acceptMarketing
  return form
}

describe('usernameRuleError', () => {
  it.each([
    ['', 'Le pseudo est obligatoire.'],
    ['ab', 'Le pseudo doit comporter au moins 3 caractères.'],
    ['a'.repeat(31), 'Le pseudo ne peut pas dépasser 30 caractères.'],
    ['jimin fan', 'Caractères autorisés pour le pseudo : lettres, chiffres, « _ » et « - ».']
  ])('« %s » → %s', (username, message) => {
    expect(usernameRuleError(username)).toBe(message)
  })

  it('accepte un pseudo conforme', () => {
    expect(usernameRuleError('jk-_3')).toBe('')
  })
})

describe('validateRegistration', () => {
  it('accepte un formulaire conforme aux règles de l\'API', () => {
    expect(validateRegistration(VALID)).toBeNull()
  })

  it.each([
    ['ab', 'trop court'],
    ['a'.repeat(31), 'trop long'],
    ['jimin fan', 'espace'],
    ['jimin.fan', 'point'],
    ['', 'vide']
  ])('refuse le pseudo « %s » (%s)', (username) => {
    expect(validateRegistration({ ...VALID, username })?.field).toBe('username')
  })

  it.each(['abc', 'jk-_3', 'a'.repeat(30)])('accepte le pseudo « %s »', (username) => {
    expect(validateRegistration({ ...VALID, username })).toBeNull()
  })

  it.each(['army', 'army@example', 'army@@example.com', 'ar my@example.com', `${'a'.repeat(250)}@x.fr`])(
    'refuse l\'email « %s »',
    (email) => {
      expect(validateRegistration({ ...VALID, email })?.field).toBe('email')
    }
  )

  it.each([
    ['Sec1!', '8 caractères'],
    ['secret1!', 'majuscule'],
    ['SECRET1!', 'minuscule'],
    ['Secret!!', 'chiffre'],
    // « - » n'est pas un caractère spécial pour l'API.
    ['Secret1-', 'caractère spécial']
  ])('refuse le mot de passe « %s » (règle : %s)', (password, rule) => {
    const error = validateRegistration({ ...VALID, password, passwordConfirm: password })
    expect(error?.field).toBe('password')
    expect(error?.message).toContain(rule)
    expect(passwordRuleError(password)).toContain(rule)
  })

  it('refuse une confirmation différente', () => {
    expect(validateRegistration({ ...VALID, passwordConfirm: 'Secret2!' })).toEqual({
      field: 'passwordConfirm',
      message: 'Les deux mots de passe ne correspondent pas.'
    })
  })

  it('exige la reconnaissance de la bêta puis l\'acceptation des CGU', () => {
    expect(validateRegistration({ ...VALID, acceptBeta: false })?.field).toBe('acceptBeta')
    expect(validateRegistration({ ...VALID, acceptPolicy: false })?.field).toBe('acceptPolicy')
  })
})

describe('useRegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('envoie exactement les champs attendus par l\'API', async () => {
    authService.register.mockResolvedValue('Inscription réussie ! Veuillez vérifier votre email.')
    const form = filledForm({ username: ' jimin_fan-95 ', email: ' army@example.com ', acceptMarketing: true })

    await expect(form.submit()).resolves.toBe(true)

    expect(authService.register).toHaveBeenCalledWith({
      username: 'jimin_fan-95',
      email: 'army@example.com',
      password: 'Secret1!',
      confirmPassword: 'Secret1!',
      privacyPolicy: true,
      dataProcessing: true,
      marketing: true
    })
    expect(form.successMessage.value).toBe('Inscription réussie ! Veuillez vérifier votre email.')
    expect(form.errorMessage.value).toBe('')
    expect(form.loading.value).toBe(false)
  })

  it('n\'inscrit pas aux actualités sans case cochée', async () => {
    authService.register.mockResolvedValue('ok')
    const form = filledForm()

    await form.submit()

    expect(authService.register.mock.calls[0][0].marketing).toBe(false)
  })

  it('n\'appelle pas l\'API quand un champ est invalide et désigne le champ fautif', async () => {
    const form = filledForm({ passwordConfirm: 'Autre1!x' })

    await expect(form.submit()).resolves.toBe(false)

    expect(authService.register).not.toHaveBeenCalled()
    expect(form.errorField.value).toBe('passwordConfirm')
    expect(form.errorMessage.value).toContain('ne correspondent pas')
  })

  it('affiche le message d\'erreur de l\'API', async () => {
    authService.register.mockRejectedValue(new Error('Cet email est déjà utilisé'))
    const form = filledForm()

    await expect(form.submit()).resolves.toBe(false)

    expect(form.errorMessage.value).toBe('Cet email est déjà utilisé')
    expect(form.successMessage.value).toBe('')
    expect(form.loading.value).toBe(false)
  })

  it('efface l\'erreur précédente à la nouvelle tentative', async () => {
    const form = filledForm({ acceptPolicy: false })
    await form.submit()
    expect(form.errorField.value).toBe('acceptPolicy')

    authService.register.mockResolvedValue('ok')
    form.acceptPolicy.value = true
    await form.submit()

    expect(form.errorField.value).toBeNull()
    expect(form.errorMessage.value).toBe('')
  })

  it('ignore une seconde soumission pendant l\'envoi', async () => {
    let resolve!: (message: string) => void
    authService.register.mockReturnValue(new Promise<string>((r) => { resolve = r }))
    const form = filledForm()

    const first = form.submit()
    await expect(form.submit()).resolves.toBe(false)
    resolve('ok')
    await expect(first).resolves.toBe(true)

    expect(authService.register).toHaveBeenCalledTimes(1)
  })
})
