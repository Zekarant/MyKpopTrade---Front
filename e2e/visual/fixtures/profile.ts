/** Données simulées de la page profil pour les captures de référence. */
export const ME = 'user-me'
export const OTHER = 'user-other'
export const NOW = new Date('2026-09-28T14:00:00+02:00')

const iso = (minutesAgo: number) => new Date(NOW.getTime() - minutesAgo * 60_000).toISOString()

export const myProfile = {
  user: {
    _id: ME,
    id: ME,
    username: 'MoiMeme',
    email: 'moi@exemple.fr',
    bio: 'Collectionneuse de photocards BTS et Stray Kids. Envois soignés sous 48 h.',
    location: 'Lyon',
    profilePicture: '/uploads/profiles/me.png',
    socialLinks: { instagram: 'moi.kpop', twitter: '', discord: 'moimeme' },
    createdAt: '2024-03-15T10:00:00.000Z',
    isSellerVerified: true,
    profileCompleted: true
  }
}

export const otherProfile = {
  profile: {
    id: OTHER,
    username: 'AliceK',
    bio: '',
    location: 'Paris',
    profilePicture: '/uploads/profiles/alice.png',
    socialLinks: {},
    createdAt: '2025-01-02T10:00:00.000Z',
    isSellerVerified: false
  }
}

const seller = { _id: ME, username: 'MoiMeme', profilePicture: '/uploads/profiles/me.png' }

export const inventory = {
  products: [
    { _id: 'p1', title: 'Photocard Jungkook Butter', price: 12, currency: 'EUR', condition: 'likeNew', images: ['/uploads/products/p1.jpg'], isAvailable: true, seller },
    { _id: 'p2', title: 'Album Proof édition standard', price: 35, currency: 'EUR', condition: 'good', images: ['/uploads/products/p2.jpg'], isAvailable: true, seller },
    { _id: 'p3', title: 'Lightstick Army Bomb v4', price: 48, currency: 'EUR', condition: 'new', images: ['/uploads/products/p3.jpg'], isAvailable: true, seller }
  ]
}

export function postsOf(author: { _id: string; username: string }) {
  return {
    posts: [
      { _id: 'post-1', author, content: 'Nouvel arrivage de photocards Stray Kids ce week-end !', createdAt: iso(42), likesCount: 3, repliesCount: 1 },
      { _id: 'post-2', author, content: 'Merci à tous pour les échanges de ce mois-ci 💜', createdAt: iso(60 * 30), likesCount: 12, repliesCount: 0 }
    ]
  }
}

export const postDetail = {
  post: { _id: 'post-1' },
  replies: [{ _id: 'reply-1', author: { _id: OTHER, username: 'AliceK' }, content: 'Tu as Felix ?' }]
}

export const reviews = {
  stats: { averageRating: 4.5, totalRatings: 2 },
  ratings: [
    {
      _id: 'r1',
      rating: 5,
      review: 'Envoi rapide et très bien protégé, je recommande !',
      createdAt: iso(60 * 24 * 3),
      reviewer: { _id: OTHER, username: 'AliceK' },
      response: { content: 'Merci beaucoup Alice !' }
    },
    {
      _id: 'r2',
      rating: 4,
      review: 'Conforme à la description.',
      createdAt: iso(60 * 24 * 10),
      reviewer: { _id: 'user-bob', username: 'BobCollect' }
    }
  ]
}

export const followers = {
  followers: [
    { _id: OTHER, username: 'AliceK', bio: 'Fan de TWICE' },
    { _id: 'user-bob', username: 'BobCollect' }
  ],
  total: 2,
  page: 1,
  totalPages: 1
}
