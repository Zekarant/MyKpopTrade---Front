/** Profil affiché : le mien (/api/auth/profile) ou celui d'un membre (/api/profiles/user/:id). */
export interface ProfileInfo {
  _id?: string
  id?: string
  username?: string
  bio?: string
  location?: string
  profilePicture?: string
  socialLinks?: { instagram?: string; twitter?: string; discord?: string }
  createdAt?: string
  isSellerVerified?: boolean
  [key: string]: unknown
}

/** Ce qu'on peut signaler depuis la page. */
export interface ReportTarget {
  type: 'user' | 'post'
  id: string
}

/** Identifiant d'un profil, quelle que soit la route qui l'a fourni. */
export function profileIdOf(profile: ProfileInfo): string {
  return profile.id || profile._id || ''
}

/** Initiale affichée à la place d'un avatar. */
export function initialOf(username?: string): string {
  return username?.charAt(0).toUpperCase() ?? ''
}
