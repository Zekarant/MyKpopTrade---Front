<template>
  <main class="page">
    <div class="catalog-page">
      <header class="catalog-section">
        <h1 class="catalog-header__title"><i class="bi bi-stars"></i> Mes groupes suivis</h1>
      </header>

      <div v-if="loading && !groups.length" class="catalog-status" role="status">
        <i class="bi bi-hourglass-split"></i>
        <p>Chargement…</p>
      </div>

      <p v-else-if="failed" class="catalog-empty">Impossible de charger vos groupes suivis.</p>

      <div v-else-if="!groups.length" class="catalog-status">
        <i class="bi bi-heart"></i>
        <p>Vous ne suivez encore aucun groupe. Suivez-en un depuis sa page pour le retrouver ici.</p>
      </div>

      <div v-else class="catalog-tiles">
        <router-link
          v-for="group in groups"
          :key="group._id"
          :to="{ name: 'group', params: { id: group._id } }"
          class="catalog-tile"
        >
          <img :src="mediaUrl(group.profileImage)" :alt="group.name" loading="lazy" decoding="async" />
          <span>{{ group.name }}</span>
          <small>{{ group.followersCount ?? 0 }} abonné{{ (group.followersCount ?? 0) > 1 ? 's' : '' }}</small>
        </router-link>
      </div>

      <div v-if="page < pages" class="catalog-more">
        <button type="button" class="btn btn-ghost" :disabled="loading" @click="loadPage(page + 1)">
          Voir plus
        </button>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import groupService, { type KpopGroup } from '@/services/group.service'
import { mediaUrl } from '@/utils/format'

/** Groupes suivis par le membre connecté (/adherents/groups). */

defineOptions({ name: 'FollowedGroupsView' })

const groups = ref<KpopGroup[]>([])
const page = ref(0)
const pages = ref(0)
const loading = ref(false)
const failed = ref(false)

async function loadPage(pageToLoad: number) {
  loading.value = true
  failed.value = false
  try {
    const response = await groupService.getMyFollowedGroupsPage(pageToLoad)
    groups.value = pageToLoad === 1 ? response.groups : [...groups.value, ...response.groups]
    page.value = pageToLoad
    pages.value = response.pagination?.pages ?? 0
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => loadPage(1))
</script>

<style lang="scss" scoped>
@use '../../css/catalog.scss' as *;

.catalog-header__title i { color: var(--accent-pink); }
</style>
