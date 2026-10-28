<template>
  <main class="page">
    <div class="product-page">
      <div v-if="state === 'loading'" class="product-page__status" role="status">
        <div class="product-page__spinner"></div>
        <p>Chargement de l'annonce…</p>
      </div>

      <div v-else-if="state === 'not-found'" class="product-page__status">
        <i class="bi bi-search product-page__icon"></i>
        <h1 class="product-page__title">Annonce introuvable</h1>
        <p class="product-page__text">
          Cette annonce n'existe pas, a été retirée de la vente ou supprimée.
        </p>
        <router-link to="/" class="btn btn-primary">
          <i class="bi bi-house"></i> Retour à l'accueil
        </router-link>
      </div>

      <div v-else-if="state === 'error'" class="product-page__status">
        <i class="bi bi-wifi-off product-page__icon"></i>
        <h1 class="product-page__title">Impossible de charger l'annonce</h1>
        <p class="product-page__text">Vérifie ta connexion, puis réessaie.</p>
        <button type="button" class="btn btn-primary" @click="load">
          <i class="bi bi-arrow-clockwise"></i> Réessayer
        </button>
      </div>

      <PostDetail
        v-else-if="detail"
        :id-post="detail.product._id"
        :product="detail"
        @close-post="close"
        @sold="load"
      />
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PostDetail from '@/components/post.vue'
import postService from '@/services/post.service'
import { apiErrorStatus } from '@/services/apiError'
import type { PostResponse } from '@/types/post.types'

/** Fiche produit partageable (/products/:id), consultable sans compte. */

type LoadState = 'loading' | 'loaded' | 'not-found' | 'error'

const SITE_NAME = 'MyKpopTrade'
/** 400 : identifiant mal formé, donc aucune annonce à cette adresse non plus. */
const NOT_FOUND_STATUSES = [400, 404]

const route = useRoute()
const router = useRouter()
const state = ref<LoadState>('loading')
const detail = ref<PostResponse | null>(null)

async function load() {
  state.value = 'loading'
  detail.value = null
  try {
    detail.value = await postService.getPost(route.params.id as string)
    state.value = 'loaded'
    document.title = `${detail.value.product.title} · ${SITE_NAME}`
  } catch (error) {
    const status = apiErrorStatus(error)
    state.value = status !== undefined && NOT_FOUND_STATUSES.includes(status) ? 'not-found' : 'error'
    if (state.value === 'not-found') {
      document.title = `Annonce introuvable · ${SITE_NAME}`
    }
  }
}

/** Fermer la fiche : revenir d'où l'on vient, ou à l'accueil si on est arrivé par le lien. */
function close() {
  if (window.history.state?.back) {
    router.back()
  } else {
    router.push('/')
  }
}

watch(() => route.params.id, load, { immediate: true })
</script>

<style lang="scss" scoped>
.product-page {
  min-height: 100vh;
  padding: var(--space-xl) var(--space-md);
  padding-top: calc(var(--navbar-height) + var(--space-xl));
  background: var(--bg-primary);
}

.product-page__status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  max-width: 480px;
  margin: var(--space-3xl) auto 0;
  text-align: center;
}

.product-page__icon {
  font-size: 2.5rem;
  color: var(--text-muted);
}

.product-page__title {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: 800;
}

.product-page__text {
  margin: 0;
  color: var(--text-muted);
}

.product-page__spinner {
  width: 36px;
  height: 36px;
  border: 3px solid var(--surface-border);
  border-top-color: var(--accent-pink);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
</style>
