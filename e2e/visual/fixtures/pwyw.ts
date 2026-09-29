/** Annonce « prix libre » pour les captures de référence. */
import { NOW, OTHER } from './profile'

export const pwywProduct = {
  _id: 'p1',
  title: 'Photocard Jungkook Butter',
  description: 'Photocard officielle, jamais sortie de son sleeve. Proposez le prix qui vous semble juste.',
  price: 12,
  currency: 'EUR',
  condition: 'likeNew',
  category: 'Photocards',
  type: 'photocard',
  kpopGroup: 'group-bts',
  kpopGroupName: 'BTS',
  kpopMember: 'Jungkook',
  images: ['/uploads/products/p1.jpg'],
  isAvailable: true,
  isSold: false,
  allowOffers: false,
  isPayWhatYouWant: true,
  pwywMinPrice: 5,
  pwywMaxPrice: 30,
  shippingOptions: { worldwide: false, nationalOnly: true, localPickup: true, nationalCost: 3 },
  seller: { _id: OTHER, username: 'AliceK', profilePicture: '/uploads/profiles/alice.png' },
  createdAt: NOW.toISOString(),
  updatedAt: NOW.toISOString()
}

export const connectedPayPal = {
  connected: true,
  merchantId: 'MERCHANT-TEST',
  email: null,
  legalName: 'MoiMeme',
  paymentsReceivable: true,
  primaryEmailConfirmed: true,
  consentGranted: true,
  scopes: [],
  checkedAt: NOW.toISOString(),
  blockReason: null,
  blockMessage: null
}
