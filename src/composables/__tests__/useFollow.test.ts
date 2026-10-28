import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick, ref } from 'vue'
import { useFollow } from '../useFollow'
import followService from '@/services/follow.service'

/** Abonnement à un membre : compteurs, statut et bascule « suivre ». */

vi.mock('@/services/follow.service', () => ({
  default: {
    getStatus: vi.fn(),
    getFollowers: vi.fn(),
    getFollowing: vi.fn(),
    toggleFollow: vi.fn(),
  },
}))

const service = vi.mocked(followService)
const page = (total: number) => ({ pagination: { page: 1, limit: 1, total, pages: total } })

describe('useFollow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    service.getStatus.mockResolvedValue({ isFollowing: true })
    service.getFollowers.mockResolvedValue(page(12))
    service.getFollowing.mockResolvedValue(page(3))
  })

  it('charge le statut et les compteurs depuis la pagination', async () => {
    const { isFollowing, followersCount, followingCount } = useFollow('u1', false)

    await vi.waitFor(() => expect(followersCount.value).toBe(12))
    expect(followingCount.value).toBe(3)
    expect(isFollowing.value).toBe(true)
  })

  it('ne demande pas de statut sur son propre profil', async () => {
    const { followersCount } = useFollow('u1', true)

    await vi.waitFor(() => expect(followersCount.value).toBe(12))
    expect(service.getStatus).not.toHaveBeenCalled()
  })

  it('ignore la réponse d\'un profil quitté pendant le chargement', async () => {
    const userId = ref('u1')
    let resolveFirst!: (value: unknown) => void
    service.getFollowers.mockImplementationOnce(() => new Promise((resolve) => (resolveFirst = resolve)))
    const { followersCount } = useFollow(userId, false)

    userId.value = 'u2'
    await nextTick()
    await vi.waitFor(() => expect(followersCount.value).toBe(12))
    resolveFirst(page(99))
    await Promise.resolve()

    expect(followersCount.value).toBe(12)
  })

  it('met à jour le statut et le compteur quand on suit puis ne suit plus', async () => {
    const { isFollowing, followersCount, toggleFollow } = useFollow('u1', false)
    await vi.waitFor(() => expect(followersCount.value).toBe(12))

    service.toggleFollow.mockResolvedValueOnce({ isFollowing: false })
    await toggleFollow()
    expect([isFollowing.value, followersCount.value]).toEqual([false, 11])

    service.toggleFollow.mockResolvedValueOnce({ isFollowing: true })
    await toggleFollow()
    expect([isFollowing.value, followersCount.value]).toEqual([true, 12])
  })
})
