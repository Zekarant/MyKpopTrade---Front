import userService from '@/services/user.service'

const DEFAULT_AVATAR_HTML = '<img src="https://mykpoptrade.com/images/avatar-default.png" alt="avatar">'

/** HTML d'avatar (rendu via v-html) : échappement assuré par renderUserAvatar. */
export function avatarHtml(user: { username?: string; profilePicture?: string } | null | undefined): string {
  if (!user) return DEFAULT_AVATAR_HTML
  return userService.renderUserAvatar({ username: user.username, profilePicture: user.profilePicture } as never)
}
