<template>
  <main class="page">
    <div class="catalog-page">
      <div v-if="state === 'loading'" class="catalog-status" role="status">
        <i class="bi bi-hourglass-split"></i>
        <p>Chargement du groupe…</p>
      </div>

      <div v-else-if="state === 'not-found'" class="catalog-status">
        <i class="bi bi-search"></i>
        <h1>Groupe introuvable</h1>
        <router-link to="/" class="btn btn-primary">
          <i class="bi bi-house"></i> Retour à l'accueil
        </router-link>
      </div>

      <div v-else-if="state === 'error'" class="catalog-status">
        <i class="bi bi-wifi-off"></i>
        <h1>Impossible de charger le groupe</h1>
        <button type="button" class="btn btn-primary" @click="load">
          <i class="bi bi-arrow-clockwise"></i> Réessayer
        </button>
      </div>

      <template v-else-if="group">
        <header class="catalog-header">
          <img
            v-if="group.profileImage"
            class="catalog-header__image"
            :src="mediaUrl(group.profileImage)"
            :alt="group.name"
            @error="hideImage"
          />
          <div class="catalog-header__body">
            <h1 class="catalog-header__title">{{ group.name }}</h1>
            <ul class="catalog-header__meta">
              <li v-if="group.genres?.length"><i class="bi bi-music-note-beamed"></i> {{ group.genres.join(', ') }}</li>
              <li><i class="bi bi-people"></i> {{ followersLabel }}</li>
              <li v-if="albums.length"><i class="bi bi-disc"></i> {{ albums.length }} album{{ albums.length > 1 ? 's' : '' }}</li>
            </ul>
          </div>
          <button
            type="button"
            class="btn"
            :class="isFollowing ? 'btn-secondary' : 'btn-primary'"
            :disabled="followPending"
            @click="toggleFollow"
          >
            <i :class="isFollowing ? 'bi bi-check-lg' : 'bi bi-plus-lg'"></i>
            {{ isFollowing ? 'Suivi' : 'Suivre' }}
          </button>
        </header>

        <section v-if="members.length" class="catalog-section">
          <h2 class="catalog-section__title"><i class="bi bi-person-badge"></i> Membres</h2>
          <!-- Un membre filtre les annonces ci-dessous ; re-cliquer retire le filtre. -->
          <div class="catalog-chips">
            <button
              v-for="member in members"
              :key="member"
              type="button"
              class="catalog-chip"
              :class="{ 'catalog-chip--active': member === selectedMember }"
              :aria-pressed="member === selectedMember"
              @click="selectMember(member)"
            >{{ member }}</button>
          </div>
        </section>

        <section v-if="albums.length" class="catalog-section">
          <h2 class="catalog-section__title"><i class="bi bi-disc"></i> Albums</h2>
          <div class="catalog-tiles">
            <router-link
              v-for="album in albums"
              :key="album._id"
              :to="{ name: 'album', params: { id: album._id } }"
              class="catalog-tile"
            >
              <img :src="mediaUrl(album.coverImage)" :alt="album.name" loading="lazy" decoding="async" />
              <span>{{ album.name }}</span>
              <small v-if="album.releaseDate">{{ formatDate(album.releaseDate) }}</small>
            </router-link>
          </div>
        </section>

        <section class="catalog-section">
          <h2 class="catalog-section__title">
            <i class="bi bi-bag"></i>
            Annonces{{ selectedMember ? ` — ${selectedMember}` : '' }}
          </h2>
          <Grid v-if="listings.products.value.length" :data-list="listings.products.value" />
          <p v-else-if="listings.failed.value" class="catalog-empty">Impossible de charger les annonces.</p>
          <p v-else-if="!listings.loading.value" class="catalog-empty">Aucune annonce en vente pour l'instant.</p>
          <div v-if="listings.hasMore.value" class="catalog-more">
            <button type="button" class="btn btn-ghost" :disabled="listings.loading.value" @click="listings.loadMore()">
              Voir plus d'annonces
            </button>
          </div>
        </section>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Grid from '@/components/grid.vue'
import groupService, { type KpopGroup } from '@/services/group.service'
import type { KpopAlbum } from '@/services/album.service'
import { apiErrorStatus } from '@/services/apiError'
import { hasSession } from '@/services/session.cookies'
import { useCatalogListings } from '@/composables/useCatalogListings'
import { formatDate, mediaUrl } from '@/utils/format'
import { func } from '@/function'

/** Page publique d'un groupe (/groups/:id) : fiche, membres, albums et annonces en vente. */

defineOptions({ name: 'GroupView' })

type LoadState = 'loading' | 'loaded' | 'not-found' | 'error'

const SITE_NAME = 'MyKpopTrade'
/** 400 : identifiant mal formé, donc aucun groupe à cette adresse non plus. */
const NOT_FOUND_STATUSES = [400, 404]

const route = useRoute()
const router = useRouter()
const state = ref<LoadState>('loading')
const group = ref<KpopGroup | null>(null)
const albums = ref<KpopAlbum[]>([])
const isFollowing = ref(false)
const followersCount = ref(0)
const followPending = ref(false)
const selectedMember = ref<string | null>(null)
const listings = useCatalogListings()

const groupId = computed(() => String(route.params.id))
const members = computed(() => group.value?.members ?? [])
const followersLabel = computed(() =>
  `${followersCount.value} abonné${followersCount.value > 1 ? 's' : ''}`
)

async function load() {
  state.value = 'loading'
  selectedMember.value = null
  try {
    const detail = await groupService.getGroupDetail(groupId.value)
    group.value = detail.group
    albums.value = detail.albums
    followersCount.value = detail.group.followersCount ?? 0
    state.value = 'loaded'
    document.title = `${detail.group.name} · ${SITE_NAME}`
  } catch (error) {
    const status = apiErrorStatus(error)
    state.value = status !== undefined && NOT_FOUND_STATUSES.includes(status) ? 'not-found' : 'error'
    return
  }
  listings.load({ group: groupId.value })
  // Anonyme : le statut exigerait une session, et le bouton renvoie à la connexion.
  isFollowing.value = hasSession() ? await groupService.getFollowStatus(groupId.value) : false
}

function selectMember(member: string) {
  selectedMember.value = selectedMember.value === member ? null : member
  listings.load({ group: groupId.value, ...(selectedMember.value ? { member: selectedMember.value } : {}) })
}

async function toggleFollow() {
  if (!hasSession()) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  followPending.value = true
  try {
    const result = await groupService.toggleFollow(groupId.value)
    isFollowing.value = result.isFollowing
    followersCount.value = result.followersCount
  } catch {
    func.showToastError('Impossible de mettre à jour le suivi du groupe. Réessayez.')
  } finally {
    followPending.value = false
  }
}

/** Image absente ou cassée (lien Spotify expiré) : on n'affiche pas d'icône brisée. */
function hideImage(event: Event) {
  (event.target as HTMLImageElement).style.display = 'none'
}

watch(groupId, load, { immediate: true })
</script>

<style lang="scss" scoped>
@use '../../css/catalog.scss' as *;
</style>
