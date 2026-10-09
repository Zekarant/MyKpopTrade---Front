<template>
  <!-- Rien à montrer (aucun abonnement, ou fil indisponible) : la section disparaît. -->
  <section v-if="posts.length" class="dashboard-section feed">
    <div class="section-header">
      <h2 class="section-header__title">
        <i class="bi bi-people"></i>
        Publications de tes abonnements
      </h2>
    </div>
    <ul class="feed__list">
      <li v-for="post in posts" :key="post._id" class="feed__item">
        <div class="feed__meta">
          <router-link
            v-if="post.author?.username"
            :to="{ name: 'profile', params: { id: post.author.username } }"
            class="feed__author"
          >@{{ post.author.username }}</router-link>
          <VerifiedBadge v-if="post.author?.isIdentityVerified" :size="12" />
          <span class="feed__date">{{ formatRelative(post.createdAt) }}</span>
        </div>
        <p class="feed__content">{{ post.content }}</p>
        <div v-if="post.images?.length" class="feed__images">
          <img v-for="(image, i) in post.images" :key="i" :src="mediaUrl(image)" alt="Image de la publication" loading="lazy" decoding="async" />
        </div>
        <div class="feed__counts">
          <span><i class="bi bi-heart"></i> {{ post.likesCount || 0 }}</span>
          <span><i class="bi bi-chat"></i> {{ post.repliesCount || 0 }}</span>
        </div>
      </li>
    </ul>
    <div v-if="page < pages" class="feed__more">
      <button type="button" class="btn btn-ghost btn-sm" :disabled="loading" @click="loadPage(page + 1)">
        Voir plus de publications
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import VerifiedBadge from '@/components/VerifiedBadge.vue'
import feedPostService from '@/services/feedPost.service'
import { formatRelative, mediaUrl } from '@/utils/format'

/** Fil social du tableau de bord : publications des membres suivis (GET /api/posts/feed). */

defineOptions({ name: 'DashboardFeed' })

const FEED_PAGE_SIZE = 5

interface FeedPost {
  _id: string
  author?: { username?: string; isIdentityVerified?: boolean }
  content: string
  images?: string[]
  likesCount?: number
  repliesCount?: number
  createdAt: string
}

const posts = ref<FeedPost[]>([])
const page = ref(0)
const pages = ref(0)
const loading = ref(false)

async function loadPage(pageToLoad: number) {
  loading.value = true
  try {
    const data = await feedPostService.getFeed(pageToLoad, FEED_PAGE_SIZE)
    posts.value = pageToLoad === 1 ? data.posts ?? [] : [...posts.value, ...(data.posts ?? [])]
    page.value = pageToLoad
    pages.value = data.pagination?.totalPages ?? 0
  } catch {
    // Le fil est un complément du tableau de bord : en cas d'échec, il ne s'affiche pas.
  } finally {
    loading.value = false
  }
}

onMounted(() => loadPage(1))
</script>

<style lang="scss" scoped>
// Mêmes titres de section que le tableau de bord, dont les styles sont scopés.
.section-header {
  margin-bottom: var(--space-lg);
}

.section-header__title {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: 700;
}

.feed__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  margin: 0;
  padding: 0;
  list-style: none;
}

.feed__item {
  padding: var(--space-md);
  background: var(--bg-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-lg);
}

.feed__meta {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-size-sm);
}

.feed__author {
  font-weight: 600;
  color: var(--text-primary);
  text-decoration: none;

  &:hover { color: var(--accent-pink); }
}

.feed__date {
  margin-left: auto;
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.feed__content {
  margin: var(--space-sm) 0;
  color: var(--text-secondary);
  white-space: pre-line;
  word-break: break-word;
}

.feed__images {
  display: flex;
  gap: var(--space-sm);
  overflow-x: auto;

  img {
    width: 120px;
    height: 120px;
    object-fit: cover;
    border-radius: var(--radius-md);
  }
}

.feed__counts {
  display: flex;
  gap: var(--space-md);
  margin-top: var(--space-sm);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.feed__more {
  display: flex;
  justify-content: center;
  padding-top: var(--space-md);
}
</style>
