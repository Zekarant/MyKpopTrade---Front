<template>
  <!-- À propos : lecture seule, l'édition est dans les paramètres. -->
  <div class="about-section">
    <div class="about-card">
      <div v-if="isOwnProfile" class="about-card__edit-bar">
        <span class="about-card__edit-hint">
          <i class="bi bi-eye"></i> Voici ce que voient les autres membres.
        </span>
        <router-link
          to="/adherents/settings?section=profil"
          class="about-card__edit-btn"
        >
          <i class="bi bi-pencil"></i> Modifier mon profil
        </router-link>
      </div>

      <!-- Bio -->
      <div class="about-card__block">
        <h3 class="about-card__title"><i class="bi bi-person-lines-fill"></i> Description</h3>
        <p v-if="profile.bio" class="about-card__bio">{{ profile.bio }}</p>
        <p v-else class="about-card__bio about-card__bio--empty">
          Aucune description renseignée.
        </p>
      </div>

      <!-- Infos -->
      <div class="about-card__block">
        <h3 class="about-card__title"><i class="bi bi-info-circle"></i> Informations</h3>
        <div class="about-card__grid">
          <div class="about-card__row">
            <span class="about-card__label">Nom d'utilisateur</span>
            <span class="about-card__value">{{ profile.username }}</span>
          </div>
          <div v-if="profile.location" class="about-card__row">
            <span class="about-card__label">Lieu de résidence</span>
            <span class="about-card__value">{{ profile.location }}</span>
          </div>
        </div>
      </div>

      <!-- Réseaux sociaux -->
      <div v-if="hasSocialLinks || isOwnProfile" class="about-card__block">
        <h3 class="about-card__title"><i class="bi bi-share"></i> Réseaux sociaux</h3>
        <div v-if="hasSocialLinks" class="about-card__grid">
          <div v-if="links.instagram" class="about-card__row">
            <span class="about-card__label"><i class="bi bi-instagram"></i> Instagram</span>
            <span class="about-card__value">{{ links.instagram }}</span>
          </div>
          <div v-if="links.twitter" class="about-card__row">
            <span class="about-card__label"><i class="bi bi-twitter-x"></i> X (Twitter)</span>
            <span class="about-card__value">{{ links.twitter }}</span>
          </div>
          <div v-if="links.discord" class="about-card__row">
            <span class="about-card__label"><i class="bi bi-discord"></i> Discord</span>
            <span class="about-card__value">{{ links.discord }}</span>
          </div>
        </div>
        <p v-else class="about-card__bio about-card__bio--empty">
          Aucun réseau social renseigné.
        </p>
      </div>

      <!-- Confiance : chiffres publics, utiles avant un échange avec ce membre. -->
      <div v-if="trustStats" class="about-card__block">
        <h3 class="about-card__title"><i class="bi bi-shield-check"></i> Confiance</h3>
        <div class="about-card__grid">
          <div class="about-card__row">
            <span class="about-card__label">Ventes</span>
            <span class="about-card__value">{{ trustStats.totalSales }}</span>
          </div>
          <div class="about-card__row">
            <span class="about-card__label">Achats</span>
            <span class="about-card__value">{{ trustStats.totalPurchases }}</span>
          </div>
          <div class="about-card__row">
            <span class="about-card__label">Preuves de transaction vérifiées</span>
            <span class="about-card__value">{{ trustStats.verified }}</span>
          </div>
          <div v-if="isOwnProfile && trustStats.pending" class="about-card__row">
            <span class="about-card__label">Preuves en attente de vérification</span>
            <span class="about-card__value">{{ trustStats.pending }}</span>
          </div>
        </div>
      </div>

      <!-- Date + Certif -->
      <div class="about-card__footer">
        <span v-if="profile.createdAt" class="about-card__date">
          <i class="bi bi-calendar3"></i> Membre depuis le {{ memberSince }}
        </span>
        <div v-if="profile.isSellerVerified" class="about-card__badge">
          <img src="@/assets/images/certif.svg" alt="Certifié" width="20" />
          <span>Compte certifié</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import userService, { type VerificationStats } from '@/services/user.service'
import { profileIdOf, type ProfileInfo } from './types'

const props = defineProps<{ profile: ProfileInfo; isOwnProfile: boolean }>()

const trustStats = ref<VerificationStats | null>(null)

watch(
  () => profileIdOf(props.profile),
  async (userId) => {
    trustStats.value = null
    if (!userId) return
    try {
      trustStats.value = await userService.getVerificationStats(userId)
    } catch {
      // Indicateurs indisponibles : le reste de la fiche s'affiche sans eux.
    }
  },
  { immediate: true }
)

const links = computed(() => props.profile.socialLinks || {})

const hasSocialLinks = computed(() =>
  Boolean(links.value.instagram || links.value.twitter || links.value.discord)
)

const memberSince = computed(() =>
  props.profile.createdAt
    ? new Date(props.profile.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : ''
)
</script>
