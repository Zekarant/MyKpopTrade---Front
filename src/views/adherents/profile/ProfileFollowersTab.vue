<template>
  <div class="profile-tab-content">
    <div class="followers-section">
      <div class="followers-section__header">
        <h3 class="followers-section__title"><i class="bi bi-people"></i> Abonnés ({{ total }})</h3>
      </div>
      <div v-if="followers.length" class="followers-section__list">
        <div class="follower-card" v-for="follower in followers" :key="follower._id">
          <router-link :to="`/adherents/profile/${follower._id}`" class="follower-card__link">
            <span class="follower-card__avatar">{{ initialOf(follower.username) }}</span>
            <div class="follower-card__info">
              <span class="follower-card__name">{{ follower.username }}</span>
              <span v-if="follower.bio" class="follower-card__bio">{{ follower.bio }}</span>
            </div>
          </router-link>
          <button v-if="isOwnProfile" class="follower-card__remove" @click="removeFollower(follower._id)" title="Retirer cet abonné">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
      </div>
      <div v-else class="empty-state">
        <i class="bi bi-people"></i>
        <p>Aucun abonné pour le moment.</p>
      </div>
      <div v-if="page < totalPages" class="followers-section__more">
        <button class="followers-section__load-btn" @click="loadFollowers(page + 1)">Voir plus</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onActivated, ref, watch } from 'vue'
import followService from '@/services/follow.service'
import { initialOf } from './types'

const props = defineProps<{ profileUserId: string; isOwnProfile: boolean }>()

interface Follower {
  _id: string
  username?: string
  bio?: string
}

const followers = ref<Follower[]>([])
const total = ref(0)
const page = ref(1)
const totalPages = ref(1)

async function loadFollowers(pageToLoad = 1) {
  if (!props.profileUserId) return
  try {
    const data = await followService.getFollowers(props.profileUserId, pageToLoad)
    const received: Follower[] = data.followers || []
    followers.value = pageToLoad === 1 ? received : [...followers.value, ...received]
    total.value = data.total || 0
    page.value = data.page || 1
    totalPages.value = data.totalPages || 1
  } catch {
    followers.value = []
  }
}

onActivated(() => loadFollowers())
watch(() => props.profileUserId, () => loadFollowers())

async function removeFollower(followerId: string) {
  if (!confirm('Retirer cet abonné ?')) return
  try {
    await followService.removeFollower(followerId)
    followers.value = followers.value.filter((follower) => follower._id !== followerId)
    total.value = Math.max(0, total.value - 1)
  } catch (e) {
    console.error('Erreur suppression follower:', e)
  }
}
</script>
