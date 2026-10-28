<template>
  <div class="profile-tab-content">
    <div v-if="isOwnProfile" class="annonce-header">
      <button class="annonce-add-btn" @click="router.push({ name: 'add_post' })">
        <i class="bi bi-plus-lg"></i> Créer une annonce
      </button>
    </div>
    <Grid v-if="products.length" :style="{ width: '100%' }" :admin="isOwnProfile" :data-user="profile" :data-list="activeProducts"></Grid>
    <div v-else class="empty-state">
      <i class="bi bi-megaphone"></i>
      <p>Aucune annonce pour le moment.</p>
      <button v-if="isOwnProfile" class="empty-state__btn" @click="router.push({ name: 'add_post' })">
        Publier ma première annonce
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Grid from '@/components/grid.vue'
import postService from '@/services/post.service'
import type { ProfileInfo } from './types'

const props = defineProps<{ profile: ProfileInfo; profileUserId: string; isOwnProfile: boolean }>()

const router = useRouter()

/** Annonce telle que la grille l'affiche, plus son statut éventuel. */
type Product = InstanceType<typeof Grid>['$props']['dataList'][number] & { status?: string }

const products = ref<Product[]>([])

const activeProducts = computed(() =>
  products.value.filter((product) => product.status === 'available' || !product.status)
)

/** Mes annonces n'attendent pas le chargement du profil ; celles d'un membre demandent son identifiant. */
async function loadProducts() {
  if (!props.isOwnProfile && !props.profileUserId) return
  try {
    const page = props.isOwnProfile
      ? await postService.getInventory()
      : await postService.getUserInventory(props.profileUserId)
    products.value = page.products as Product[]
  } catch (error) {
    console.error('Erreur lors du chargement de l\'inventaire:', error)
  }
}

watch(() => [props.isOwnProfile, props.profileUserId], loadProducts, { immediate: true })
</script>
