<template>
  <main class="page">
    <div class="catalog-page">
      <div v-if="state === 'loading'" class="catalog-status" role="status">
        <i class="bi bi-hourglass-split"></i>
        <p>Chargement de l'album…</p>
      </div>

      <div v-else-if="state === 'not-found'" class="catalog-status">
        <i class="bi bi-search"></i>
        <h1>Album introuvable</h1>
        <router-link to="/" class="btn btn-primary">
          <i class="bi bi-house"></i> Retour à l'accueil
        </router-link>
      </div>

      <div v-else-if="state === 'error'" class="catalog-status">
        <i class="bi bi-wifi-off"></i>
        <h1>Impossible de charger l'album</h1>
        <button type="button" class="btn btn-primary" @click="load">
          <i class="bi bi-arrow-clockwise"></i> Réessayer
        </button>
      </div>

      <template v-else-if="album">
        <header class="catalog-header">
          <img
            v-if="album.coverImage"
            class="catalog-header__image"
            :src="mediaUrl(album.coverImage)"
            :alt="album.name"
          />
          <div class="catalog-header__body">
            <h1 class="catalog-header__title">{{ album.name }}</h1>
            <ul class="catalog-header__meta">
              <li v-if="artist">
                <i class="bi bi-people"></i>
                <router-link :to="{ name: 'group', params: { id: artist.id } }">{{ artist.name }}</router-link>
              </li>
              <li v-if="album.albumType"><i class="bi bi-disc"></i> {{ ALBUM_TYPE_LABELS[album.albumType] }}</li>
              <li v-if="album.releaseDate"><i class="bi bi-calendar3"></i> {{ formatDate(album.releaseDate, 'long') }}</li>
              <li v-if="album.totalTracks"><i class="bi bi-music-note-list"></i> {{ album.totalTracks }} titres</li>
            </ul>
          </div>
        </header>

        <section class="catalog-section">
          <h2 class="catalog-section__title"><i class="bi bi-bag"></i> Annonces</h2>
          <Grid v-if="listings.products.value.length" :dataList="listings.products.value" />
          <p v-else-if="listings.failed.value" class="catalog-empty">Impossible de charger les annonces.</p>
          <p v-else-if="!listings.loading.value" class="catalog-empty">Aucune annonce en vente pour cet album.</p>
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
import { useRoute } from 'vue-router'
import Grid from '@/components/grid.vue'
import albumService, { type AlbumType, type KpopAlbum } from '@/services/album.service'
import { apiErrorResponse } from '@/services/apiError'
import { useCatalogListings } from '@/composables/useCatalogListings'
import { formatDate, mediaUrl } from '@/utils/format'

/** Page publique d'un album (/albums/:id) : fiche et annonces en vente. */

defineOptions({ name: 'AlbumView' })

type LoadState = 'loading' | 'loaded' | 'not-found' | 'error'

const SITE_NAME = 'MyKpopTrade'
const NOT_FOUND_STATUSES = [400, 404]
const ALBUM_TYPE_LABELS: Record<AlbumType, string> = {
  album: 'Album',
  single: 'Single',
  ep: 'EP',
  compilation: 'Compilation'
}

const route = useRoute()
const state = ref<LoadState>('loading')
const album = ref<KpopAlbum | null>(null)
const listings = useCatalogListings()

const albumId = computed(() => String(route.params.id))

/** Groupe de l'album : peuplé par l'API, sinon seul le nom est connu (pas de lien). */
const artist = computed(() => {
  const artistRef = album.value?.artistId
  if (artistRef && typeof artistRef === 'object') return { id: artistRef._id, name: artistRef.name }
  if (typeof artistRef === 'string' && album.value?.artistName) return { id: artistRef, name: album.value.artistName }
  return null
})

async function load() {
  state.value = 'loading'
  try {
    album.value = await albumService.getAlbum(albumId.value)
    state.value = 'loaded'
    document.title = `${album.value.name} · ${SITE_NAME}`
  } catch (error) {
    const status = apiErrorResponse(error)?.status
    state.value = status !== undefined && NOT_FOUND_STATUSES.includes(status) ? 'not-found' : 'error'
    return
  }
  listings.load({ album: albumId.value })
}

watch(albumId, load, { immediate: true })
</script>

<style lang="scss" scoped>
@use '../../css/catalog.scss' as *;
</style>
