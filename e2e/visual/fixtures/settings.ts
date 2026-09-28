/** Données simulées de la page Paramètres pour les captures de référence. */
export const ME = 'user-me'
export const NOW = new Date('2026-09-28T14:00:00+02:00')

export const profile = {
  user: {
    _id: ME,
    id: ME,
    username: 'MoiMeme',
    email: 'moi@exemple.fr',
    firstName: 'Camille',
    lastName: 'Durand',
    bio: 'Collectionneuse de photocards BTS et Stray Kids.',
    location: 'Lyon',
    profilePicture: '/uploads/profiles/me.png',
    socialLinks: { instagram: 'moi.kpop', twitter: '', discord: '' },
    socialAuth: { google: { id: 'google-1' } },
    isEmailVerified: true,
    phoneNumber: '+33612345678',
    isPhoneVerified: false,
    isIdentityVerified: false,
    legalName: 'Camille Durand',
    address: { streetLine1: '12 rue des Lilas', postalCode: '69001', city: 'Lyon', country: 'FR' },
    preferences: { allowDirectMessages: true },
    marketingConsent: false,
    accountStatus: 'active',
    profileCompleted: true
  }
}

/** Vendeur pas encore relié à PayPal : bouton « Connecter » et fenêtre de pré-remplissage. */
export const paypalStatus = {
  connected: false,
  merchantId: null,
  email: null,
  legalName: null,
  scopes: [],
  blockReason: 'NOT_ONBOARDED',
  blockMessage: 'Connectez votre compte PayPal pour recevoir vos paiements.'
}

export const twoFactorStatus = { enabled: false, recoveryCodesRemaining: 0 }
