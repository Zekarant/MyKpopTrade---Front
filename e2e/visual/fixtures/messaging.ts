/**
 * Données simulées de la messagerie pour les captures de référence.
 * Elles couvrent chaque branche d'affichage : favori, non lu, archivé,
 * produit et négociation, offres envoyées et reçues (en attente, acceptée),
 * pièces jointes, médias partagés.
 */
export const ME = 'user-me'
export const NOW = new Date('2026-09-28T14:00:00+02:00')

const at = (minutesAgo: number) => new Date(NOW.getTime() - minutesAgo * 60_000).toISOString()

const alice = {
  _id: 'user-alice',
  username: 'AliceKpop',
  profilePicture: '/uploads/profiles/alice.png',
  createdAt: '2025-03-12T10:00:00.000Z',
  isVerified: true,
  transactionCount: 12,
  rating: 4.8
}
const bob = { _id: 'user-bob', username: 'BobCollect', profilePicture: '/uploads/profiles/bob.png' }
const carol = { _id: 'user-carol', username: 'CarolArchive', profilePicture: '/uploads/profiles/carol.png' }
const me = { _id: ME, username: 'MoiMeme', profilePicture: '/uploads/profiles/me.png' }

const product = {
  _id: 'product-1',
  title: 'Photocard Jungkook — Golden',
  description: 'Photocard officielle, jamais sortie de son sleeve.',
  price: 25,
  currency: 'EUR',
  kpopMember: 'Jungkook',
  kpopGroup: 'BTS',
  type: 'photocard',
  condition: 'likeNew',
  images: ['/uploads/products/pc-jungkook.jpg'],
  shippingOptions: { nationalOnly: true, nationalCost: 2 }
}

export const conversations = [
  {
    _id: 'conv-alice',
    type: 'negotiation',
    participants: [me, alice],
    otherParticipant: alice,
    productId: product,
    lastMessage: { content: 'Je peux te la laisser à 22 €' },
    lastMessageAt: at(5),
    createdAt: at(300),
    unreadCount: 2,
    favoritedBy: [ME],
    archivedBy: []
  },
  {
    _id: 'conv-bob',
    type: 'general',
    participants: [me, bob],
    otherParticipant: bob,
    lastMessage: { content: 'Merci pour l\'envoi rapide !' },
    lastMessageAt: at(180),
    createdAt: at(2000),
    unreadCount: 0,
    favoritedBy: [],
    archivedBy: []
  },
  {
    // Conversation vue côté vendeur (isOwner) : ouvre la popup de contre-offre.
    _id: 'conv-dan',
    type: 'sale',
    participants: [me, { _id: 'user-dan', username: 'DanBuyer' }],
    otherParticipant: { _id: 'user-dan', username: 'DanBuyer', profilePicture: '/uploads/profiles/dan.png' },
    productId: product,
    lastMessage: { content: 'Tu fais un prix ?' },
    lastMessageAt: at(240),
    createdAt: at(3000),
    unreadCount: 0,
    favoritedBy: [],
    archivedBy: []
  },
  {
    _id: 'conv-carol',
    type: 'exchange',
    participants: [me, carol],
    otherParticipant: carol,
    lastMessage: { content: 'Échange terminé' },
    lastMessageAt: at(60 * 24 * 10),
    createdAt: at(60 * 24 * 12),
    unreadCount: 1,
    favoritedBy: [],
    archivedBy: [ME]
  }
]

const offerOwnAt = at(40)
const offerOtherAt = at(20)
const offerPendingReceivedAt = at(10)

export const conversationDetail = {
  conversation: {
    ...conversations[0],
    isOwner: false,
    negotiation: { status: 'pending', initialPrice: 25, currentOffer: 20 },
    offerHistory: [
      { createdAt: offerOwnAt, status: 'pending', amount: 20 },
      { createdAt: offerOtherAt, status: 'accepted', amount: 22 },
      { createdAt: offerPendingReceivedAt, status: 'pending', amount: 21 }
    ]
  },
  messages: [
    { _id: 'm1', sender: alice, content: 'Coucou ! Elle est toujours dispo ?', contentType: 'text', attachments: [], createdAt: at(90), readBy: [ME, 'user-alice'] },
    { _id: 'm2', sender: me, content: 'Oui, toujours dispo 😊', contentType: 'text', attachments: [], createdAt: at(80), readBy: [ME, 'user-alice'] },
    { _id: 'm3', sender: alice, content: 'Voici l\'état du sleeve', contentType: 'text', attachments: ['a1.jpg', 'a2.jpg'], createdAt: at(60), readBy: [ME] },
    { _id: 'm4', sender: me, content: 'Je te propose 20 €', contentType: 'offer', attachments: [], createdAt: offerOwnAt, readBy: [ME] },
    { _id: 'm5', sender: alice, content: 'Je peux te la laisser à 22 €', contentType: 'offer', attachments: [], createdAt: offerOtherAt, readBy: [ME], delivered: true },
    { _id: 'm6', sender: alice, content: 'Dernière proposition : 21 €', contentType: 'offer', attachments: [], createdAt: offerPendingReceivedAt, readBy: [ME] }
  ],
  media: [
    { messageId: 'm3', filename: 'a1.jpg' },
    { messageId: 'm3', filename: 'a2.jpg' }
  ],
  pagination: { page: 1, limit: 20, total: 5, pages: 1 }
}

export const conversationDetailFor = (id: string) => {
  if (id === 'conv-alice') return conversationDetail
  const found = conversations.find((c) => c._id === id) ?? conversations[1]
  const conversation = id === 'conv-dan' ? { ...found, isOwner: true } : found
  return {
    conversation,
    messages: [
      { _id: `${id}-1`, sender: conversation.otherParticipant, content: 'Bonjour !', contentType: 'text', attachments: [], createdAt: at(200), readBy: [ME] },
      { _id: `${id}-2`, sender: me, content: 'Salut, merci !', contentType: 'text', attachments: [], createdAt: at(190), readBy: [ME, 'x'] }
    ],
    media: [],
    pagination: { page: 1, limit: 20, total: 2, pages: 1 }
  }
}

export const currentUser = { user: { id: ME, _id: ME, username: 'MoiMeme', profilePicture: '/uploads/profiles/me.png' } }
